import { supabase } from "./supabaseClient";
import type { Spin } from "../types";

export async function listSpins(casinoId: string): Promise<Spin[]> {
  const { data, error } = await supabase
    .from("spins")
    .select("*")
    .eq("casino_id", casinoId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// El color NO se envía: es una columna generada en Postgres y vuelve calculada
// en cada fila devuelta por el insert.
export async function addSpins(
  casinoId: string,
  numbers: number[],
): Promise<Spin[]> {
  if (numbers.length === 0) return [];

  const rows = numbers.map((number) => ({ casino_id: casinoId, number }));
  const { data, error } = await supabase.from("spins").insert(rows).select();

  if (error) throw error;
  return data ?? [];
}

export async function deleteSpin(id: string): Promise<void> {
  const { error } = await supabase.from("spins").delete().eq("id", id);
  if (error) throw error;
}
