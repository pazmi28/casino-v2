import type { CSSProperties } from "react";
import {
  COLOR_MAP,
  COLOR_STYLE,
  dozenOf,
  isEven,
  isLow,
  isRed,
  tableRow,
} from "../../lib/roulette";

const FELT = "#0b6b3a";
const GOLD = "#f5b400";

// Outline blanco grueso para la casilla exacta; dorado para todo lo que el
// número cumple (docena, 2 to 1, falta/pasa, par/impar, color).
function outline(exact: boolean, gold: boolean): CSSProperties {
  if (exact) return { outline: "3px solid #fff", outlineOffset: "2px", zIndex: 20 };
  if (gold) return { outline: `2px solid ${GOLD}`, outlineOffset: "1px", zIndex: 10 };
  return {};
}

// Las 12 columnas físicas: arriba 3,6,9…36 · medio 2,5,8…35 · abajo 1,4,7…34.
interface NumCell {
  num: number;
  col: number; // columna de grid (2–13)
  row: number; // fila de grid (1–3)
}
const NUMBERS: NumCell[] = [];
for (let k = 1; k <= 12; k++) {
  NUMBERS.push({ num: k * 3, col: k + 1, row: 1 }); // top
  NUMBERS.push({ num: k * 3 - 1, col: k + 1, row: 2 }); // mid
  NUMBERS.push({ num: k * 3 - 2, col: k + 1, row: 3 }); // bottom
}

const CELL_BASE =
  "flex items-center justify-center text-center font-semibold text-white " +
  "border border-white/25 transition-all duration-300 select-none";

interface Props {
  searched: number | null;
}

export function TableLayout({ searched }: Props) {
  const has = searched !== null && searched !== 0;

  return (
    <div className="mt-4 overflow-x-auto">
      <div
        className="grid min-w-[560px] text-sm"
        style={{
          gridTemplateColumns: "48px repeat(12, 1fr) 56px",
          gridTemplateRows: "repeat(3, 46px) 36px 36px",
          background: FELT,
        }}
      >
        {/* Casilla 0, abarca las tres filas de números */}
        <div
          className={`${CELL_BASE} ${COLOR_STYLE.V} text-lg`}
          style={{ gridColumn: 1, gridRow: "1 / span 3", ...outline(searched === 0, false) }}
        >
          0
        </div>

        {/* Los 36 números */}
        {NUMBERS.map(({ num, col, row }) => (
          <div
            key={num}
            className={`${CELL_BASE} ${COLOR_STYLE[COLOR_MAP[num]]}`}
            style={{ gridColumn: col, gridRow: row, ...outline(num === searched, false) }}
          >
            {num}
          </div>
        ))}

        {/* Columna "2 to 1", una por fila física */}
        {(["top", "mid", "bottom"] as const).map((r, i) => (
          <div
            key={r}
            className={CELL_BASE}
            style={{
              gridColumn: 14,
              gridRow: i + 1,
              ...outline(false, has && tableRow(searched!) === r),
            }}
          >
            2 to 1
          </div>
        ))}

        {/* Fila 4: docenas, cada una abarca 4 columnas de números */}
        {([1, 2, 3] as const).map((d, i) => (
          <div
            key={d}
            className={CELL_BASE}
            style={{
              gridColumn: `${2 + i * 4} / span 4`,
              gridRow: 4,
              ...outline(false, has && dozenOf(searched!) === d),
            }}
          >
            {d === 1 ? "1st 12" : d === 2 ? "2nd 12" : "3rd 12"}
          </div>
        ))}

        {/* Fila 5: apuestas sencillas, cada una abarca 2 columnas */}
        <div
          className={CELL_BASE}
          style={{ gridColumn: "2 / span 2", gridRow: 5, ...outline(false, has && isLow(searched!)) }}
        >
          1 to 18
        </div>
        <div
          className={CELL_BASE}
          style={{ gridColumn: "4 / span 2", gridRow: 5, ...outline(false, has && isEven(searched!)) }}
        >
          EVEN
        </div>
        <div
          className={CELL_BASE}
          style={{ gridColumn: "6 / span 2", gridRow: 5, ...outline(false, has && isRed(searched!)) }}
        >
          <span className="w-4 h-4 rotate-45 bg-red-600 border border-white/50" />
        </div>
        <div
          className={CELL_BASE}
          style={{ gridColumn: "8 / span 2", gridRow: 5, ...outline(false, has && !isRed(searched!)) }}
        >
          <span className="w-4 h-4 rotate-45 bg-zinc-900 border border-white/50" />
        </div>
        <div
          className={CELL_BASE}
          style={{ gridColumn: "10 / span 2", gridRow: 5, ...outline(false, has && !isEven(searched!)) }}
        >
          ODD
        </div>
        <div
          className={CELL_BASE}
          style={{ gridColumn: "12 / span 2", gridRow: 5, ...outline(false, has && !isLow(searched!)) }}
        >
          19 to 36
        </div>
      </div>
    </div>
  );
}
