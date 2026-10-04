"use server";

import { createClient } from "@/lib/supabase/server";

const MAIL_ENDPOINT = "https://pino-mail.pinoespacesverts.online/notify";

export type DevisInput = {
  fullName: string;
  email: string;
  phone: string;
  city?: string;
  services?: string[];
  message?: string;
  couponCode?: string;
};

export type DevisResult = { ok: boolean; ref?: string; error?: string };

/**
 * Guarda el lead en Supabase (columnas reales del esquema maestro) y notifica
 * al Worker Resend (event: devis) de forma no bloqueante.
 * RLS: leads_insert_public permite insert a anon/authenticated.
 */
export async function submitDevis(input: DevisInput): Promise<DevisResult> {
  const fullName = (input.fullName || "").trim();
  const email = (input.email || "").trim().toLowerCase();
  const phone = (input.phone || "").trim();

  if (!fullName || !email || !phone) {
    return { ok: false, error: "missing_fields" };
  }

  const gardenDescription = [
    input.services?.length ? `Prestations : ${input.services.join(", ")}` : "",
    (input.message || "").trim(),
  ]
    .filter(Boolean)
    .join(" — ");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      full_name: fullName,
      email,
      phone,
      commune: input.city?.trim() || null,
      garden_description: gardenDescription || null,
      promo_code: input.couponCode?.trim() || null,
      lead_type: "b2c",
      source: "web_devis",
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  const ref = data?.id ? `PINO-${String(data.id).slice(0, 8).toUpperCase()}` : undefined;

  // Aviso por correo (Worker Resend). No bloquea la respuesta al cliente.
  try {
    await fetch(MAIL_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event: "devis",
        mode: "public",
        data: {
          name: fullName,
          email,
          phone,
          commune: input.city || "",
          service: (input.services || []).join(", "),
          details: input.message || "",
          leadId: ref,
        },
      }),
    });
  } catch {
    // Non bloquant : le lead est déjà enregistré.
  }

  return { ok: true, ref };
}
