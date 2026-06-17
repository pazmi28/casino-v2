import { useState } from "react";
import { useSpins } from "../../hooks/useSpins";
import type { SpinColor } from "../../lib/roulette";

// Estilos visuales por color. El valor de `color` (R/N/V) viene ya calculado
// desde Postgres; aquí solo se traduce a clases de Tailwind, no se recalcula.
const COLOR_STYLE: Record<SpinColor, string> = {
  R: "bg-red-600 text-white",
  N: "bg-gray-900 text-white",
  V: "bg-green-600 text-white",
};

const COLOR_LABEL: Record<SpinColor, string> = {
  R: "Rojo",
  N: "Negro",
  V: "Verde",
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  casinoId: string;
}

export function SpinHistory({ casinoId }: Props) {
  const { spins, loading, error, add, remove } = useSpins(casinoId);
  const [input, setInput] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!input.trim()) return;
    const { added, invalid } = await add(input);
    setInput("");

    if (invalid.length > 0) {
      setNotice(
        `Añadidos ${added}. Ignorados (no son números 0–36): ${invalid.join(", ")}`,
      );
    } else if (added > 0) {
      setNotice(`Añadidos ${added} números.`);
    } else {
      setNotice("No se añadió nada.");
    }
  };

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-2">Historial de tiradas</h2>

      <div className="flex gap-2 mb-2">
        <input
          className="flex-1 p-2 border rounded"
          placeholder="Números separados por comas (ej: 12, 0, 36, 7)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
        />
        <button
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={handleAdd}
        >
          + Añadir Números
        </button>
      </div>

      {notice && <p className="text-sm text-gray-600 mb-2">{notice}</p>}
      {error && <p className="text-red-600 mb-2">Error: {error}</p>}
      {loading && <p className="text-gray-500">Cargando tiradas…</p>}

      {!loading && spins.length === 0 && (
        <p className="text-gray-500">No hay tiradas registradas todavía.</p>
      )}

      {spins.length > 0 && (
        <div className="flex gap-2 overflow-x-auto py-2">
          {spins.map((s) => (
            <div
              key={s.id}
              className="group flex flex-col items-center shrink-0"
              title={`${COLOR_LABEL[s.color]} · ${formatTime(s.created_at)}`}
            >
              <button
                onClick={() => remove(s.id)}
                className={`relative w-12 h-12 rounded-full flex items-center justify-center font-bold ${COLOR_STYLE[s.color]}`}
                title="Borrar esta tirada"
              >
                {s.number}
                <span className="absolute -top-1 -right-1 hidden group-hover:flex w-5 h-5 rounded-full bg-white text-gray-700 border items-center justify-center text-xs">
                  ×
                </span>
              </button>
              <span className="text-xs text-gray-500 mt-1">
                {formatTime(s.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
