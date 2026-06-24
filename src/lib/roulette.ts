export type SpinColor = "R" | "N" | "V";

export const COLOR_MAP: Record<number, SpinColor> = {
  0: "V",
  1: "R", 3: "R", 5: "R", 7: "R", 9: "R", 12: "R", 14: "R", 16: "R", 18: "R",
  19: "R", 21: "R", 23: "R", 25: "R", 27: "R", 30: "R", 32: "R", 34: "R", 36: "R",
  2: "N", 4: "N", 6: "N", 8: "N", 10: "N", 11: "N", 13: "N", 15: "N", 17: "N",
  20: "N", 22: "N", 24: "N", 26: "N", 28: "N", 29: "N", 31: "N", 33: "N", 35: "N",
};

// Paleta única y viva para todas las vistas (tiradas, rueda, mesa).
// Cualquier componente que pinte un número usa SIEMPRE esto: no se vuelve a
// definir el mapeo de color en ningún sitio.
export const COLOR_STYLE: Record<SpinColor, string> = {
  R: "bg-red-600 text-white",
  N: "bg-zinc-900 text-white",
  V: "bg-green-700 text-white",
};

// Docena del número: 1 (1–12), 2 (13–24), 3 (25–36), null para el 0.
export function dozenOf(n: number): 1 | 2 | 3 | null {
  if (n === 0) return null;
  if (n <= 12) return 1;
  if (n <= 24) return 2;
  return 3;
}

// Fila física de la mesa europea (las apuestas "2 to 1").
// top: 3,6,9…36 · mid: 2,5,8…35 · bottom: 1,4,7…34 · null para el 0.
export function tableRow(n: number): "top" | "mid" | "bottom" | null {
  if (n === 0) return null;
  if (n % 3 === 0) return "top";
  if (n % 3 === 2) return "mid";
  return "bottom";
}

// Columna física de la mesa (el "column bet" 2 a 1): 1 = …1,4,7 · 2 = …2,5,8 ·
// 3 = …3,6,9. null para el 0.
export function columnOf(n: number): 1 | 2 | 3 | null {
  if (n === 0) return null;
  const m = n % 3;
  return m === 1 ? 1 : m === 2 ? 2 : 3;
}

// Vecinos físicos en el cilindro a ±11 posiciones (la base del resaltado de
// la rueda y de la estadística de vecinos). Fuente única: no recalcular
// rightIdx/leftIdx en los componentes.
export function getNeighbors(n: number): { left: number; right: number } {
  const idx = ROULETTE_SEQUENCE.indexOf(n);
  const total = ROULETTE_SEQUENCE.length;
  const rightIdx = (idx + 11) % total;
  const leftIdx = (idx - 11 + total) % total;
  return {
    left: ROULETTE_SEQUENCE[leftIdx],
    right: ROULETTE_SEQUENCE[rightIdx],
  };
}

// Par/impar. El 0 no es par a efectos de apuesta.
export function isEven(n: number): boolean {
  return n !== 0 && n % 2 === 0;
}

// Falta (1–18) frente a pasa (19–36).
export function isLow(n: number): boolean {
  return n >= 1 && n <= 18;
}

// Rojo según el mapeo estándar; false para el 0 (verde).
export function isRed(n: number): boolean {
  return COLOR_MAP[n] === "R";
}

// Parseo único de entrada de números (tiradas, números de patrones…):
// separa por comas, ignora vacíos, valida 0–36 y separa válidos de inválidos.
export function parseNumbers(input: string): {
  valid: number[];
  invalid: string[];
} {
  const valid: number[] = [];
  const invalid: string[] = [];

  for (const token of input.split(",")) {
    const trimmed = token.trim();
    if (trimmed === "") continue;
    const n = Number(trimmed);
    if (Number.isInteger(n) && n >= 0 && n <= 36) {
      valid.push(n);
    } else {
      invalid.push(trimmed);
    }
  }

  return { valid, invalid };
}

export const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31];

export const ROULETTE_SEQUENCE = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

export const SECTOR_VECINOS = [
  22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25,
];
export const SECTOR_TERCIO_RUEDA = [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33];
export const SECTOR_HUERFANOS = [1, 20, 14, 31, 9, 17, 34, 6];
