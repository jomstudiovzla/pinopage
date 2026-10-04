"use client";

import { useState } from "react";
import { Copy, Check, Ticket } from "lucide-react";

export default function CouponCard({ code, used }: { code: string | null; used: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponible : l'utilisateur peut sélectionner le code manuellement */
    }
  }

  return (
    <div className="rounded-3xl border-2 border-brand-vivid/30 bg-gradient-to-br from-brand-light to-white p-6 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-brand-green">
        <Ticket className="h-5 w-5" />
        <h3 className="font-serif text-xl font-bold">Votre remise de bienvenue</h3>
      </div>

      {code ? (
        <>
          <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-brand-vivid/40 bg-white px-4 py-3">
            <span className="select-all font-mono text-2xl font-black tracking-widest text-brand-green">
              {code}
            </span>
            <button
              type="button"
              onClick={copy}
              className="flex items-center gap-1.5 rounded-xl bg-brand-vivid px-3 py-2 text-xs font-bold text-white transition hover:bg-brand-green"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copié" : "Copier le code"}
            </button>
          </div>
          <p className="mt-3 text-xs text-brand-charcoal/70">
            {used
              ? "Ce code a déjà été utilisé. Merci de votre confiance !"
              : "Code unique -20 %, valable une seule fois. Appliqué automatiquement sur votre prochain devis."}
          </p>
        </>
      ) : (
        <p className="text-sm text-brand-charcoal/70">
          Votre code -20 % apparaîtra ici dès l&apos;activation de votre compte.
        </p>
      )}
    </div>
  );
}
