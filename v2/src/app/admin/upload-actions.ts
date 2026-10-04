"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type UploadResult = { ok: boolean; error?: string };

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB

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

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Nombre a mostrar del cliente (full_name o email) para `client_display`. */
async function clientDisplayFor(supabase: Supabase, clientId: string): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", clientId)
    .maybeSingle();
  if (!data) return null;
  return (data.full_name as string | null) || (data.email as string | null) || null;
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/**
 * Sube una factura al bucket privado `invoices` ({client_id}/archivo) y crea el
 * registro en public.invoices. Rellena client_display; rollback del archivo si el
 * insert falla; límite de 15 MB. RLS: solo admin.
 */
export async function uploadInvoice(formData: FormData): Promise<UploadResult> {
  const clientId = String(formData.get("clientId") || "");
  const amount = Number(formData.get("amount") || 0);
  const rail = String(formData.get("rail") || "direct");
  const file = formData.get("file");

  if (!clientId || !amount || !(file instanceof File) || file.size === 0) {
    return { ok: false, error: "missing_fields" };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: "file_too_large" };
  }
  if (!["unipros", "direct"].includes(rail)) {
    return { ok: false, error: "invalid_rail" };
  }

  try {
    const supabase = await requireAdmin();
    const path = `${clientId}/${Date.now()}-${sanitizeName(file.name)}`;

    const { error: upErr } = await supabase.storage
      .from("invoices")
      .upload(path, file, { upsert: false });
    if (upErr) return { ok: false, error: upErr.message };

    const clientDisplay = await clientDisplayFor(supabase, clientId);

    const { error: insErr } = await supabase.from("invoices").insert({
      client_id: clientId,
      client_display: clientDisplay,
      amount_ttc: amount,
      rail,
      status: "issued",
      document_path: path,
      issued_at: new Date().toISOString().slice(0, 10),
    });
    if (insErr) {
      // Rollback : évite les fichiers orphelins dans le bucket.
      await supabase.storage.from("invoices").remove([path]);
      return { ok: false, error: insErr.message };
    }

    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error" };
  }
}

/**
 * Sube un dossier (crédit d'impôt SAP) al bucket privado `dossiers` y crea el
 * registro en public.dossiers. Mismas protecciones (rollback + límite de tamaño).
 */
export async function uploadDossier(formData: FormData): Promise<UploadResult> {
  const clientId = String(formData.get("clientId") || "");
  const title = String(formData.get("title") || "").trim();
  const file = formData.get("file");

  if (!clientId || !title || !(file instanceof File) || file.size === 0) {
    return { ok: false, error: "missing_fields" };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: "file_too_large" };
  }

  try {
    const supabase = await requireAdmin();
    const path = `${clientId}/${Date.now()}-${sanitizeName(file.name)}`;

    const { error: upErr } = await supabase.storage
      .from("dossiers")
      .upload(path, file, { upsert: false });
    if (upErr) return { ok: false, error: upErr.message };

    const { error: insErr } = await supabase.from("dossiers").insert({
      client_id: clientId,
      title,
      document_path: path,
    });
    if (insErr) {
      await supabase.storage.from("dossiers").remove([path]);
      return { ok: false, error: insErr.message };
    }

    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error" };
  }
}
