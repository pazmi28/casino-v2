import { supabase } from "./supabaseClient";
import type { Casino, City } from "../types";

export async function listCasinos(city: City): Promise<Casino[]> {
  const { data, error } = await supabase
    .from("casinos")
    .select("*")
    .eq("city", city)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createCasino(city: City, name: string): Promise<Casino> {
  const { data, error } = await supabase
    .from("casinos")
    .insert({ city, name })
    .select()
    .single();

  if (error) throw error;
  return data as Casino;
}
