"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type UploadResult = { ok: boolean; error?: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || (user.app_metadata?.role as string | undefined) !== "admin") {
    throw new Error("unauthorized");
  }
  return supabase;
}

/**
 * Sube una factura al bucket privado `invoices` en la carpeta del cliente
 * ({client_id}/archivo) y crea el registro en public.invoices.
 * RLS: solo admin puede escribir en el bucket y en la tabla.
 */
export async function uploadInvoice(formData: FormData): Promise<UploadResult> {
  const clientId = String(formData.get("clientId") || "");
  const amount = Number(formData.get("amount") || 0);
  const rail = String(formData.get("rail") || "direct");
  const file = formData.get("file");

  if (!clientId || !amount || !(file instanceof File) || file.size === 0) {
    return { ok: false, error: "missing_fields" };
  }
  if (!["unipros", "direct"].includes(rail)) {
    return { ok: false, error: "invalid_rail" };
  }

  try {
    const supabase = await requireAdmin();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${clientId}/${Date.now()}-${safeName}`;

    const { error: upErr } = await supabase.storage
      .from("invoices")
      .upload(path, file, { upsert: false });
    if (upErr) return { ok: false, error: upErr.message };

    const { error: insErr } = await supabase.from("invoices").insert({
      client_id: clientId,
      amount_ttc: amount,
      rail,
      status: "issued",
      document_path: path,
      issued_at: new Date().toISOString().slice(0, 10),
    });
    if (insErr) return { ok: false, error: insErr.message };

    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error" };
  }
}
