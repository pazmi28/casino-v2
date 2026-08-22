import { useCallback, useEffect, useState } from "react";
import { deleteCasino, listCasinos } from "../services/casinos";
import { errorMessage } from "../lib/errors";
import type { Casino, City } from "../types";

export function useCasinos(city: City) {
  const [casinos, setCasinos] = useState<Casino[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listCasinos(city);
      setCasinos(data);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Devuelve null si fue bien, o el mensaje de error si falló (mismo patrón
  // que usePatterns.add: el componente decide cómo mostrarlo).
  const remove = useCallback(
    async (id: string): Promise<string | null> => {
      try {
        await deleteCasino(id);
        await reload();
        return null;
      } catch (e) {
        return errorMessage(e);
      }
    },
    [reload],
  );

  return { casinos, loading, error, reload, remove };
}
