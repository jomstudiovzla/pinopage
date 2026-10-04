"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  ArrowLeft,
} from "lucide-react";
import { submitB2B } from "@/app/actions/b2b";

export default function ProPage() {
  const [form, setForm] = useState({
    companyName: "",
    siret: "",
    contactName: "",
    email: "",
    phone: "",
    commune: "",
    surface: "",
    frequency: "ponctuel",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.companyName || !form.contactName || !form.email || !form.phone) {
      setError("Veuillez renseigner l'entreprise, le contact, l'e-mail et le téléphone.");
      return;
    }
    setLoading(true);
    try {
      const res = await submitB2B(form);
      if (!res.ok) {
        setError("Un problème est survenu. Réessayez ou contactez-nous au 06 51 59 40 34.");
        return;
      }
      setReference(res.ref ?? null);
      setSuccess(true);
    } catch {
      setError("Un problème réseau est survenu. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  const field =
    "w-full rounded-xl border-2 border-brand-accent/30 bg-white px-3 py-2.5 text-sm text-brand-charcoal outline-none focus:border-brand-vivid";

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-light via-brand-cream to-brand-light px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="text-center">
          <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-green text-white shadow-md">
            <Building2 className="h-7 w-7" />
          </span>
          <h1 className="font-serif text-3xl font-extrabold text-brand-green sm:text-4xl">
            Espace Pro / Copropriétés
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-brand-charcoal/70">
            Syndics, entreprises et copropriétés : demandez un devis d&apos;entretien
            d&apos;espaces verts adapté à vos besoins.
          </p>
        </div>

        {/* Mention légale obligatoire */}
        <div className="flex items-start gap-2 rounded-2xl border-2 border-amber-300 bg-amber-50/70 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm font-semibold text-amber-900">
            Les prestations effectuées pour le compte d&apos;entreprises ou de copropriétés ne sont
            pas éligibles au crédit d&apos;impôt Service à la Personne (SAP) de 50 %.
          </p>
        </div>

        {success ? (
          <div className="space-y-4 rounded-3xl border-2 border-brand-vivid bg-white p-8 text-center shadow-xl">
            <CheckCircle2 className="mx-auto h-14 w-14 text-brand-vivid" />
            <h2 className="font-serif text-2xl font-bold text-brand-green">Demande transmise !</h2>
            <p className="text-sm text-brand-charcoal/70">
              Merci <strong>{form.contactName}</strong>. Andrés Pino étudie votre demande pour{" "}
              <strong>{form.companyName}</strong> et revient vers vous sous 48 h ouvrées.
            </p>
            {reference && (
              <p className="text-sm text-brand-charcoal/60">
                Référence : <span className="font-mono font-bold text-brand-vivid">{reference}</span>
              </p>
            )}
            <Link href="/" className="inline-block text-sm font-bold text-brand-vivid hover:underline">
              ← Retour au site
            </Link>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="space-y-4 rounded-3xl border-2 border-brand-accent/30 bg-white p-6 shadow-xl sm:p-8"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-brand-charcoal/70">
                Entreprise / Copropriété *
                <input value={form.companyName} onChange={set("companyName")} required className={field} />
              </label>
              <label className="text-xs font-semibold text-brand-charcoal/70">
                SIRET
                <input value={form.siret} onChange={set("siret")} placeholder="123 456 789 00012" className={field} />
              </label>
              <label className="text-xs font-semibold text-brand-charcoal/70">
                Nom du contact *
                <input value={form.contactName} onChange={set("contactName")} required className={field} />
              </label>
              <label className="text-xs font-semibold text-brand-charcoal/70">
                E-mail *
                <input type="email" value={form.email} onChange={set("email")} required className={field} />
              </label>
              <label className="text-xs font-semibold text-brand-charcoal/70">
                Téléphone *
                <input value={form.phone} onChange={set("phone")} required className={field} />
              </label>
              <label className="text-xs font-semibold text-brand-charcoal/70">
                Commune
                <input value={form.commune} onChange={set("commune")} className={field} />
              </label>
              <label className="text-xs font-semibold text-brand-charcoal/70">
                Surface approximative (m²)
                <input type="number" min="0" value={form.surface} onChange={set("surface")} className={field} />
              </label>
              <label className="text-xs font-semibold text-brand-charcoal/70">
                Fréquence d&apos;entretien
                <select value={form.frequency} onChange={set("frequency")} className={field}>
                  <option value="ponctuel">Ponctuel</option>
                  <option value="hebdomadaire">Hebdomadaire</option>
                  <option value="mensuel">Mensuel</option>
                  <option value="annuel">Annuel</option>
                </select>
              </label>
            </div>

            {error && (
              <p className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-vivid px-4 py-3 font-bold text-white shadow-md transition hover:bg-brand-green disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              Envoyer ma demande
            </button>
          </form>
        )}

        <p className="text-center">
          <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-vivid hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> Retour au site
          </Link>
        </p>
      </div>
    </main>
  );
}
