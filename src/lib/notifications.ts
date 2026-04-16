/**
 * notifications.ts — Push Notifications Expo
 *
 * Gestion du cycle complet des notifications push :
 * 1) Initialisation du handler de notifications
 * 2) Demande de permissions + récupération du token Expo Push
 * 3) Sauvegarde du token dans Supabase (table user_push_tokens)
 * 4) Deep linking vers les screens appropriés
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { savePushToken } from '@/services/pushTokenService';

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
// a) Demander les permissions + récupérer le token Expo Push
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
// b) Sauvegarder le token dans Supabase (table user_push_tokens)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sauvegarde le token Expo Push d'un utilisateur dans la table user_push_tokens.
 * Délègue à pushTokenService.savePushToken() pour la gestion réelle.
 *
 * @param userId  L'UUID de l'utilisateur (auth.users.id)
 * @param token   Le token Expo Push retourné par registerForPushNotificationsAsync
 * @throws {Error} Si la sauvegarde échoue
 */
export async function savePushTokenToSupabase(
  userId: string,
  token: string
): Promise<void> {
  await savePushToken(userId, token);
}

// ─────────────────────────────────────────────────────────────────────────────
// Deep Linking — Gérer les notifications et rediriger vers les screens
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gère la redirection quand l'utilisateur clique sur une notification.
 * Retourne l'URL de deep linking basée sur les données de la notification.
 *
 * @param notification  Les données reçues de la notification
 * @returns L'URL de deep linking (ex: "app://mission/123")
 */
export function getNotificationLink(
  notification: Notifications.Notification
): string | null {
  const data = notification.request.content.data as Record<string, any>;

  if (!data?.screen) {
    return null;
  }

  const { screen, missionId } = data;

  if (screen === 'mission-detail' && missionId) {
    return `app://mission/${missionId}`;
  }

  if (screen === 'mission-tabs') {
    return `app://missions`;
  }

  return null;
}

/**
 * Listener pour les notifications reçues en ligne (app ouverte).
 * Optionnel : afficher une banner ou naviguer spontanément.
 */
export function getNotificationListeners() {
  return {
    // Quand on reçoit une notification en ligne
    onNotificationReceived: (notification: Notifications.Notification) => {
      console.log('[Notifications] Reçue (en ligne):', notification.request.content.title);
    },

    // Quand on clique sur une notification (peu importe si l'app est ouverte)
    onNotificationTapped: (notification: Notifications.Notification) => {
      const link = getNotificationLink(notification);
      if (link) {
        console.log('[Notifications] Navigation vers:', link);
        return link; // Le routeur va l'utiliser pour router
      }
    },
  };
}
