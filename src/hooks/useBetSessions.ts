import { useCallback, useEffect, useState } from "react";
import {
  createBetSession,
  deleteBetSession,
  listBetSessions,
} from "../services/betSessions";
import type { BetSession } from "../types";

export interface UseBetSessions {
  sessions: BetSession[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  add: (
    sessionDate: string,
    lossesBeforeWin: number | null,
    notes: string | null,
  ) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export function useBetSessions(casinoId: string | null): UseBetSessions {
  const [sessions, setSessions] = useState<BetSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!casinoId) {
      setSessions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await listBetSessions(casinoId);
      setSessions(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [casinoId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const add = useCallback(
    async (
      sessionDate: string,
      lossesBeforeWin: number | null,
      notes: string | null,
    ) => {
      if (!casinoId) return;
      setError(null);
      try {
        await createBetSession(casinoId, sessionDate, lossesBeforeWin, notes);
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      }
    },
    [casinoId, reload],
  );

  const remove = useCallback(
    async (id: string) => {
      setError(null);
      try {
        await deleteBetSession(id);
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      }
    },
    [reload],
  );

  return { sessions, loading, error, reload, add, remove };
}
