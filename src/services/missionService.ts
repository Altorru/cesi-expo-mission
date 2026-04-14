import { supabase } from '@/lib/supabase';
import type { Mission } from '@/types/mission';

type MissionInput = Pick<
  Mission,
  'title' | 'description' | 'category' | 'deadline' | 'priority'
>;

// ─── Mettre à jour une mission ────────────────────────────────────────────────

export async function updateMission(
  id: string,
  updates: Partial<MissionInput>,
): Promise<void> {
  const { error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Supprimer une mission ────────────────────────────────────────────────────

export async function deleteMission(id: string): Promise<void> {
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Créer une mission ────────────────────────────────────────────────────────

export async function createMission(
  data: MissionInput & { author?: string | null },
): Promise<void> {
  const { error } = await supabase.from('courses').insert(data);
  if (error) throw new Error(error.message);
}
