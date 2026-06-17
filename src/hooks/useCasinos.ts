import { useCallback, useEffect, useState } from "react";
import { listCasinos } from "../services/casinos";
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
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { casinos, loading, error, reload };
}
