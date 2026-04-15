import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Mission } from '@/types/mission';

// Sélection simple — les noms sont résolus via users_view dans fetchUserPseudos
const MISSIONS_SELECT = '*';

// ─── Hook : toutes les missions ───────────────────────────────────────────────

export function useMissions() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelName = useRef(`courses_realtime_${Math.random().toString(36).slice(2)}`);

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

    const channel = supabase
      .channel(channelName.current)
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
  const channelName = useRef(`missions_user_${Math.random().toString(36).slice(2)}`);

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
      .channel(channelName.current)
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
  }, [fetchMission]);

  return { mission, isLoading, error, refetch: fetchMission };
}

// ─── Hook : mission unique sans Realtime (pour modify / delete) ───────────────
// Évite le conflit de channel name quand index.tsx est déjà monté dans la stack.

export function useMissionOnce(missionId: string | undefined) {
  const [mission, setMission] = useState<Mission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!missionId) {
      setMission(null);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(MISSIONS_SELECT)
        .eq('id', missionId)
        .single<Mission>();
      if (cancelled) return;
      if (error) setError(error.message);
      else setMission(data);
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [missionId]);

  return { mission, isLoading, error };
}
