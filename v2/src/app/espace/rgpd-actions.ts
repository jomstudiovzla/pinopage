"use server";

import { createClient } from "@/lib/supabase/server";

export type RgpdResult = { ok: boolean; error?: string };

/**
 * Droit à l'effacement (Art. 17 RGPD) en self-service.
 * Llama a la función SECURITY DEFINER public.anonymize_own_account() (que anonimiza
 * solo los datos del propio auth.uid y conserva las facturas 10 años) y cierra sesión.
 */
export async function deleteMyAccount(): Promise<RgpdResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_authenticated" };

  const { error } = await supabase.rpc("anonymize_own_account");
  if (error) return { ok: false, error: error.message };

  await supabase.auth.signOut();
  return { ok: true };
}
