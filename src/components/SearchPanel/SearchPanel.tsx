import { useState } from "react";
import { WheelNeighbors } from "./WheelNeighbors";
import { TableLayout } from "./TableLayout";
import { NeighborStats } from "./NeighborStats";
import type { Spin } from "../../types";

interface Props {
  // Tiradas ya cargadas por useSpins en App; no se hace una query nueva.
  spins: Spin[];
}

export function SearchPanel({ spins }: Props) {
  const [input, setInput] = useState("");
  const [searched, setSearched] = useState<number | null>(null);

  const handleSearch = () => {
    const trimmed = input.trim();
    const n = Number(trimmed);
    if (trimmed === "" || !Number.isInteger(n) || n < 0 || n > 36) {
      setSearched(null);
      return;
    }
    setSearched(n);
  };

  const count =
    searched === null
      ? 0
      : spins.filter((s) => s.number === searched).length;

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-2">Vecinos en rueda</h2>

      <div className="flex gap-2 mb-3">
        <input
          className="flex-1 p-2 border rounded"
          placeholder="Número a buscar (0–36)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
        />
        <button
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={handleSearch}
        >
          Buscar
        </button>
      </div>

      {searched !== null && (
        <p className="text-sm text-gray-600 mb-3">
          El <span className="font-semibold">{searched}</span> ha salido{" "}
          <span className="font-semibold">{count}</span>{" "}
          {count === 1 ? "vez" : "veces"} en este casino.
        </p>
      )}

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="w-full lg:w-[380px] flex-shrink-0">
          <WheelNeighbors searched={searched} spins={spins} />
        </div>
        <div className="flex-1 min-w-0 overflow-x-auto">
          <TableLayout searched={searched} />
        </div>
      </div>

      <NeighborStats searched={searched} spins={spins} />
    </div>
  );
}
