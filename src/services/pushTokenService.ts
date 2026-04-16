/**
 * pushTokenService.ts
 * 
 * Service centralisé pour gérer les tokens push des utilisateurs.
 * Interagit avec la table Supabase : user_push_tokens(user_id, token, updated_at)
 */

import { supabase } from '@/lib/supabase';

/**
 * Interface représentant un enregistrement de token push
 */
export interface PushTokenRecord {
  user_id: string;
  token: string;
  updated_at: string;
}

/**
 * Sauvegarde ou met à jour le token push pour un utilisateur.
 * Utilise l'upsert pour gérer les insertions et les mises à jour.
 * 
 * @param userId - UUID de l'utilisateur (auth.users.id)
 * @param token - Token Expo Push (format: ExponentPushToken[xxx])
 * @throws {Error} Si la sauvegarde échoue
 */
export async function savePushToken(userId: string, token: string): Promise<void> {
  const { error } = await supabase
    .from('user_push_tokens')
    .upsert(
      {
        user_id: userId,
        token,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    throw new Error(`[PushTokenService] Échec de la sauvegarde du token : ${error.message}`);
  }
}

/**
 * Récupère le token push stocké pour un utilisateur.
 * 
 * @param userId - UUID de l'utilisateur
 * @returns Le token ou null s'il n'existe pas
 * @throws {Error} Si la requête échoue
 */
export async function getPushToken(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_push_tokens')
    .select('token')
    .eq('user_id', userId)
    .single();

  if (error?.code === 'PGRST116') {
    // Pas de ligne trouvée — c'est normal
    return null;
  }

  if (error) {
    throw new Error(`[PushTokenService] Échec de la récupération du token : ${error.message}`);
  }

  return data?.token ?? null;
}

/**
 * Supprime le token pour un utilisateur (par ex. lors du logout).
 * 
 * @param userId - UUID de l'utilisateur
 * @throws {Error} Si la suppression échoue
 */
export async function deletePushToken(userId: string): Promise<void> {
  console.log('[PushTokenService] Suppression du token pour l\'utilisateur:', userId);

  const { error } = await supabase
    .from('user_push_tokens')
    .delete()
    .eq('user_id', userId);

  if (error) {
    throw new Error(`[PushTokenService] Échec de la suppression du token : ${error.message}`);
  }

  console.log('[PushTokenService] ✅ Token supprimé avec succès.');
}

/**
 * Récupère tous les tokens enregistrés dans la base.
 * ⚠️ À utiliser côté serveur uniquement (env variables d'authentification requises)
 * 
 * @returns Liste de tous les tokens (attention: données sensibles)
 * @throws {Error} Si la requête échoue
 */
export async function getAllPushTokens(): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_push_tokens')
    .select('token')
    .not('token', 'is', null);

  if (error) {
    throw new Error(`[PushTokenService] Échec de la récupération des tokens : ${error.message}`);
  }

  return (data ?? []).map((item) => item.token);
}

/**
 * Vérifier si un utilisateur a déjà un token enregistré.
 * 
 * @param userId - UUID de l'utilisateur
 * @returns true si un token existe
 */
export async function hasValidToken(userId: string): Promise<boolean> {
  const token = await getPushToken(userId);
  return Boolean(token);
}
