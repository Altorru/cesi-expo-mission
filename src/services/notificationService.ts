/**
 * notificationService.ts — Notifications métier
 *
 * Ce service gère l'envoi de notifications push structurées pour les événements métier :
 * - Création d'une mission
 * - Modification d'une mission
 * - Ajout d'un commentaire
 *
 * Utilise l'API Expo Push pour envoyer à tous les tokens enregistrés.
 */

import { supabase } from '@/lib/supabase';
import type { Mission, Comment } from '@/types/mission';

// ─────────────────────────────────────────────────────────────────────────────
// Types pour les notifications
// ─────────────────────────────────────────────────────────────────────────────

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data: Record<string, string | number>;
  sound?: 'default';
  priority?: 'default' | 'high';
}

interface NotificationData {
  screen: 'mission-detail' | 'mission-tabs' | 'comment';
  missionId?: string;
  commentId?: string;
  action?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Récupérer tous les tokens Expo Push
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Récupère tous les tokens enregistrés depuis la table user_push_tokens.
 * Exclut les tokens défaillants ou périmés.
 */
async function getAllPushTokens(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('user_push_tokens')
      .select('token')
      .not('token', 'is', null);

    if (error) {
      console.error('[Notifications] Erreur Supabase :', error.message);
      return [];
    }

    return (data || [])
      .map((row: { token: string | null }) => row.token)
      .filter((token): token is string => Boolean(token));
  } catch (err) {
    console.error('[Notifications] Erreur getAllPushTokens :', err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Envoyer les notifications
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Envoie un batch de messages push via l'API Expo.
 * @param messages  Liste des messages au format Expo
 */
async function sendBatchToExpoAPI(messages: PushMessage[]): Promise<void> {
  if (messages.length === 0) {
    console.warn('[Notifications] Aucun message à envoyer.');
    return;
  }

  try {
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
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    console.log(`[Notifications] ✅ ${messages.length} notification(s) envoyée(s)`);
  } catch (err) {
    console.error('[Notifications] Erreur envoi Expo API :', err);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1️⃣ NOTIFICATION : Création d'une mission
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Envoie une notification push quand une mission est créée.
 * @param missionTitle Titre de la mission créée
 * @param missionId ID optionnel de la mission (pour deep linking)
 * @param authorName Nom de l'auteur
 */
export async function notifyMissionCreated(
  missionTitle: string,
  authorName: string,
  missionId?: string
): Promise<void> {
  const tokens = await getAllPushTokens();
  if (tokens.length === 0) return;

  const title = `📋 Nouvelle mission`;
  const body = `${authorName} a créé: "${missionTitle}"`;

  const data: NotificationData & Record<string, string | number> = {
    screen: 'mission-detail',
    action: 'created',
  };

  if (missionId) data.missionId = missionId;

  const messages: PushMessage[] = tokens.map((to) => ({
    to,
    title,
    body,
    data,
    sound: 'default',
    priority: 'high',
  }));

  await sendBatchToExpoAPI(messages);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2️⃣ NOTIFICATION : Modification d'une mission
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Envoie une notification push quand une mission est modifiée.
 * @param missionTitle Titre de la mission
 * @param missionId ID de la mission
 * @param modifierName Nom de celui qui a modifié
 * @param changeType Type de modification (updated ou state-changed)
 */
export async function notifyMissionModified(
  missionTitle: string,
  missionId: string,
  modifierName: string,
  changeType: 'updated' | 'state-changed'
): Promise<void> {
  const tokens = await getAllPushTokens();
  if (tokens.length === 0) return;

  const title =
    changeType === 'state-changed'
      ? `✅ Statut mise à jour`
      : `✏️ Mission modifiée`;

  const body =
    changeType === 'state-changed'
      ? `${modifierName} a mis à jour le statut de "${missionTitle}"`
      : `${modifierName} a modifié "${missionTitle}"`;

  const data: NotificationData & Record<string, string | number> = {
    screen: 'mission-detail',
    missionId,
    action: changeType,
  };

  const messages: PushMessage[] = tokens.map((to) => ({
    to,
    title,
    body,
    data,
    sound: 'default',
    priority: 'default',
  }));

  await sendBatchToExpoAPI(messages);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3️⃣ NOTIFICATION : Ajout d'un commentaire
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Envoie une notification push quand un commentaire est ajouté.
 * @param missionTitle Titre de la mission
 * @param missionId ID de la mission
 * @param authorName Nom de l'auteur du commentaire
 */
export async function notifyCommentAdded(
  missionTitle: string,
  missionId: string,
  authorName: string
): Promise<void> {
  const tokens = await getAllPushTokens();
  if (tokens.length === 0) return;

  const title = `💬 Nouveau commentaire`;
  const body = `${authorName} a répondu sur "${missionTitle}"`;

  const data: NotificationData & Record<string, string | number> = {
    screen: 'mission-detail',
    missionId,
    action: 'comment-added',
  };

  const messages: PushMessage[] = tokens.map((to) => ({
    to,
    title,
    body,
    data,
    sound: 'default',
    priority: 'default',
  }));

  await sendBatchToExpoAPI(messages);
}

// ─────────────────────────────────────────────────────────────────────────────
// 🗑️ NOTIFICATION : Suppression d'une mission
// ─────────────────────────────────────────────────────────────────────────────

export async function notifyMissionDeleted(
  missionTitle: string,
  deleterName: string
): Promise<void> {
  const tokens = await getAllPushTokens();
  if (tokens.length === 0) return;

  const title = `🗑️ Mission supprimée`;
  const body = `${deleterName} a supprimé "${missionTitle}"`;

  const data: NotificationData & Record<string, string | number> = {
    screen: 'mission-tabs',
    action: 'deleted',
  };

  const messages: PushMessage[] = tokens.map((to) => ({
    to,
    title,
    body,
    data,
    sound: 'default',
    priority: 'default',
  }));

  await sendBatchToExpoAPI(messages);
}
