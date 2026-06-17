import { supabase } from "./supabaseClient";
import type { Pattern } from "../types";

// Fila tal cual la devuelve el join: pattern_numbers viene como array de objetos.
interface PatternRow {
  id: string;
  casino_id: string | null;
  name: string;
  description: string | null;
  confidence: number | null;
  created_at: string;
  pattern_numbers: { number: number }[] | null;
}

function toPattern(row: PatternRow): Pattern {
  const { pattern_numbers, ...rest } = row;
  return {
    ...rest,
    numbers: (pattern_numbers ?? []).map((pn) => pn.number),
  };
}

export async function listPatterns(casinoId: string): Promise<Pattern[]> {
  const { data, error } = await supabase
    .from("patterns")
    .select("*, pattern_numbers(number)")
    .or(`casino_id.is.null,casino_id.eq.${casinoId}`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as PatternRow[]).map(toPattern);
}

export interface CreatePatternInput {
  casinoId: string | null;
  name: string;
  description: string | null;
  confidence: number | null;
  numbers: number[];
}

export async function createPattern(
  input: CreatePatternInput,
): Promise<Pattern> {
  const { data, error } = await supabase
    .from("patterns")
    .insert({
      casino_id: input.casinoId,
      name: input.name,
      description: input.description,
      confidence: input.confidence,
    })
    .select()
    .single();

  if (error) throw error;
  const pattern = data as Omit<PatternRow, "pattern_numbers">;

  const rows = input.numbers.map((number) => ({
    pattern_id: pattern.id,
    number,
  }));
  // Defensa: nunca llamar al insert con un array vacío (Supabase lo rechaza y
  // dejaría el patrón sin números). El componente ya valida antes, esto es
  // por si se llega aquí desde otro sitio en el futuro.
  if (rows.length > 0) {
    const { error: numbersError } = await supabase
      .from("pattern_numbers")
      .insert(rows);
    // Sin rollback manual (datos no críticos), pero propagamos el error igual.
    if (numbersError) throw numbersError;
  }

  return { ...pattern, numbers: input.numbers };
}

export async function deletePattern(id: string): Promise<void> {
  // pattern_numbers se borra solo por el ON DELETE CASCADE del schema.
  const { error } = await supabase.from("patterns").delete().eq("id", id);
  if (error) throw error;
}
