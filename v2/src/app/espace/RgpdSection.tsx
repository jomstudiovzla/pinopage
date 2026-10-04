"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, ShieldCheck, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { deleteMyAccount } from "./rgpd-actions";

export default function RgpdSection() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onDelete() {
    setError(null);
    startTransition(async () => {
      const res = await deleteMyAccount();
      if (res.ok) {
        router.push("/connexion?deleted=1");
        router.refresh();
      } else {
        setError(
          "La suppression n'a pas pu aboutir. Réessayez, ou contactez-nous. (" +
            (res.error || "erreur") +
            ")",
        );
      }
    });
  }

  return (
    <section className="rounded-3xl border-2 border-brand-accent/15 bg-white/90 p-6 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-brand-green">
        <ShieldCheck className="h-5 w-5" />
        <h3 className="font-serif text-xl font-bold">Vos données (RGPD)</h3>
      </div>
      <p className="mb-4 text-sm text-brand-charcoal/70">
        Vous contrôlez vos données personnelles conformément au RGPD.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href="/espace/export"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-brand-accent/30 px-4 py-3 text-sm font-bold text-brand-charcoal transition hover:border-brand-vivid hover:bg-brand-light"
        >
          <Download className="h-5 w-5 text-brand-green" />
          Exporter mes données (JSON)
        </a>
        <button
          type="button"
          onClick={() => {
            setConfirming((v) => !v);
            setError(null);
          }}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-red-200 px-4 py-3 text-sm font-bold text-red-600 transition hover:border-red-400 hover:bg-red-50"
        >
          <Trash2 className="h-5 w-5" />
          Supprimer mon compte
        </button>
      </div>

      {confirming && (
        <div className="mt-4 rounded-2xl border-2 border-red-200 bg-red-50/60 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <p className="text-sm text-red-800">
              Votre compte et vos données de contact seront effacés. Les factures déjà émises sont
              conservées de façon anonymisée pendant 10 ans (obligation légale). Cette action est
              irréversible.
            </p>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-red-800">
            <input
              type="checkbox"
              checked={understood}
              onChange={(e) => setUnderstood(e.target.checked)}
              className="h-4 w-4 accent-red-600"
            />
            J&apos;ai compris et je confirme la suppression.
          </label>
          <button
            type="button"
            onClick={onDelete}
            disabled={!understood || pending}
            className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Supprimer définitivement
          </button>
          {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        </div>
      )}
    </section>
  );
}
