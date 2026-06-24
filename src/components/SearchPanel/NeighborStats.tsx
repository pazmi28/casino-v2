import { useMemo, useState } from "react";
import {
  columnOf,
  COLOR_MAP,
  COLOR_STYLE,
  dozenOf,
  getNeighbors,
  isLow,
} from "../../lib/roulette";
import type { Spin } from "../../types";

type Scope = "all" | 10 | 20 | 30;

const SCOPES: { key: Scope; label: string }[] = [
  { key: "all", label: "Todo" },
  { key: 10, label: "Últimas 10" },
  { key: 20, label: "Últimas 20" },
  { key: 30, label: "Últimas 30" },
];

interface OptionStat {
  key: string;
  label: string;
  count: number;
  pct: number;
}

interface SectionStats {
  total: number; // tiradas distintas de 0 (denominador de dozen/column/range)
  colorTotal: number; // TODAS las tiradas, el 0 (verde) incluido
  dozen: OptionStat[];
  column: OptionStat[];
  range: OptionStat[];
  color: OptionStat[];
}

// Estadística de secciones sobre TODO el historial (ignora el alcance) y
// excluyendo el 0. Se calcula una vez y se reutiliza en los bloques (c) y (d).
function buildSectionStats(spins: Spin[]): SectionStats {
  const nonZero = spins.filter((s) => s.number !== 0);
  const total = nonZero.length;
  const pct = (c: number) => (total > 0 ? Math.round((c / total) * 100) : 0);

  const dozen = [0, 0, 0];
  const column = [0, 0, 0];
  let low = 0;
  let high = 0;

  for (const s of nonZero) {
    const d = dozenOf(s.number);
    if (d) dozen[d - 1]++;
    const c = columnOf(s.number);
    if (c) column[c - 1]++;
    if (isLow(s.number)) low++;
    else high++;
  }

  // Color: a diferencia de las otras 3, el 0 (Verde) SÍ cuenta. Recorrido
  // aparte y denominador propio (spins.length) para no mezclar exclusiones.
  const colorTotal = spins.length;
  const colorPct = (c: number) =>
    colorTotal > 0 ? Math.round((c / colorTotal) * 100) : 0;
  let red = 0;
  let black = 0;
  let green = 0;
  for (const s of spins) {
    const col = COLOR_MAP[s.number];
    if (col === "R") red++;
    else if (col === "N") black++;
    else green++;
  }

  return {
    total,
    colorTotal,
    dozen: [1, 2, 3].map((d) => ({
      key: String(d),
      label: `${d}ª docena`,
      count: dozen[d - 1],
      pct: pct(dozen[d - 1]),
    })),
    column: [1, 2, 3].map((c) => ({
      key: String(c),
      label: `Columna ${c}`,
      count: column[c - 1],
      pct: pct(column[c - 1]),
    })),
    range: [
      { key: "low", label: "1–18", count: low, pct: pct(low) },
      { key: "high", label: "19–36", count: high, pct: pct(high) },
    ],
    color: [
      { key: "R", label: "Rojo", count: red, pct: colorPct(red) },
      { key: "N", label: "Negro", count: black, pct: colorPct(black) },
      { key: "V", label: "Verde", count: green, pct: colorPct(green) },
    ],
  };
}

function StatBar({
  label,
  count,
  pct,
  badge,
  title,
}: {
  label: string;
  count: number;
  pct: number;
  badge?: string;
  title?: string;
}) {
  return (
    <div className="mb-2" title={title}>
      <div className="flex justify-between items-center text-xs text-gray-600 mb-0.5">
        <span>
          {label}
          {badge && (
            <span className="ml-1 px-1 py-0.5 rounded bg-amber-100 text-amber-700">
              {badge}
            </span>
          )}
        </span>
        <span className="tabular-nums">
          {count} · {pct}%
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded">
        <div
          className="h-2 bg-blue-500 rounded transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// Índice de la opción de mayor % (para el badge); -1 si todas a 0.
function topIndex(options: OptionStat[]): number {
  let best = -1;
  let bestPct = 0;
  options.forEach((o, i) => {
    if (o.pct > bestPct) {
      bestPct = o.pct;
      best = i;
    }
  });
  return best;
}

interface Props {
  searched: number | null;
  spins: Spin[];
}

export function NeighborStats({ searched, spins }: Props) {
  const [scope, setScope] = useState<Scope>("all");

  // (b) Secciones sobre todo el historial — independiente del alcance.
  const sectionStats = useMemo(() => buildSectionStats(spins), [spins]);

  // (a) Subconjunto según alcance, para el cálculo de vecinos (c).
  const scoped = scope === "all" ? spins : spins.slice(-scope);
  const scopeLabel = SCOPES.find((s) => s.key === scope)?.label ?? "Todo";

  // (c) Vecino más probable.
  const neighbors = searched !== null ? getNeighbors(searched) : null;
  const leftCount = neighbors
    ? scoped.filter((s) => s.number === neighbors.left).length
    : 0;
  const rightCount = neighbors
    ? scoped.filter((s) => s.number === neighbors.right).length
    : 0;
  const totalNeighbors = leftCount + rightCount;
  const tie = leftCount === rightCount;
  // Ganador para el bloque (d): solo si hay datos y no hay empate.
  const winner =
    neighbors && totalNeighbors > 0 && !tie
      ? leftCount > rightCount
        ? neighbors.left
        : neighbors.right
      : null;

  // (d) Mejores coberturas del ganador, buscadas en sectionStats (no recalcula).
  const betCards =
    winner !== null
      ? (() => {
          const d = dozenOf(winner);
          const c = columnOf(winner);
          const dozenStat = d ? sectionStats.dozen[d - 1] : null;
          const columnStat = c ? sectionStats.column[c - 1] : null;
          const rangeStat =
            winner === 0
              ? null
              : isLow(winner)
                ? sectionStats.range[0]
                : sectionStats.range[1];
          const cards = [
            { title: "Docena", stat: dozenStat },
            { title: "Columna", stat: columnStat },
            { title: "Rango", stat: rangeStat },
          ];
          const bestPct = Math.max(
            ...cards.map((c2) => c2.stat?.pct ?? -1),
          );
          return cards.map((card) => ({
            ...card,
            best: card.stat !== null && card.stat.pct === bestPct && bestPct > 0,
          }));
        })()
      : null;

  const dozenTop = topIndex(sectionStats.dozen);
  const columnTop = topIndex(sectionStats.column);
  const rangeTop = topIndex(sectionStats.range);
  const colorTop = topIndex(sectionStats.color);

  return (
    <div className="mt-6 space-y-4">
      {/* (a) Selector de alcance — excluyente */}
      <div>
        <span className="block text-sm text-gray-600 mb-1">Alcance</span>
        <div className="flex gap-2 flex-wrap">
          {SCOPES.map((s) => (
            <button
              key={String(s.key)}
              onClick={() => setScope(s.key)}
              className={`px-2 py-1 text-sm rounded border ${
                scope === s.key
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* (c) Vecino más probable */}
      <div className="p-3 border rounded bg-white">
        <h3 className="font-semibold mb-2">Vecino más probable</h3>
        {searched === null || neighbors === null ? (
          <p className="text-sm text-gray-500">
            Busca un número para ver su vecino más probable.
          </p>
        ) : totalNeighbors === 0 ? (
          <p className="text-sm text-gray-500">
            Sin datos suficientes en este alcance para estos dos números.
          </p>
        ) : (
          <div>
            {[
              { num: neighbors.left, count: leftCount },
              { num: neighbors.right, count: rightCount },
            ].map(({ num, count }) => {
              const pct = Math.round((count / totalNeighbors) * 100);
              const isWinner = !tie && count === Math.max(leftCount, rightCount);
              const title = `Nº ${num}: salió ${count} de ${totalNeighbors} veces consideradas en el alcance "${scopeLabel}".${
                tie ? " Empate entre los dos vecinos." : ""
              }`;
              return (
                <div
                  key={num}
                  className="flex items-center gap-2 mb-2"
                  title={title}
                >
                  <span
                    className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${COLOR_STYLE[COLOR_MAP[num]]}`}
                  >
                    {num}
                  </span>
                  <div className="flex-1 min-w-0">
                    <StatBar
                      label={`Nº ${num}`}
                      count={count}
                      pct={pct}
                      badge={
                        tie ? "Empate" : isWinner ? "Más probable" : undefined
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* (d) Próxima apuesta posible — solo si hay ganador */}
      {betCards && (
        <div className="p-3 border rounded bg-white">
          <h3 className="font-semibold mb-2">Próxima apuesta posible</h3>
          <p className="text-sm text-gray-600 mb-2">
            Según el vecino más probable (<span className="font-semibold">{winner}</span>),
            estas son sus coberturas históricas:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {betCards.map((card) => {
              const title = card.stat
                ? `Basado en el vecino ganador (Nº ${winner}). Su ${card.title} "${card.stat.label}" apareció ${card.stat.count} de ${sectionStats.total} tiradas registradas (excluyendo el 0) = ${card.stat.pct}%. Mismo dato que el bloque "Sección más frecuente", no se recalcula aparte.`
                : `Basado en el vecino ganador (Nº ${winner}). Sin dato de ${card.title} (el 0 no cuenta para esta categoría).`;
              return (
              <div key={card.title} className="p-2 border rounded" title={title}>
                <div className="text-xs text-gray-500">{card.title}</div>
                <div className="font-semibold">{card.stat?.label ?? "—"}</div>
                <div className="text-sm text-gray-600">
                  {card.stat ? `${card.stat.pct}% histórico` : "—"}
                </div>
                {card.best && (
                  <span className="inline-block mt-1 px-1 py-0.5 text-xs rounded bg-amber-100 text-amber-700">
                    Mejor cobertura
                  </span>
                )}
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* (b) Sección más frecuente — sobre todo el historial */}
      <div className="p-3 border rounded bg-white">
        <h3 className="font-semibold mb-2">Sección más frecuente</h3>
        {sectionStats.total === 0 ? (
          <p className="text-sm text-gray-500">
            No hay tiradas (sin contar el 0) para calcular secciones.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">Docena</div>
              {sectionStats.dozen.map((o, i) => (
                <StatBar
                  key={o.key}
                  label={o.label}
                  count={o.count}
                  pct={o.pct}
                  badge={i === dozenTop ? "Más frecuente" : undefined}
                  title={`"${o.label}": ${o.count} de ${sectionStats.total} tiradas registradas (excluyendo el 0) = ${o.pct}%.`}
                />
              ))}
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Columna</div>
              {sectionStats.column.map((o, i) => (
                <StatBar
                  key={o.key}
                  label={o.label}
                  count={o.count}
                  pct={o.pct}
                  badge={i === columnTop ? "Más frecuente" : undefined}
                  title={`"${o.label}": ${o.count} de ${sectionStats.total} tiradas registradas (excluyendo el 0) = ${o.pct}%.`}
                />
              ))}
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Rango</div>
              {sectionStats.range.map((o, i) => (
                <StatBar
                  key={o.key}
                  label={o.label}
                  count={o.count}
                  pct={o.pct}
                  badge={i === rangeTop ? "Más frecuente" : undefined}
                  title={`"${o.label}": ${o.count} de ${sectionStats.total} tiradas registradas (excluyendo el 0) = ${o.pct}%.`}
                />
              ))}
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Color</div>
              {sectionStats.color.map((o, i) => (
                <StatBar
                  key={o.key}
                  label={o.label}
                  count={o.count}
                  pct={o.pct}
                  badge={i === colorTop ? "Más frecuente" : undefined}
                  title={`"${o.label}": ${o.count} de ${sectionStats.colorTotal} tiradas registradas (incluido el 0) = ${o.pct}%.`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
