import { useState } from "react";
import { useBetSessions } from "../../hooks/useBetSessions";

const today = () => new Date().toISOString().slice(0, 10);

interface Props {
  casinoId: string;
}

export function BetLog({ casinoId }: Props) {
  const { sessions, loading, error, add, remove } = useBetSessions(casinoId);
  const [date, setDate] = useState(today());
  const [losses, setLosses] = useState("");
  const [notes, setNotes] = useState("");

  const handleSave = async () => {
    if (!date) return;
    const trimmedLosses = losses.trim();
    const lossesValue = trimmedLosses === "" ? null : Number(trimmedLosses);
    const trimmedNotes = notes.trim();

    await add(
      date,
      lossesValue !== null && Number.isFinite(lossesValue) ? lossesValue : null,
      trimmedNotes === "" ? null : trimmedNotes,
    );

    // Reset solo lo variable; la fecha vuelve a hoy.
    setDate(today());
    setLosses("");
    setNotes("");
  };

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-2">Registro de apuestas</h2>

      <div className="flex flex-col gap-2 mb-3 max-w-md">
        <label className="text-sm text-gray-600">
          Fecha
          <input
            type="date"
            className="mt-1 w-full p-2 border rounded"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        <label className="text-sm text-gray-600">
          Pérdidas antes de ganar
          <input
            type="number"
            min={0}
            className="mt-1 w-full p-2 border rounded"
            value={losses}
            onChange={(e) => setLosses(e.target.value)}
          />
        </label>

        <label className="text-sm text-gray-600">
          Notas
          <textarea
            className="mt-1 w-full p-2 border rounded"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        <button
          className="self-start px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={handleSave}
        >
          Guardar
        </button>
      </div>

      {error && <p className="text-red-600 mb-2">Error: {error}</p>}
      {loading && <p className="text-gray-500">Cargando sesiones…</p>}

      {!loading && sessions.length === 0 && (
        <p className="text-gray-500">No hay sesiones registradas todavía.</p>
      )}

      {sessions.length > 0 && (
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="flex items-start justify-between gap-3 p-3 border rounded bg-white"
            >
              <div className="min-w-0">
                <div className="font-semibold">{s.session_date}</div>
                <div className="text-sm text-gray-600">
                  Pérdidas antes de ganar:{" "}
                  {s.losses_before_win ?? "—"}
                </div>
                {s.notes && (
                  <div className="text-sm text-gray-500 whitespace-pre-wrap break-words">
                    {s.notes}
                  </div>
                )}
              </div>
              <button
                onClick={() => remove(s.id)}
                className="shrink-0 px-2 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
              >
                Borrar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
