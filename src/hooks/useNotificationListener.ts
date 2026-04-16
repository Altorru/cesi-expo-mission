/**
 * useNotificationListener.ts — Hook pour gérer les notifications entrantes
 *
 * Ce hook écoute les notifications reçues (en ligne et hors ligne) et navigue
 * vers le bon screen basé sur les données de notification.
 */

import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

/**
 * Hook pour écouter les notifications et naviguer automatiquement.
 * À appeler une seule fois au démarrage de l'app (dans le layout root).
 */
export function useNotificationListener() {
  const router = useRouter();
  const notificationListenerRef = useRef<Notifications.Subscription | null>(null);
  const responseListenerRef = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // 1️⃣ Listener : Notification reçue en ligne (app ouverte)
    notificationListenerRef.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('[Notifications] Reçue (en ligne):', notification.request.content.title);
        // On peut afficher une banner ou ignorer, c'est transparent pour l'utilisateur
      }
    );

    // 2️⃣ Response Listener : Utilisateur clique sur la notification
    responseListenerRef.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, any>;
        console.log('[Notifications] Cliquée:', data);

        // Naviguer basé sur les données
        if (data.screen === 'mission-detail' && data.missionId) {
          router.push(`/mission/${data.missionId}`);
        } else if (data.screen === 'mission-tabs') {
          router.push('/(tabs)/missions');
        }
      }
    );

    // Cleanup
    return () => {
      if (notificationListenerRef.current) {
        Notifications.removeNotificationSubscription(notificationListenerRef.current);
      }
      if (responseListenerRef.current) {
        Notifications.removeNotificationSubscription(responseListenerRef.current);
      }
    };
  }, [router]);
}

/**
 * Hook pour récupérer la dernière notification qui a lancé l'app (quand elle était fermée)
 * Utile pour le deep linking au démarrage.
 */
export async function getInitialNotification(): Promise<{
  missionId?: string;
  screen?: string;
} | null> {
  try {
    const notification = await Notifications.getLastNotificationResponseAsync();
    return notification?.notification.request.content.data as any;
  } catch (err) {
    console.error('[Notifications] Erreur getInitialNotification:', err);
    return null;
  }
}
