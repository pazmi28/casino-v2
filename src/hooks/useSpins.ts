import { useCallback, useEffect, useState } from "react";
import { addSpins, deleteSpin, listSpins } from "../services/spins";
import { parseNumbers } from "../lib/roulette";
import { errorMessage } from "../lib/errors";
import type { Spin } from "../types";

export interface AddResult {
  added: number;
  invalid: string[];
}

export interface UseSpins {
  spins: Spin[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  add: (numbers: string) => Promise<AddResult>;
  remove: (id: string) => Promise<void>;
}

export function useSpins(casinoId: string | null): UseSpins {
  const [spins, setSpins] = useState<Spin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!casinoId) {
      setSpins([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await listSpins(casinoId);
      setSpins(data);
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
    async (numbers: string): Promise<AddResult> => {
      const { valid, invalid } = parseNumbers(numbers);
      if (!casinoId || valid.length === 0) {
        return { added: 0, invalid };
      }
      setError(null);
      try {
        await addSpins(casinoId, valid);
        await reload();
        return { added: valid.length, invalid };
      } catch (e) {
        setError(errorMessage(e));
        return { added: 0, invalid };
      }
    },
    [casinoId, reload],
  );

  const remove = useCallback(
    async (id: string) => {
      setError(null);
      try {
        await deleteSpin(id);
        await reload();
      } catch (e) {
        setError(errorMessage(e));
      }
    },
    [reload],
  );

  return { spins, loading, error, reload, add, remove };
}
