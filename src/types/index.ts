export type City = "Zaragoza" | "Madrid" | "Barcelona";

export const CITIES: City[] = ["Zaragoza", "Madrid", "Barcelona"];

export interface Casino {
  id: string;
  city: City;
  name: string;
  created_at: string;
}
