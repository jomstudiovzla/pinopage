"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const LEAD_STATUSES = ["new", "contacted", "quoted", "won", "lost"] as const;
const INVOICE_STATUSES = [
  "draft",
  "issued",
  "pending",
  "paid",
  "cancelled",
  "anonymized",
] as const;

export type ActionResult = { ok: boolean; error?: string };

/** Verifica sesión + rol admin (app_metadata.role) en el servidor antes de mutar. */
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

export async function updateLeadStatus(
  leadId: string,
  status: string,
): Promise<ActionResult> {
  if (!(LEAD_STATUSES as readonly string[]).includes(status)) {
    return { ok: false, error: "invalid_status" };
  }
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase.from("leads").update({ status }).eq("id", leadId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error" };
  }
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: string,
): Promise<ActionResult> {
  if (!(INVOICE_STATUSES as readonly string[]).includes(status)) {
    return { ok: false, error: "invalid_status" };
  }
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase
      .from("invoices")
      .update({ status })
      .eq("id", invoiceId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error" };
  }
}
