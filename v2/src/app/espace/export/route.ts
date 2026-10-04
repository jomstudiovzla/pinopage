import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Export RGPD (Art. 20 — portabilité) : renvoie en JSON téléchargeable toutes
 * les données personnelles du client connecté (profil, leads, factures, dossiers,
 * coupon). La RLS garantit qu'on ne lit que les lignes de l'utilisateur.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const { origin } = new URL(request.url);
    return NextResponse.redirect(`${origin}/connexion?next=/espace`);
  }

  const [profile, leads, invoices, dossiers, coupons] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("leads").select("*").eq("user_id", user.id),
    supabase.from("invoices").select("*").eq("client_id", user.id),
    supabase.from("dossiers").select("*").eq("client_id", user.id),
    supabase.from("cupones").select("*").eq("cliente_id", user.id),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    rgpd: "Export de vos données personnelles — Pino Espaces Verts (Art. 20 RGPD)",
    account: { id: user.id, email: user.email },
    profile: profile.data ?? null,
    leads: leads.data ?? [],
    invoices: invoices.data ?? [],
    dossiers: dossiers.data ?? [],
    coupons: coupons.data ?? [],
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="mes-donnees-pino-${user.id.slice(0, 8)}.json"`,
      "cache-control": "no-store",
    },
  });
}
