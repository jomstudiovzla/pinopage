import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Genera una signed URL temporal para un objeto privado de Storage.
 * La RLS de storage.objects decide si el llamante puede verlo (cliente: su propia
 * carpeta {uid}/… ; admin: todo). Devuelve null si no hay path o no tiene permiso.
 */
export async function signedUrl(
  supabase: Supabase,
  bucket: "invoices" | "dossiers",
  path: string | null | undefined,
  expiresIn = 300,
): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) return null;
  return data?.signedUrl ?? null;
}
