/**
 * notifications.ts — Push Notifications avec Expo Go
 *
 * Ce module gère le cycle complet des notifications push :
 *  5a → Demande de permission + récupération du token Expo Push
 *  5b → Sauvegarde du token dans Supabase (table profiles, colonne push_token)
 *  5c → Récupération de tous les tokens + envoi batch à l'API Expo
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// ─────────────────────────────────────────────────────────────────────────────
// Initialisation du handler — appelé une seule fois au démarrage de l'app.
// Wrappé dans try/catch car expo-notifications jette sur Expo Go Android SDK 53+.
// ─────────────────────────────────────────────────────────────────────────────

let _handlerInitialized = false;

export function initNotificationHandler(): void {
  if (_handlerInitialized) return;
  _handlerInitialized = true;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    console.warn('[Notifications] setNotificationHandler non disponible :', e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5a — Demander les permissions + récupérer le token Expo Push
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Demande les permissions push à l'utilisateur et retourne
 * son Expo Push Token (ex: "ExponentPushToken[xxxxxx]").
 *
 * Retourne null si :
 *  - on n'est pas sur un appareil physique (simulateur)
 *  - l'utilisateur refuse la permission
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('[Notifications] Push notifications uniquement sur appareil physique.');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Notifications] Permission refusée par l\'utilisateur.');
      return null;
    }

    // Android : créer le canal de notification par défaut (requis SDK 26+)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    return tokenResponse.data;
  } catch (e) {
    console.warn('[Notifications] Impossible d\'obtenir le push token :', e);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5b — Sauvegarder le token dans Supabase (colonne push_token)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Upsert le push_token de l'utilisateur dans la table `profiles`.
 *
 * @param userId  L'UUID de l'utilisateur (auth.users.id)
 * @param token   Le token Expo Push retourné par registerForPushNotificationsAsync
 */
export async function savePushTokenToSupabase(
  userId: string,
  token: string
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, push_token: token }, { onConflict: 'id' });

  if (error) {
    throw new Error(`[Notifications] Échec de la sauvegarde du token : ${error.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5c — Récupérer tous les tokens et envoyer un batch à l'API Expo
// ─────────────────────────────────────────────────────────────────────────────

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Récupère tous les push_tokens enregistrés dans Supabase
 * puis envoie une notification push à tous les utilisateurs
 * via l'API Expo en une seule requête batch.
 *
 * @param payload  Le contenu de la notification (titre, corps, data optionnelle)
 */
export async function sendPushNotificationToAll(
  payload: PushPayload
): Promise<void> {
  // Récupérer tous les tokens non-nuls depuis Supabase
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('push_token')
    .not('push_token', 'is', null);

  if (error) {
    throw new Error(`[Notifications] Erreur Supabase lors de la récupération des tokens : ${error.message}`);
  }

  const tokens = (profiles ?? [])
    .map((p: { push_token: string | null }) => p.push_token)
    .filter((t): t is string => Boolean(t));

  if (tokens.length === 0) {
    console.warn('[Notifications] Aucun token enregistré, aucune notification envoyée.');
    return;
  }

  // Construire les messages au format Expo
  const messages = tokens.map((to) => ({
    to,
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
    sound: 'default' as const,
  }));

  // Envoi batch vers l'API Expo
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `[Notifications] Expo Push API — HTTP ${response.status} : ${text}`
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DEBUG — Envoyer une notification locale immédiate (for testing)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Planifie une notification locale qui s'affiche dans 1 seconde.
 * Utile pour tester le bon fonctionnement des notifs en dev.
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data ?? {},
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
      },
    });
  } catch (e) {
    console.warn('[Notifications] sendLocalNotification échoué :', e);
    throw e;
  }
}
