import { useCallback, useEffect, useState } from "react";
import {
  createPattern,
  deletePattern,
  listPatterns,
} from "../services/patterns";
import type { CreatePatternInput } from "../services/patterns";
import { errorMessage } from "../lib/errors";
import type { Pattern } from "../types";

export interface UsePatterns {
  patterns: Pattern[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  // Devuelve null si fue bien, o el mensaje de error si falló (no escribe el
  // estado `error` del hook: el guardado lo gestiona el componente, así éxito
  // y error nunca se muestran a la vez).
  add: (input: CreatePatternInput) => Promise<string | null>;
  remove: (id: string) => Promise<void>;
}

export function usePatterns(casinoId: string | null): UsePatterns {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!casinoId) {
      setPatterns([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await listPatterns(casinoId);
      setPatterns(data);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [casinoId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const add = useCallback(
    async (input: CreatePatternInput): Promise<string | null> => {
      setError(null); // limpia cualquier error previo del hook al empezar
      try {
        await createPattern(input);
        await reload();
        return null;
      } catch (e) {
        return errorMessage(e);
      }
    },
    [reload],
  );

  const remove = useCallback(
    async (id: string) => {
      setError(null);
      try {
        await deletePattern(id);
        await reload();
      } catch (e) {
        setError(errorMessage(e));
      }
    },
    [reload],
  );

  return { patterns, loading, error, reload, add, remove };
}
