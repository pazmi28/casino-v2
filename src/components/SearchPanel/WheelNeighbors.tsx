import { useLayoutEffect, useRef, useState } from "react";
import { COLOR_MAP, COLOR_STYLE, ROULETTE_SEQUENCE } from "../../lib/roulette";
import type { Spin } from "../../types";

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
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(0);

  // Medimos el lado real ya renderizado (lo decide el CSS: max-w + aspect-square)
  // y derivamos el diámetro de cada casilla de ese tamaño, no de un % fijo.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setSize(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { primary, secondary } =
    searched === null
      ? { primary: new Set<number>(), secondary: new Set<number>() }
      : neighborSets(searched);

  const n = ROULETTE_SEQUENCE.length; // 37
  const center = size / 2;
  const radius = size * 0.44;
  // Diámetro que evita el solape: cuerda entre casillas contiguas, con holgura.
  const d = Math.max(20, 2 * radius * Math.sin(Math.PI / n) * 0.88);
  const fontSize = d * 0.42;

  return (
    <div
      ref={ref}
      className="relative mx-auto w-full max-w-[380px] aspect-square rounded-full bg-white border border-gray-200"
    >
      {size > 0 &&
        ROULETTE_SEQUENCE.map((num, i) => {
          const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
          const left = center + radius * Math.cos(angle) - d / 2;
          const top = center + radius * Math.sin(angle) - d / 2;

          const isMain = searched !== null && num === searched;
          const isPrimary = primary.has(num);
          const isSecondary = secondary.has(num);

          let highlight = `${COLOR_STYLE[COLOR_MAP[num]]} border border-black/10`;
          if (isSecondary)
            highlight = "bg-amber-300 text-gray-900 border-amber-500";
          if (isPrimary)
            highlight = "bg-orange-500 text-white border-orange-700";
          if (isMain)
            highlight =
              "bg-yellow-300 text-gray-900 border-yellow-600 ring-2 ring-yellow-500 scale-125 z-10";

          return (
            <div
              key={num}
              className={`absolute flex items-center justify-center rounded-full border font-bold transition-all duration-300 ${highlight}`}
              style={{ width: d, height: d, left, top, fontSize }}
            >
              {num}
            </div>
          );
        })}
    </div>
  );
}
