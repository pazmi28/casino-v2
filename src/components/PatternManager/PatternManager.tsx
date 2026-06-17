import { useState } from "react";
import { usePatterns } from "../../hooks/usePatterns";
import { COLOR_MAP, COLOR_STYLE, parseNumbers } from "../../lib/roulette";

interface Props {
  casinoId: string;
}

export function PatternManager({ casinoId }: Props) {
  const { patterns, loading, error, add, remove } = usePatterns(casinoId);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [confidence, setConfidence] = useState("3");
  const [global, setGlobal] = useState(false);
  const [numbersInput, setNumbersInput] = useState("");
  const [feedback, setFeedback] = useState<{
    text: string;
    type: "ok" | "error";
  } | null>(null);

  const handleSave = async () => {
    // Limpia el resultado del intento anterior antes de proceder.
    setFeedback(null);

    if (!name.trim()) {
      setFeedback({ text: "El nombre es obligatorio.", type: "error" });
      return;
    }

    const { valid, invalid } = parseNumbers(numbersInput);
    if (valid.length === 0) {
      // No llamamos al servicio: sin números válidos no se guarda nada.
      setFeedback({
        text: "Introduce al menos un número válido.",
        type: "error",
      });
      return;
    }

    const err = await add({
      casinoId: global ? null : casinoId,
      name: name.trim(),
      description: description.trim() === "" ? null : description.trim(),
      confidence: Number(confidence),
      numbers: valid,
    });

    if (err) {
      setFeedback({ text: `Error: ${err}`, type: "error" });
      return;
    }

    setFeedback({
      text:
        invalid.length > 0
          ? `Patrón guardado. Ignorados (no son números 0–36): ${invalid.join(", ")}`
          : "Patrón guardado.",
      type: "ok",
    });

    setName("");
    setDescription("");
    setConfidence("3");
    setGlobal(false);
    setNumbersInput("");
  };

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-2">Gestor de patrones</h2>

      <div className="flex flex-col gap-2 mb-3 max-w-md">
        <input
          className="p-2 border rounded"
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          className="p-2 border rounded"
          rows={2}
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <label className="text-sm text-gray-600">
          Confianza
          <select
            className="mt-1 w-full p-2 border rounded"
            value={confidence}
            onChange={(e) => setConfidence(e.target.value)}
          >
            {[1, 2, 3, 4, 5].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={global}
            onChange={(e) => setGlobal(e.target.checked)}
          />
          Patrón global (visible en todos los casinos)
        </label>
        <input
          className="p-2 border rounded"
          placeholder="Ej: 7, 12, 23"
          value={numbersInput}
          onChange={(e) => setNumbersInput(e.target.value)}
        />
        <button
          className="self-start px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={handleSave}
        >
          Guardar patrón
        </button>
      </div>

      {feedback && (
        <p
          className={`text-sm mb-2 ${
            feedback.type === "ok" ? "text-gray-600" : "text-red-600"
          }`}
        >
          {feedback.text}
        </p>
      )}
      {error && <p className="text-red-600 mb-2">Error: {error}</p>}
      {loading && <p className="text-gray-500">Cargando patrones…</p>}

      {!loading && patterns.length === 0 && (
        <p className="text-gray-500">No hay patrones registrados todavía.</p>
      )}

      {patterns.length > 0 && (
        <ul className="space-y-3">
          {patterns.map((p) => (
            <li key={p.id} className="p-3 border rounded bg-white">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{p.name}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        p.casino_id === null
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {p.casino_id === null ? "Global" : "Este casino"}
                    </span>
                  </div>
                  {p.confidence !== null && (
                    <div className="text-sm text-gray-600">
                      Confianza: {p.confidence}/5
                    </div>
                  )}
                  {p.description && (
                    <div className="text-sm text-gray-500 whitespace-pre-wrap break-words">
                      {p.description}
                    </div>
                  )}
                  {p.numbers.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-2">
                      {p.numbers.map((num, i) => (
                        <span
                          key={`${num}-${i}`}
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${COLOR_STYLE[COLOR_MAP[num]]}`}
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => remove(p.id)}
                  className="shrink-0 px-2 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
