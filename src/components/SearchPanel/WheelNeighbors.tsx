import { COLOR_MAP, ROULETTE_SEQUENCE } from "../../lib/roulette";
import type { Spin } from "../../types";

// Geometría del cilindro
const SIZE = 320; // lado del contenedor (px)
const CENTER = SIZE / 2;
const RADIUS = 132; // radio de la circunferencia de números
const CELL = 36; // diámetro de cada casilla (px)

// Clases por color de ruleta (base de cada casilla, no el resaltado).
// El mapeo número→color vive en lib/roulette.ts; aquí solo se traduce a estilo.
const BASE_COLOR: Record<string, string> = {
  R: "bg-red-700 text-white border-red-900",
  N: "bg-gray-900 text-white border-black",
  V: "bg-green-700 text-white border-green-900",
};

interface NeighborSets {
  primary: Set<number>; // ±11 posiciones
  secondary: Set<number>; // ±1 de cada vecino primario (±10, ±12)
}

function neighborSets(searched: number): NeighborSets {
  const seq = ROULETTE_SEQUENCE;
  const n = seq.length; // 37
  const idx = seq.indexOf(searched);
  if (idx === -1) {
    return { primary: new Set(), secondary: new Set() };
  }
  const at = (offset: number) => seq[(idx + offset + n * 2) % n];
  return {
    primary: new Set([at(11), at(-11)]),
    secondary: new Set([at(10), at(12), at(-10), at(-12)]),
  };
}

interface Props {
  searched: number | null;
  // Tiradas ya cargadas (opcional): no se usan para dibujar la rueda, se
  // aceptan para que el componente pueda enriquecerse en el futuro sin
  // cambiar su API.
  spins?: Spin[];
}

export function WheelNeighbors({ searched }: Props) {
  const { primary, secondary } =
    searched === null
      ? { primary: new Set<number>(), secondary: new Set<number>() }
      : neighborSets(searched);

  return (
    <div
      className="relative mx-auto rounded-full bg-emerald-950"
      style={{ width: SIZE, height: SIZE }}
    >
      {ROULETTE_SEQUENCE.map((num, i) => {
        const angle = (i / ROULETTE_SEQUENCE.length) * 2 * Math.PI - Math.PI / 2;
        const left = CENTER + RADIUS * Math.cos(angle) - CELL / 2;
        const top = CENTER + RADIUS * Math.sin(angle) - CELL / 2;

        const isMain = searched !== null && num === searched;
        const isPrimary = primary.has(num);
        const isSecondary = secondary.has(num);

        let highlight = BASE_COLOR[COLOR_MAP[num]] + " opacity-60";
        if (isSecondary) highlight = "bg-amber-300 text-gray-900 border-amber-500";
        if (isPrimary) highlight = "bg-orange-500 text-white border-orange-700";
        if (isMain)
          highlight =
            "bg-yellow-300 text-gray-900 border-yellow-600 ring-2 ring-yellow-500 scale-125 z-10";

        return (
          <div
            key={num}
            className={`absolute flex items-center justify-center rounded-full border text-sm font-bold transition-all duration-300 ${highlight}`}
            style={{ width: CELL, height: CELL, left, top }}
          >
            {num}
          </div>
        );
      })}
    </div>
  );
}
