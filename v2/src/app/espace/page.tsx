import { redirect } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Receipt,
  BadgePercent,
  LogOut,
  Phone,
  MessageCircle,
  Leaf,
  Download,
  FolderOpen,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
import CouponCard from "./CouponCard";
import { signedUrl } from "@/lib/storage";

const eur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

export const metadata = {
  title: "Espace Client | Pino Espaces Verts",
};

// Lecture défensive : si une table n'existe pas encore, on renvoie une valeur par défaut
// (supabase-js renvoie { error } sans lever d'exception) → la page ne casse jamais.
async function safeCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
  ownerColumn: string,
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq(ownerColumn, userId);
  return error ? 0 : count ?? 0;
}

export default async function EspacePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Le middleware protège déjà la route ; double sécurité ici.
  if (!user) redirect("/connexion?next=/espace");

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email ||
    "Client";
  const firstName = displayName.split(/\s+/)[0];

  // Cupón (schema maestro : cupones.cliente_id -> profiles.id = auth.uid ; estados valido/usado/expire)
  let couponCode: string | null = null;
  let couponUsed = false;
  {
    const { data, error } = await supabase
      .from("cupones")
      .select("codigo_cupon, estado")
      .eq("cliente_id", user.id)
      .maybeSingle();
    if (!error && data) {
      couponCode = (data.codigo_cupon as string) ?? null;
      couponUsed = (data.estado as string) === "usado";
    }
  }

  // leads.user_id, invoices.client_id, dossiers.client_id (tous -> profiles.id = auth.uid).
  const [devisCount, facturesCount, dossiersCount] = await Promise.all([
    safeCount(supabase, "leads", "user_id", user.id),
    safeCount(supabase, "invoices", "client_id", user.id),
    safeCount(supabase, "dossiers", "client_id", user.id),
  ]);

  const kpis = [
    { label: "Devis / Demandes", value: devisCount, icon: FileText, color: "text-brand-vivid" },
    { label: "Factures", value: facturesCount, icon: Receipt, color: "text-brand-green" },
    { label: "Dossiers SAP 50 %", value: dossiersCount, icon: BadgePercent, color: "text-brand-earth" },
  ];

  // Documents du client : factures + dossiers, avec signed URL de téléchargement.
  const { data: invRows } = await supabase
    .from("invoices")
    .select("id, amount_ttc, status, document_path, created_at")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });
  const invoiceDocs = await Promise.all(
    ((invRows as {
      id: string;
      amount_ttc: number | null;
      status: string | null;
      document_path: string | null;
      created_at: string | null;
    }[]) ?? []).map(async (r) => ({
      ...r,
      url: await signedUrl(supabase, "invoices", r.document_path),
    })),
  );

  const { data: dosRows } = await supabase
    .from("dossiers")
    .select("id, title, document_path, created_at")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });
  const dossierDocs = await Promise.all(
    ((dosRows as {
      id: string;
      title: string | null;
      document_path: string | null;
      created_at: string | null;
    }[]) ?? []).map(async (r) => ({
      ...r,
      url: await signedUrl(supabase, "dossiers", r.document_path),
    })),
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-light via-brand-cream to-brand-light">
      {/* Header */}
      <header className="border-b border-brand-accent/15 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-brand-green">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-green text-white">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="font-serif text-lg font-bold">Pino Espaces Verts</span>
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl border-2 border-brand-accent/30 px-3 py-2 text-xs font-bold text-brand-charcoal transition hover:border-brand-vivid hover:bg-brand-light"
            >
              <LogOut className="h-4 w-4" />
              Se déconnecter
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        {/* Bienvenue */}
        <section>
          <h1 className="font-serif text-3xl font-bold text-brand-green">
            Bonjour {firstName} 🌿
          </h1>
          <p className="mt-1 text-sm text-brand-charcoal/70">
            Bienvenue dans votre espace sécurisé — {user.email}
          </p>
        </section>

        {/* KPIs */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-3xl border-2 border-brand-accent/15 bg-white/90 p-6 shadow-sm"
            >
              <kpi.icon className={`h-7 w-7 ${kpi.color}`} />
              <p className="mt-3 text-3xl font-black text-brand-charcoal">{kpi.value}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-charcoal/60">
                {kpi.label}
              </p>
            </div>
          ))}
        </section>

        {/* Cupón */}
        <section>
          <CouponCard code={couponCode} used={couponUsed} />
        </section>

        {/* Mes documents : factures + dossiers (téléchargement sécurisé par signed URL) */}
        <section className="rounded-3xl border-2 border-brand-accent/15 bg-white/90 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-brand-green">
            <FolderOpen className="h-5 w-5" />
            <h3 className="font-serif text-xl font-bold">Mes documents</h3>
          </div>

          <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-charcoal/60">
            Factures
          </h4>
          {invoiceDocs.length === 0 ? (
            <p className="mb-4 text-sm text-brand-charcoal/60">Aucune facture disponible.</p>
          ) : (
            <ul className="mb-5 divide-y divide-brand-accent/10">
              {invoiceDocs.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="flex items-center gap-2 text-sm text-brand-charcoal">
                    <Receipt className="h-4 w-4 text-brand-green" />
                    {d.amount_ttc != null ? eur(Number(d.amount_ttc)) : "Facture"}
                    <span className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-bold text-brand-green">
                      {d.status || "—"}
                    </span>
                  </span>
                  {d.url ? (
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg bg-brand-vivid px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-green"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Télécharger
                    </a>
                  ) : (
                    <span className="text-xs text-brand-charcoal/40">Document à venir</span>
                  )}
                </li>
              ))}
            </ul>
          )}

          <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-charcoal/60">
            Dossiers crédit d&apos;impôt (SAP 50 %)
          </h4>
          {dossierDocs.length === 0 ? (
            <p className="text-sm text-brand-charcoal/60">Aucun dossier disponible.</p>
          ) : (
            <ul className="divide-y divide-brand-accent/10">
              {dossierDocs.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="flex items-center gap-2 text-sm text-brand-charcoal">
                    <FileText className="h-4 w-4 text-brand-earth" />
                    {d.title || "Dossier"}
                  </span>
                  {d.url ? (
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg bg-brand-vivid px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-green"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Télécharger
                    </a>
                  ) : (
                    <span className="text-xs text-brand-charcoal/40">Document à venir</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Contact direct */}
        <section className="rounded-3xl border-2 border-brand-accent/15 bg-white/90 p-6 shadow-sm">
          <h3 className="font-serif text-xl font-bold text-brand-green">Contacter Andrés Pino</h3>
          <p className="mt-1 text-sm text-brand-charcoal/70">
            Une question sur un devis ou un chantier ? Écrivez-nous directement.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <a
              href="https://wa.me/33651594034"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-vivid px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-green"
            >
              <MessageCircle className="h-5 w-5" />
              WhatsApp
            </a>
            <a
              href="tel:+33651594034"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-brand-accent/30 px-4 py-3 text-sm font-bold text-brand-charcoal transition hover:border-brand-vivid hover:bg-brand-light"
            >
              <Phone className="h-5 w-5" />
              06 51 59 40 34
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
