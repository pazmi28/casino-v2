import { useState } from "react";
import { CITIES } from "./types";
import type { City } from "./types";
import { useCasinos } from "./hooks/useCasinos";
import { createCasino } from "./services/casinos";

export default function App() {
  const [city, setCity] = useState<City>(CITIES[0]);
  const [newName, setNewName] = useState("");
  const { casinos, loading, error, reload } = useCasinos(city);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await createCasino(city, newName.trim());
    setNewName("");
    reload();
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <h1 className="text-2xl font-bold mb-2">Ruleta Tracker v2</h1>
      <p className="text-sm text-gray-500 mb-6">
        Esqueleto mínimo para validar Supabase + Vercel antes de migrar el
        resto de la app.
      </p>

      <div className="mb-4">
        <label className="block mb-1">Ciudad:</label>
        <select
          className="p-2 border rounded"
          value={city}
          onChange={(e) => setCity(e.target.value as City)}
        >
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 flex gap-2">
        <input
          className="flex-1 p-2 border rounded"
          placeholder="Nombre del casino"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={handleAdd}
        >
          + Añadir
        </button>
      </div>

      {loading && <p>Cargando…</p>}
      {error && (
        <p className="text-red-600 mb-4">
          Error: {error} — revisa que VITE_SUPABASE_URL y
          VITE_SUPABASE_ANON_KEY estén configuradas.
        </p>
      )}

      <ul className="space-y-1">
        {casinos.map((c) => (
          <li key={c.id} className="p-2 border rounded bg-white">
            {c.name}
          </li>
        ))}
        {!loading && !error && casinos.length === 0 && (
          <li className="text-gray-500">No hay casinos en {city} todavía.</li>
        )}
      </ul>
    </div>
  );
}
