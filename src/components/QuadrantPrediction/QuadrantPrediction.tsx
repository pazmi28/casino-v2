import { useMemo } from "react";
import { dozenOf } from "../../lib/roulette";
import type { Spin } from "../../types";

const WINDOW = 10;

interface DozenStat {
  key: 1 | 2 | 3;
  label: string;
  count: number;
  pct: number;
}

// Cuenta docenas sobre la muestra dada (el 0 no cuenta, igual que en
// NeighborStats.buildSectionStats).
function buildDozenStats(sample: Spin[]): { stats: DozenStat[]; total: number } {
  const counts = [0, 0, 0];
  let total = 0;
  for (const s of sample) {
    const d = dozenOf(s.number);
    if (d) {
      counts[d - 1]++;
      total++;
    }
  }
  const pct = (c: number) => (total > 0 ? Math.round((c / total) * 100) : 0);
  return {
    total,
    stats: [1, 2, 3].map((d) => ({
      key: d as 1 | 2 | 3,
      label: `${d}ª docena`,
      count: counts[d - 1],
      pct: pct(counts[d - 1]),
    })),
  };
}

// Índices con el conteo extremo (máximo o mínimo); puede haber varios si hay
// empate.
function extremeIndices(stats: DozenStat[], mode: "max" | "min"): number[] {
  const counts = stats.map((s) => s.count);
  const target = mode === "max" ? Math.max(...counts) : Math.min(...counts);
  return stats.reduce<number[]>((acc, s, i) => {
    if (s.count === target) acc.push(i);
    return acc;
  }, []);
}

function DozenBar({
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
  title: string;
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

interface Props {
  spins: Spin[];
}

// Predicción descriptiva (no una garantía de acierto: cada tirada de ruleta
// física es independiente) de la próxima docena a partir de las últimas 10
// tiradas: docena caliente (más apariciones) y docena fría (menos
// apariciones, lógica "está por salir").
export function QuadrantPrediction({ spins }: Props) {
  const sample = useMemo(() => spins.slice(-WINDOW), [spins]);
  const { stats, total } = useMemo(() => buildDozenStats(sample), [sample]);

  const windowNote =
    sample.length < WINDOW
      ? `últimas ${sample.length} tiradas (aún no hay ${WINDOW} registradas)`
      : `últimas ${WINDOW} tiradas`;

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-2">Predicción Cuadrantes</h2>

      {total === 0 ? (
        <p className="text-sm text-gray-500">
          Aún no hay tiradas (sin contar el 0) en las {windowNote} para
          predecir una docena.
        </p>
      ) : (
        (() => {
          const hotIdx = extremeIndices(stats, "max");
          const coldIdx = extremeIndices(stats, "min");
          const allTied = hotIdx.length === stats.length;

          return (
            <>
              <p className="text-sm text-gray-600 mb-3">
                Basado en las {windowNote} ({total} sin contar el 0).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 border rounded bg-white">
                  <h3 className="font-semibold mb-2">Docena caliente</h3>
                  {allTied && (
                    <p className="text-sm text-gray-500 mb-2">
                      Empate entre las 3 docenas, sin tendencia clara.
                    </p>
                  )}
                  {stats.map((s, i) => (
                    <DozenBar
                      key={s.key}
                      label={s.label}
                      count={s.count}
                      pct={s.pct}
                      badge={
                        allTied
                          ? undefined
                          : hotIdx.includes(i)
                            ? hotIdx.length > 1
                              ? "Empate"
                              : "Más probable"
                            : undefined
                      }
                      title={`"${s.label}": ${s.count} de ${total} tiradas en las ${windowNote} = ${s.pct}%.`}
                    />
                  ))}
                </div>
                <div className="p-3 border rounded bg-white">
                  <h3 className="font-semibold mb-2">Docena fría</h3>
                  {allTied && (
                    <p className="text-sm text-gray-500 mb-2">
                      Empate entre las 3 docenas, sin tendencia clara.
                    </p>
                  )}
                  {stats.map((s, i) => (
                    <DozenBar
                      key={s.key}
                      label={s.label}
                      count={s.count}
                      pct={s.pct}
                      badge={
                        allTied
                          ? undefined
                          : coldIdx.includes(i)
                            ? coldIdx.length > 1
                              ? "Empate"
                              : "Menos probable"
                            : undefined
                      }
                      title={`"${s.label}": ${s.count} de ${total} tiradas en las ${windowNote} = ${s.pct}%.`}
                    />
                  ))}
                </div>
              </div>
            </>
          );
        })()
      )}
    </div>
  );
}
