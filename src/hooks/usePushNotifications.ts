/**
 * usePushNotifications.ts
 * 
 * Hook personnalisé pour gérer l'auto-enregistrement des tokens push.
 * À utiliser dans le AuthProvider pour connecter automatiquement
 * l'utilisateur à la réception des notifications.
 */

import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotificationsAsync,
  savePushTokenToSupabase,
} from '@/lib/notifications';

interface UsePushNotificationsOptions {
  userId?: string | null;
  enabled?: boolean;
}

/**
 * Hook qui gère automatiquement l'enregistrement du token push.
 * 
 * Flux :
 * 1. Demande les permissions push à l'utilisateur
 * 2. Récupère le token Expo Push
 * 3. Sauvegarde le token dans la table user_push_tokens
 * 4. Met en place un listener pour les notifications entrantes
 * 
 * @param options - { userId, enabled }
 *   - userId: L'UUID de l'utilisateur (requis pour sauvegarder le token)
 *   - enabled: false pour désactiver temporairement (par défaut: true)
 * 
 * @example
 * ```tsx
 * const { user } = useAuth();
 * usePushNotifications({ userId: user?.id, enabled: !!user });
 * ```
 */
export function usePushNotifications(options: UsePushNotificationsOptions = {}): void {
  const { userId, enabled = true } = options;
  const registeredRef = useRef(false);

  // Effet principal : enregistrement du token
  useEffect(() => {
    if (!enabled || !userId || registeredRef.current) return;

    let isMounted = true;

    const registerToken = async () => {
      try {
        // 1. Demander les permissions et récupérer le token
        const token = await registerForPushNotificationsAsync();

        // Si pas de token (simulateur ou permission refusée), on sort
        if (!token) {
          console.warn('[usePushNotifications] Aucun token obtenu.');
          return;
        }

        // 2. Vérifier que le composant est toujours monté
        if (!isMounted) return;

        // 3. Sauvegarder le token dans Supabase
        await savePushTokenToSupabase(userId, token);
        console.log('[usePushNotifications] Token enregistré avec succès :', token);

        registeredRef.current = true;
      } catch (error) {
        console.error('[usePushNotifications] Erreur lors de l\'enregistrement :', error);
      }
    };

    registerToken();

    return () => {
      isMounted = false;
    };
  }, [userId, enabled]);

  // Effet secondaire : listener des notifications reçues
  useEffect(() => {
    if (!enabled) return;

    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[usePushNotifications] Notification reçue :', notification);
      // Vous pouvez ajouter ici une logique personnalisée
      // (ex: une alerte, un son, une mise à jour UI, etc.)
    });

    return () => {
      subscription.remove();
    };
  }, [enabled]);

  // Effet tertiaire : listener des notifications sur lesquelles on a cliqué
  useEffect(() => {
    if (!enabled) return;

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const { notification } = response;
      console.log('[usePushNotifications] Notification clickée :', notification);

      // Optionnel : deep linking
      // const missionId = notification.request.content.data?.missionId;
      // if (missionId) {
      //   router.push(`/mission/${missionId}`);
      // }
    });

    return () => {
      subscription.remove();
    };
  }, [enabled]);
}

export default usePushNotifications;
