import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Mission } from '@/types/mission';

// Sélection simple sans jointures
const MISSIONS_SELECT = '*';

// ─── Hook : toutes les missions ───────────────────────────────────────────────

export function useMissions() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMissions = useCallback(async () => {
    setError(null);
    const { data, error } = await supabase
      .from('courses')
      .select(MISSIONS_SELECT)
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setMissions((data as unknown as Mission[]) ?? []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchMissions();

    // 3b — Abonnement Realtime : rafraîchissement automatique à chaque mutation
    const channel = supabase
      .channel('courses_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'courses' },
        () => { fetchMissions(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMissions]);

  return { missions, isLoading, error, refetch: fetchMissions };
}

// ─── Hook : missions assignées à un utilisateur (3c) ─────────────────────────

export function useMyMissions(userId: string | undefined) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyMissions = useCallback(async () => {
    if (!userId) {
      setMissions([]);
      setIsLoading(false);
      return;
    }
    setError(null);
    const { data, error } = await supabase
      .from('courses')
      .select(MISSIONS_SELECT)
      .eq('in_charge', userId)          // 3c — filtre par assignee
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setMissions((data as unknown as Mission[]) ?? []);
    }
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchMyMissions();

    // 3b — Realtime filtré sur les missions de cet utilisateur
    const channel = supabase
      .channel(`missions_user_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courses',
          filter: userId ? `in_charge=eq.${userId}` : undefined,
        },
        () => { fetchMyMissions(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMyMissions, userId]);

  return { missions, isLoading, error, refetch: fetchMyMissions };
}

// ─── Hook : mission unique (3d) ───────────────────────────────────────────────

export function useMission(missionId: string | undefined) {
  const [mission, setMission] = useState<Mission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMission = useCallback(async () => {
    if (!missionId) {
      setMission(null);
      setIsLoading(false);
      return;
    }
    setError(null);
    const { data, error } = await supabase
      .from('courses')
      .select(MISSIONS_SELECT)
      .eq('id', missionId)
      .single<Mission>();               // 3d — récupération unique

    if (error) {
      setError(error.message);
    } else {
      setMission(data);
    }
    setIsLoading(false);
  }, [missionId]);

  useEffect(() => {
    fetchMission();

    // 3b — Realtime sur cette mission précise
    const channel = supabase
      .channel(`mission_${missionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courses',
          filter: missionId ? `id=eq.${missionId}` : undefined,
        },
        () => { fetchMission(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMission, missionId]);

  return { mission, isLoading, error, refetch: fetchMission };
}
