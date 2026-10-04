import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users,
  FileText,
  Receipt,
  Euro,
  LogOut,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../espace/actions";
import LeadStatusSelect from "./LeadStatusSelect";
import InvoiceStatusControl from "./InvoiceStatusControl";

export const metadata = {
  title: "Administration | Pino Espaces Verts",
};

type LeadRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  commune: string | null;
  garden_description: string | null;
  promo_code: string | null;
  status: string | null;
  created_at: string | null;
};

type InvoiceRow = {
  id: string;
  client_display: string | null;
  amount_ttc: number | null;
  status: string | null;
  created_at: string | null;
};

async function safeCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  return error ? 0 : count ?? 0;
}

const eur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion?next=/admin");

  // Rôle admin UNIQUEMENT via app_metadata.role (jamais user_metadata) — AGENTS.md.
  const isAdmin = (user.app_metadata?.role as string | undefined) === "admin";

  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-light via-brand-cream to-brand-light px-4">
        <div className="max-w-md rounded-3xl border-2 border-red-300 bg-white/90 p-8 text-center shadow-xl">
          <ShieldAlert className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 font-serif text-2xl font-bold text-brand-green">Accès refusé</h1>
          <p className="mt-2 text-sm text-brand-charcoal/70">
            Cet espace est réservé aux administrateurs de Pino Espaces Verts.
          </p>
          <Link
            href="/espace"
            className="mt-6 inline-block rounded-xl bg-brand-vivid px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-green"
          >
            Retour à mon espace
          </Link>
        </div>
      </main>
    );
  }

  // KPIs globaux + données (lecture défensive : 0 / vide si table absente).
  const [leadsCount, invoicesCount, clientsCount] = await Promise.all([
    safeCount(supabase, "leads"),
    safeCount(supabase, "invoices"),
    safeCount(supabase, "profiles"),
  ]);

  let totalAmount = 0;
  {
    const { data } = await supabase.from("invoices").select("amount_ttc");
    if (data) {
      totalAmount = data.reduce(
        (sum: number, r: { amount_ttc: number | null }) => sum + (Number(r.amount_ttc) || 0),
        0,
      );
    }
  }

  const { data: leadsData } = await supabase
    .from("leads")
    .select("id, full_name, phone, commune, garden_description, promo_code, status, created_at")
    .order("created_at", { ascending: false })
    .limit(25);
  const leads: LeadRow[] = (leadsData as LeadRow[]) ?? [];

  const { data: invoicesData } = await supabase
    .from("invoices")
    .select("id, client_display, amount_ttc, status, created_at")
    .order("created_at", { ascending: false })
    .limit(25);
  const invoices: InvoiceRow[] = (invoicesData as InvoiceRow[]) ?? [];

  const kpis = [
    { label: "Devis / Leads", value: String(leadsCount), icon: FileText, color: "text-brand-vivid" },
    { label: "Factures", value: String(invoicesCount), icon: Receipt, color: "text-brand-green" },
    { label: "Clients", value: String(clientsCount), icon: Users, color: "text-brand-earth" },
    { label: "Montant facturé", value: eur(totalAmount), icon: Euro, color: "text-brand-green" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-light via-brand-cream to-brand-light">
      <header className="border-b border-brand-accent/15 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-2 text-brand-green">
            <span className="rounded-lg bg-brand-green px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white">
              Admin
            </span>
            <span className="font-serif text-lg font-bold">Pino Espaces Verts</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-xl border-2 border-brand-accent/30 px-3 py-2 text-xs font-bold text-brand-charcoal transition hover:border-brand-vivid hover:bg-brand-light"
            >
              <ArrowLeft className="h-4 w-4" />
              Site
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl border-2 border-brand-accent/30 px-3 py-2 text-xs font-bold text-brand-charcoal transition hover:border-brand-vivid hover:bg-brand-light"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-brand-green">Tableau de bord</h1>

        {/* KPIs */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-3xl border-2 border-brand-accent/15 bg-white/90 p-5 shadow-sm"
            >
              <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
              <p className="mt-3 text-2xl font-black text-brand-charcoal">{kpi.value}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-charcoal/60">
                {kpi.label}
              </p>
            </div>
          ))}
        </section>

        {/* Leads */}
        <section className="rounded-3xl border-2 border-brand-accent/15 bg-white/90 p-6 shadow-sm">
          <h2 className="mb-4 font-serif text-xl font-bold text-brand-green">
            Demandes de devis / Leads
          </h2>
          {leads.length === 0 ? (
            <p className="py-6 text-center text-sm text-brand-charcoal/60">
              Aucune demande pour le moment.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-brand-accent/20 text-xs uppercase tracking-wide text-brand-charcoal/60">
                    <th className="py-2 pr-4">Client</th>
                    <th className="py-2 pr-4">Téléphone</th>
                    <th className="py-2 pr-4">Commune</th>
                    <th className="py-2 pr-4">Besoin</th>
                    <th className="py-2 pr-4">Code</th>
                    <th className="py-2">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => (
                    <tr key={l.id} className="border-b border-brand-accent/10 align-top">
                      <td className="py-2 pr-4 font-semibold text-brand-charcoal">
                        {l.full_name || "—"}
                      </td>
                      <td className="py-2 pr-4 text-brand-charcoal/80">{l.phone || "—"}</td>
                      <td className="py-2 pr-4 text-brand-charcoal/80">{l.commune || "—"}</td>
                      <td className="max-w-[16rem] py-2 pr-4 text-brand-charcoal/70">
                        {l.garden_description || "—"}
                      </td>
                      <td className="py-2 pr-4 font-mono text-xs text-brand-vivid">
                        {l.promo_code || "—"}
                      </td>
                      <td className="py-2">
                        <LeadStatusSelect leadId={l.id} current={l.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Factures */}
        <section className="rounded-3xl border-2 border-brand-accent/15 bg-white/90 p-6 shadow-sm">
          <h2 className="mb-4 font-serif text-xl font-bold text-brand-green">
            Factures &amp; Dossiers SAP
          </h2>
          {invoices.length === 0 ? (
            <p className="py-6 text-center text-sm text-brand-charcoal/60">
              Aucune facture pour le moment.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-brand-accent/20 text-xs uppercase tracking-wide text-brand-charcoal/60">
                    <th className="py-2 pr-4">Client</th>
                    <th className="py-2 pr-4">Montant TTC</th>
                    <th className="py-2">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-brand-accent/10">
                      <td className="py-2 pr-4 font-semibold text-brand-charcoal">
                        {inv.client_display || "—"}
                      </td>
                      <td className="py-2 pr-4 text-brand-charcoal/80">
                        {inv.amount_ttc != null ? eur(Number(inv.amount_ttc)) : "—"}
                      </td>
                      <td className="py-2">
                        <InvoiceStatusControl invoiceId={inv.id} current={inv.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
