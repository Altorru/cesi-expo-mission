import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Mission } from '@/types/mission';

// Sélection simple — les noms sont résolus via users_view dans fetchUserPseudos
const MISSIONS_SELECT = '*';

// ─── Hook : toutes les missions avec Realtime ────────────────────────────────

export function useMissions() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isMountedRef = useRef(true);

  // Fetch initial simple
  const fetchMissionsOnce = useCallback(async (opts?: { isRefresh?: boolean }) => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('courses')
        .select(MISSIONS_SELECT)
        .order('created_at', { ascending: false });

      if (!isMountedRef.current) return;

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setMissions((data as unknown as Mission[]) ?? []);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      }
    } finally {
      if (!isMountedRef.current) return;
      if (opts?.isRefresh) {
        setIsRefreshing(false);
      } else {
        setIsInitialLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    setIsInitialLoading(true);

    // 1. Fetch initial
    fetchMissionsOnce();

    // 2. Setup Realtime pour les mises à jour (pas de refetch)
    const channel = supabase
      .channel(`courses_realtime_${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'courses' },
        (payload) => {
          if (!isMountedRef.current) return;

          // Met à jour directement le state sans refetch
          if (payload.eventType === 'INSERT') {
            setMissions((prev) => [payload.new as Mission, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setMissions((prev) =>
              prev.map((m) => (m.id === (payload.new as Mission).id ? (payload.new as Mission) : m))
            );
          } else if (payload.eventType === 'DELETE') {
            setMissions((prev) => prev.filter((m) => m.id !== (payload.old as Mission).id));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      isMountedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fetchMissionsOnce]);

  // Pour pull-to-refresh explicite (conserve les données pendant le fetch)
  const refetch = useCallback(() => {
    setIsRefreshing(true);
    fetchMissionsOnce({ isRefresh: true });
  }, [fetchMissionsOnce]);

  return { missions, isInitialLoading, isRefreshing, error, refetch };
}


// ─── Hook : missions assignées à un utilisateur avec Realtime ────────────────

export function useMyMissions(userId: string | undefined) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isMountedRef = useRef(true);

  // Fetch initial simple
  const fetchMyMissionsOnce = useCallback(async (id: string, opts?: { isRefresh?: boolean }) => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('courses')
        .select(MISSIONS_SELECT)
        .eq('in_charge', id)
        .order('created_at', { ascending: false });

      if (!isMountedRef.current) return;

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setMissions((data as unknown as Mission[]) ?? []);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      }
    } finally {
      if (!isMountedRef.current) return;
      if (opts?.isRefresh) {
        setIsRefreshing(false);
      } else {
        setIsInitialLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // Cleanup subscription précédente
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (!userId) {
      setMissions([]);
      setIsInitialLoading(false);
      return;
    }

    // 1. Fetch initial
    setIsInitialLoading(true);
    fetchMyMissionsOnce(userId);

    // 2. Setup Realtime pour les mises à jour (pas de refetch)
    const channel = supabase
      .channel(`missions_user_${userId}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courses',
          filter: `in_charge=eq.${userId}`,
        },
        (payload) => {
          if (!isMountedRef.current) return;

          // Met à jour directement le state sans refetch
          if (payload.eventType === 'INSERT') {
            setMissions((prev) => [payload.new as Mission, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setMissions((prev) =>
              prev.map((m) => (m.id === (payload.new as Mission).id ? (payload.new as Mission) : m))
            );
          } else if (payload.eventType === 'DELETE') {
            setMissions((prev) => prev.filter((m) => m.id !== (payload.old as Mission).id));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      isMountedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, fetchMyMissionsOnce]);

  // Pour pull-to-refresh explicite
  const refetch = useCallback(() => {
    if (userId) {
      setIsRefreshing(true);
      fetchMyMissionsOnce(userId, { isRefresh: true });
    }
  }, [userId, fetchMyMissionsOnce]);

  return { missions, isInitialLoading, isRefreshing, error, refetch };
}

// ─── Hook : mission unique avec Realtime et cleanup ────────────────────────────

export function useMission(missionId: string | undefined) {
  const [mission, setMission] = useState<Mission | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isMountedRef = useRef(true);

  // Fetch initial simple
  const fetchMissionOnce = useCallback(async (id: string, opts?: { isRefresh?: boolean }) => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('courses')
        .select(MISSIONS_SELECT)
        .eq('id', id)
        .single<Mission>();

      if (!isMountedRef.current) return;

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setMission(data);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      }
    } finally {
      if (!isMountedRef.current) return;
      if (opts?.isRefresh) {
        setIsRefreshing(false);
      } else {
        setIsInitialLoading(false);
      }
    }
  }, []);

  // Effect principal : setup/teardown pour chaque missionId
  useEffect(() => {
    isMountedRef.current = true;

    if (!missionId) {
      setMission(null);
      setIsInitialLoading(false);
      return;
    }

    // Cleanup subscription précédente
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // 1. Fetch initial
    setIsInitialLoading(true);
    fetchMissionOnce(missionId);

    // 2. Setup Realtime pour les mises à jour (direct state update)
    const channel = supabase
      .channel(`mission_${missionId}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courses',
          filter: `id=eq.${missionId}`,
        },
        (payload) => {
          if (!isMountedRef.current) return;

          if (payload.eventType === 'DELETE') {
            setMission(null);
          } else {
            setMission(payload.new as Mission);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      isMountedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [missionId, fetchMissionOnce]);

  // Pour pull-to-refresh explicite
  const refetch = useCallback(() => {
    if (missionId) {
      setIsRefreshing(true);
      fetchMissionOnce(missionId, { isRefresh: true });
    }
  }, [missionId, fetchMissionOnce]);

  return { mission, isInitialLoading, isRefreshing, error, refetch };
}

// ─── Hook : mission unique (lecture seule pour modify/delete) ──────────────────
// Pas de Realtime — juste fetch initial pour les formulaires

export function useMissionOnce(missionId: string | undefined) {
  const [mission, setMission] = useState<Mission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    if (!missionId) {
      setMission(null);
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('courses')
          .select(MISSIONS_SELECT)
          .eq('id', missionId)
          .single<Mission>();

        if (!isMountedRef.current) return;

        if (fetchError) {
          setError(fetchError.message);
          setMission(null);
        } else {
          setMission(data);
          setError(null);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Erreur inconnue');
          setMission(null);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMountedRef.current = false;
    };
  }, [missionId]);

  return { mission, isLoading, error };
}
