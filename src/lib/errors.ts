// supabase-js no devuelve Error nativos sino objetos (PostgrestError) con la
// descripción en `.message`. Leerlos con `e instanceof Error` falla y acaba
// mostrando siempre "Error desconocido", ocultando la causa real.
export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e !== null && "message" in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string" && m.length > 0) return m;
  }
  return "Error desconocido";
}
