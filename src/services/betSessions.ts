import { supabase } from "./supabaseClient";
import type { BetSession } from "../types";

export async function listBetSessions(casinoId: string): Promise<BetSession[]> {
  const { data, error } = await supabase
    .from("bet_sessions")
    .select("*")
    .eq("casino_id", casinoId)
    .order("session_date", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createBetSession(
  casinoId: string,
  sessionDate: string,
  lossesBeforeWin: number | null,
  notes: string | null,
): Promise<BetSession> {
  const { data, error } = await supabase
    .from("bet_sessions")
    .insert({
      casino_id: casinoId,
      session_date: sessionDate,
      losses_before_win: lossesBeforeWin,
      notes,
    })
    .select()
    .single();

  if (error) throw error;
  return data as BetSession;
}

export async function deleteBetSession(id: string): Promise<void> {
  const { error } = await supabase.from("bet_sessions").delete().eq("id", id);
  if (error) throw error;
}
