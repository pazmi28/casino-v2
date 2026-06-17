export type SpinColor = "R" | "N" | "V";

export const COLOR_MAP: Record<number, SpinColor> = {
  0: "V",
  1: "R", 3: "R", 5: "R", 7: "R", 9: "R", 12: "R", 14: "R", 16: "R", 18: "R",
  19: "R", 21: "R", 23: "R", 25: "R", 27: "R", 30: "R", 32: "R", 34: "R", 36: "R",
  2: "N", 4: "N", 6: "N", 8: "N", 10: "N", 11: "N", 13: "N", 15: "N", 17: "N",
  20: "N", 22: "N", 24: "N", 26: "N", 28: "N", 29: "N", 31: "N", 33: "N", 35: "N",
};

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
