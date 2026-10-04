"use server";

import { createClient } from "@/lib/supabase/server";

const MAIL_ENDPOINT = "https://pino-mail.pinoespacesverts.online/notify";

export type B2BInput = {
  companyName: string;
  siret?: string;
  contactName: string;
  email: string;
  phone: string;
  commune?: string;
  surface?: string;
  frequency?: string;
};

export type B2BResult = { ok: boolean; ref?: string; error?: string };

const FREQ_FR: Record<string, string> = {
  ponctuel: "Ponctuel",
  hebdomadaire: "Hebdomadaire",
  mensuel: "Mensuel",
  annuel: "Annuel",
};

/**
 * Lead B2B (syndics, entreprises, copropriétés). Insert en public.leads con
 * lead_type='b2b' y source='web_b2b' (valor válido del enum lead_source).
 */
export async function submitB2B(input: B2BInput): Promise<B2BResult> {
  const companyName = (input.companyName || "").trim();
  const contactName = (input.contactName || "").trim();
  const email = (input.email || "").trim().toLowerCase();
  const phone = (input.phone || "").trim();

  if (!companyName || !contactName || !email || !phone) {
    return { ok: false, error: "missing_fields" };
  }

  const details = [
    input.surface ? `Surface : ~${input.surface} m²` : "",
    input.frequency ? `Fréquence : ${FREQ_FR[input.frequency] || input.frequency}` : "",
  ]
    .filter(Boolean)
    .join(" — ");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("leads")
    .insert({
      user_id: user?.id ?? null,
      lead_type: "b2b",
      source: "web_b2b",
      full_name: contactName,
      email,
      phone,
      commune: input.commune?.trim() || null,
      company_name: companyName,
      siret: input.siret?.trim() || null,
      garden_description: details || null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  const ref = data?.id ? `PRO-${String(data.id).slice(0, 8).toUpperCase()}` : undefined;

  try {
    await fetch(MAIL_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event: "devis",
        mode: "public",
        data: {
          name: contactName,
          email,
          phone,
          commune: input.commune || "",
          service: `B2B — ${companyName}${input.siret ? " (SIRET " + input.siret + ")" : ""}`,
          details,
          leadId: ref,
        },
      }),
    });
  } catch {
    // non bloquant
  }

  return { ok: true, ref };
}
