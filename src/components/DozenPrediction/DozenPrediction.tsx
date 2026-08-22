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

// Tamaño mínimo de muestra para que el test de sesgo tenga sentido (regla
// habitual del chi-cuadrado: conteo esperado ≥5 por categoría; con 3
// categorías da un mínimo de 15, se deja margen a 30 para evitar falsos
// positivos con muestras pequeñas).
const MIN_BIAS_SAMPLE = 30;

interface BiasResult {
  total: number;
  chiSquared: number;
  pValue: number;
  stats: DozenStat[];
}

// Test de bondad de ajuste chi-cuadrado: compara el conteo observado de cada
// docena, sobre TODO el historial (no la ventana de 10), contra el 33.3%
// esperado por azar puro (12 números de 36, el 0 no cuenta). Con 3
// categorías hay 2 grados de libertad, y la chi-cuadrado con 2 g.l. es
// exactamente una exponencial de tasa 1/2 — de ahí que el p-valor tenga
// forma cerrada (Math.exp) sin necesitar una función gamma.
function buildBiasAnalysis(spins: Spin[]): BiasResult | null {
  const { stats, total } = buildDozenStats(spins);
  if (total < MIN_BIAS_SAMPLE) return null;

  const expected = total / 3;
  const chiSquared = stats.reduce(
    (sum, s) => sum + (s.count - expected) ** 2 / expected,
    0,
  );
  const pValue = Math.exp(-chiSquared / 2);

  return { total, chiSquared, pValue, stats };
}

function biasVerdict(pValue: number): {
  label: string;
  className: string;
} {
  if (pValue < 0.01) {
    return { label: "Sesgo muy probable", className: "bg-red-100 text-red-700" };
  }
  if (pValue < 0.05) {
    return { label: "Sesgo probable", className: "bg-red-100 text-red-700" };
  }
  if (pValue < 0.1) {
    return {
      label: "Posible sesgo (a vigilar)",
      className: "bg-amber-100 text-amber-700",
    };
  }
  return {
    label: "Sin sesgo detectable",
    className: "bg-gray-100 text-gray-600",
  };
}

// Mismo umbral que MIN_BIAS_SAMPLE: con 30 intentos, hits esperados (10) y
// fallos esperados (20) bajo H0 (p=1/3) superan de sobra el mínimo de 5
// que exige la aproximación normal a la binomial usada en backtestVerdict.
const MIN_BACKTEST_SAMPLE = 30;

interface BacktestResult {
  hits: number;
  attempts: number;
  skippedTies: number;
  pct: number;
  z: number | null; // null si attempts < MIN_BACKTEST_SAMPLE (aún no fiable)
}

// Backtest del aviso "docena caliente": recorre el historial en orden y, en
// cada tirada, calcula qué docena habría sido la caliente usando SOLO las
// WINDOW tiradas anteriores a esa (nunca la propia ni las posteriores),
// exactamente la misma regla que ve el usuario en vivo. Compara esa
// predicción contra la docena real de esa tirada. Las ventanas con empate en
// el máximo se excluyen del cómputo (no hay una única predicción que
// evaluar), igual que el bloque en vivo no marca "Más probable" si hay
// empate.
function buildBacktest(spins: Spin[]): BacktestResult {
  let hits = 0;
  let attempts = 0;
  let skippedTies = 0;

  for (let i = 1; i < spins.length; i++) {
    const actualDozen = dozenOf(spins[i].number);
    if (actualDozen === null) continue; // el 0 no es una docena predecible

    const priorWindow = spins.slice(Math.max(0, i - WINDOW), i);
    const { stats, total } = buildDozenStats(priorWindow);
    if (total === 0) continue; // ventana previa sin números válidos

    const hotIdx = extremeIndices(stats, "max");
    if (hotIdx.length !== 1) {
      skippedTies++;
      continue;
    }

    attempts++;
    if (stats[hotIdx[0]].key === actualDozen) hits++;
  }

  const pct = attempts > 0 ? Math.round((hits / attempts) * 100) : 0;
  if (attempts < MIN_BACKTEST_SAMPLE) {
    return { hits, attempts, skippedTies, pct, z: null };
  }

  // Test binomial de una cola frente a H0: p=1/3 (aproximación normal, sin
  // corrección de continuidad — con attempts≥30 el error es despreciable).
  const expectedP = 1 / 3;
  const z =
    (hits - attempts * expectedP) /
    Math.sqrt(attempts * expectedP * (1 - expectedP));

  return { hits, attempts, skippedTies, pct, z };
}

// Umbrales de z para una cola (P(Z > z)): 1.282≈p<0.10, 1.645≈p<0.05,
// 2.326≈p<0.01. Evita implementar la función de error solo para esto.
function backtestVerdict(z: number): { label: string; className: string } {
  if (z >= 2.326) {
    return { label: "Bate el azar con alta confianza", className: "bg-red-100 text-red-700" };
  }
  if (z >= 1.645) {
    return { label: "Bate el azar", className: "bg-red-100 text-red-700" };
  }
  if (z >= 1.282) {
    return {
      label: "Posible ventaja (a vigilar)",
      className: "bg-amber-100 text-amber-700",
    };
  }
  return {
    label: "No bate el azar de forma consistente",
    className: "bg-gray-100 text-gray-600",
  };
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
// apariciones, lógica "está por salir"). Un segundo bloque hace un backtest
// en cliente (sin persistir nada): recorre el historial en orden evaluando
// si el aviso de "docena caliente" habría acertado en cada tirada usando
// solo las anteriores. Un tercer bloque analiza TODO el historial con un
// test chi-cuadrado buscando un sesgo físico real de la rueda/mesa (la
// única fuente legítima de ventaja: el orden de las tiradas no la tiene,
// cada una es independiente de la anterior).
export function DozenPrediction({ spins }: Props) {
  const sample = useMemo(() => spins.slice(-WINDOW), [spins]);
  const { stats, total } = useMemo(() => buildDozenStats(sample), [sample]);
  const bias = useMemo(() => buildBiasAnalysis(spins), [spins]);
  const fullTotal = useMemo(() => buildDozenStats(spins).total, [spins]);
  const backtest = useMemo(() => buildBacktest(spins), [spins]);

  const windowNote =
    sample.length < WINDOW
      ? `últimas ${sample.length} tiradas (aún no hay ${WINDOW} registradas)`
      : `últimas ${WINDOW} tiradas`;

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-2">Predicción Decenas</h2>

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

      <div className="mt-4 p-3 border rounded bg-white">
        <h3 className="font-semibold mb-2">Precisión histórica del aviso</h3>
        {backtest.z === null ? (
          <p className="text-sm text-gray-500">
            Aún no hay suficientes predicciones resueltas en el historial (
            {backtest.attempts} de las {MIN_BACKTEST_SAMPLE} necesarias) para
            medir la precisión con fiabilidad.
          </p>
        ) : (
          (() => {
            const verdict = backtestVerdict(backtest.z);
            return (
              <>
                <p className="text-sm text-gray-600 mb-2">
                  Recorriendo el historial en orden: en cada tirada, ¿acertó
                  la docena que el aviso de "docena caliente" habría marcado
                  usando solo las tiradas anteriores a esa?
                </p>
                <span
                  className={`inline-block mb-2 px-1 py-0.5 text-xs rounded ${verdict.className}`}
                >
                  {verdict.label}
                </span>
                <DozenBar
                  label="Aciertos del aviso"
                  count={backtest.hits}
                  pct={backtest.pct}
                  title={`${backtest.hits} aciertos de ${backtest.attempts} predicciones resueltas = ${backtest.pct}% (esperado ~33% por azar).`}
                />
                <p className="text-xs text-gray-400 mt-1">
                  z = {backtest.z.toFixed(2)} frente al 33.3% esperado por
                  azar (test binomial de una cola). Se excluyeron{" "}
                  {backtest.skippedTies} tiradas con empate en la docena
                  caliente (no había una predicción única que evaluar). Un
                  resultado por encima del azar de forma sostenida apunta al
                  mismo sesgo físico que "Sesgo histórico" de abajo, no a que
                  el orden de los números sea predecible.
                </p>
              </>
            );
          })()
        )}
      </div>

      <div className="mt-4 p-3 border rounded bg-white">
        <h3 className="font-semibold mb-2">Sesgo histórico (todo el historial)</h3>
        {bias === null ? (
          <p className="text-sm text-gray-500">
            Aún no hay tiradas suficientes en todo el historial ({fullTotal}{" "}
            sin contar el 0, hacen falta al menos {MIN_BIAS_SAMPLE}) para un
            análisis de sesgo estadísticamente fiable.
          </p>
        ) : (
          (() => {
            const verdict = biasVerdict(bias.pValue);
            const expectedPct = 33; // 33.3% redondeado, referencia visual
            const overIdx = extremeIndices(bias.stats, "max");
            const flagOver = bias.pValue < 0.1 && overIdx.length === 1;
            return (
              <>
                <p className="text-sm text-gray-600 mb-2">
                  Comparando las {bias.total} tiradas de todo el historial
                  (sin contar el 0) contra el 33.3% esperado por azar en cada
                  docena.
                </p>
                <span
                  className={`inline-block mb-2 px-1 py-0.5 text-xs rounded ${verdict.className}`}
                >
                  {verdict.label}
                </span>
                {bias.stats.map((s, i) => (
                  <DozenBar
                    key={s.key}
                    label={s.label}
                    count={s.count}
                    pct={s.pct}
                    badge={
                      flagOver && overIdx.includes(i)
                        ? "Por encima de lo esperado"
                        : undefined
                    }
                    title={`"${s.label}": ${s.count} de ${bias.total} = ${s.pct}% (esperado ~${expectedPct}%).`}
                  />
                ))}
                <p className="text-xs text-gray-400 mt-1">
                  χ² = {bias.chiSquared.toFixed(2)}, p = {bias.pValue.toFixed(3)}{" "}
                  (2 grados de libertad). Un sesgo real solo puede venir de un
                  defecto físico de la rueda o la mesa, no de la secuencia de
                  números — cada tirada sigue siendo independiente de la
                  anterior.
                </p>
              </>
            );
          })()
        )}
      </div>
    </div>
  );
}
