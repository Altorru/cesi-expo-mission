/**
 * userService — Résolution des UUIDs utilisateurs en full_name
 *
 * Requiert la vue suivante dans Supabase (SQL Editor) :
 *
 *   create or replace view public.users_view as
 *     select id,
 *       raw_user_meta_data->>'full_name' as full_name,
 *       email
 *     from auth.users;
 *
 *   grant select on public.users_view to authenticated;
 */
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserRecord {
  id: string;
  full_name: string | null;
  email: string | null;
}

/** Cache mémoire pour éviter les requêtes répétées dans la session */
const cache: Record<string, string> = {};

// ─── fetchUserPseudos ─────────────────────────────────────────────────────────

/**
 * Résout une liste d'UUIDs vers un record { uuid: label }.
 * label = full_name si existant, sinon la partie locale de l'email, sinon ''.
 */
export async function fetchUserPseudos(
  ids: (string | null | undefined)[],
): Promise<Record<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))] as string[];
  const missing = unique.filter((id) => !(id in cache));

  if (missing.length > 0) {
    const { data } = await supabase
      .from('users_view')
      .select('id, full_name, email')
      .in('id', missing);

    for (const row of data ?? []) {
      const label =
        (row.full_name as string | null)?.trim() ||
        (row.email as string | null)?.split('@')[0] ||
        '';
      cache[row.id] = label;
    }
    for (const id of missing) {
      if (!(id in cache)) cache[id] = '';
    }
  }

  return Object.fromEntries(unique.map((id) => [id, cache[id] ?? '']));
}

// ─── fetchAllUsers ────────────────────────────────────────────────────────────

/** Retourne tous les utilisateurs triés par full_name (pour le picker). */
export async function fetchAllUsers(): Promise<UserRecord[]> {
  const { data } = await supabase
    .from('users_view')
    .select('id, full_name, email')
    .order('full_name', { ascending: true, nullsFirst: false });
  return (data as UserRecord[]) ?? [];
}

// ─── fetchUserById ────────────────────────────────────────────────────────────

/** Résout un UUID unique vers un UserRecord (utilisé pour pré-remplir le picker). */
export async function fetchUserById(id: string): Promise<UserRecord | null> {
  const { data } = await supabase
    .from('users_view')
    .select('id, full_name, email')
    .eq('id', id)
    .single();
  return (data as UserRecord | null) ?? null;
}
