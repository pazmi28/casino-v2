import type { SpinColor } from "../lib/roulette";

export type City = "Zaragoza" | "Madrid" | "Barcelona";

export const CITIES: City[] = ["Zaragoza", "Madrid", "Barcelona"];

export interface Casino {
  id: string;
  city: City;
  name: string;
  created_at: string;
}

export interface Spin {
  id: string;
  casino_id: string;
  number: number;
  color: SpinColor;
  created_at: string;
}
