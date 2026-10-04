"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PortfolioResult = { ok: boolean; error?: string };

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

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/** Sube una foto de chantier al bucket público `portfolio` y crea el registro. */
export async function uploadPortfolioItem(formData: FormData): Promise<PortfolioResult> {
  const title = String(formData.get("title") || "").trim();
  const commune = String(formData.get("commune") || "").trim();
  const kind = String(formData.get("kind") || "real_work");
  const file = formData.get("file");

  if (!title || !(file instanceof File) || file.size === 0) {
    return { ok: false, error: "missing_fields" };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: "file_too_large" };
  }
  if (!["real_work", "marketing"].includes(kind)) {
    return { ok: false, error: "invalid_kind" };
  }

  try {
    const supabase = await requireAdmin();
    const path = `${kind}/${Date.now()}-${sanitizeName(file.name)}`;

    const { error: upErr } = await supabase.storage
      .from("portfolio")
      .upload(path, file, { upsert: false });
    if (upErr) return { ok: false, error: upErr.message };

    const { error: insErr } = await supabase.from("portfolio_items").insert({
      kind,
      title,
      commune: commune || null,
      image_path: path,
      published: false,
    });
    if (insErr) {
      await supabase.storage.from("portfolio").remove([path]);
      return { ok: false, error: insErr.message };
    }

    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error" };
  }
}

export async function togglePortfolioPublished(
  id: string,
  published: boolean,
): Promise<PortfolioResult> {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase
      .from("portfolio_items")
      .update({ published })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error" };
  }
}

export async function deletePortfolioItem(
  id: string,
  imagePath: string,
): Promise<PortfolioResult> {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase.from("portfolio_items").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    if (imagePath) {
      await supabase.storage.from("portfolio").remove([imagePath]);
    }
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error" };
  }
}
