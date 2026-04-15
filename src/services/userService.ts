/**
 * userService — Résolution des UUIDs utilisateurs en full_name
 *
 * Requiert la vue suivante dans Supabase (SQL Editor) :
 *
 *   create or replace view public.users_view as
 *     select id, raw_user_meta_data->>'full_name' as full_name
 *     from auth.users;
 *
 *   grant select on public.users_view to authenticated;
 */
import { supabase } from '@/lib/supabase';

/** Cache mémoire pour éviter les requêtes répétées dans la session */
const cache: Record<string, string> = {};

/**
 * Résout une liste d'UUIDs vers un record { uuid: full_name }.
 * Les IDs déjà en cache ne sont pas re-fetchés.
 * Retourne une chaîne vide pour les utilisateurs sans nom.
 */
export async function fetchUserPseudos(
  ids: (string | null | undefined)[],
): Promise<Record<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))] as string[];
  const missing = unique.filter((id) => !(id in cache));

  if (missing.length > 0) {
    const { data } = await supabase
      .from('users_view')
      .select('id, full_name')
      .in('id', missing);

    for (const row of data ?? []) {
      cache[row.id] = (row.full_name as string | null) ?? '';
    }
    // Marquer les IDs sans résultat pour ne plus les requêter
    for (const id of missing) {
      if (!(id in cache)) cache[id] = '';
    }
  }

  return Object.fromEntries(unique.map((id) => [id, cache[id] ?? '']));
}
