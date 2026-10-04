"use client";

import { useRef, useState, useTransition } from "react";
import { Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { uploadInvoice } from "./upload-actions";

type Client = { id: string; full_name: string | null; email: string | null };

export default function InvoiceUpload({ clients }: { clients: Client[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setMsg(null);
    startTransition(async () => {
      const res = await uploadInvoice(fd);
      if (res.ok) {
        setMsg({ ok: true, text: "Facture téléversée et enregistrée." });
        form.reset();
      } else {
        setMsg({ ok: false, text: "Échec : " + (res.error || "erreur") });
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
    >
      <label className="flex flex-col gap-1 text-xs font-semibold text-brand-charcoal/70">
        Client
        <select
          name="clientId"
          required
          className="rounded-lg border-2 border-brand-accent/30 bg-white px-2 py-2 text-sm text-brand-charcoal outline-none focus:border-brand-vivid"
        >
          <option value="">— Choisir —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name || c.email || c.id.slice(0, 8)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-semibold text-brand-charcoal/70">
        Montant TTC (€)
        <input
          name="amount"
          type="number"
          min="0"
          step="0.01"
          required
          className="rounded-lg border-2 border-brand-accent/30 bg-white px-2 py-2 text-sm text-brand-charcoal outline-none focus:border-brand-vivid"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-semibold text-brand-charcoal/70">
        Rail
        <select
          name="rail"
          defaultValue="direct"
          className="rounded-lg border-2 border-brand-accent/30 bg-white px-2 py-2 text-sm text-brand-charcoal outline-none focus:border-brand-vivid"
        >
          <option value="direct">Direct</option>
          <option value="unipros">Unipros (SAP 50 %)</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-semibold text-brand-charcoal/70">
        Fichier (PDF)
        <input
          name="file"
          type="file"
          accept="application/pdf,image/*"
          required
          className="rounded-lg border-2 border-brand-accent/30 bg-white px-2 py-1.5 text-xs text-brand-charcoal outline-none file:mr-2 file:rounded file:border-0 file:bg-brand-light file:px-2 file:py-1 file:text-xs file:font-bold file:text-brand-green focus:border-brand-vivid"
        />
      </label>

      <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 rounded-xl bg-brand-vivid px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-green disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Téléverser la facture
        </button>
        {msg && (
          <span
            className={`flex items-center gap-1.5 text-sm ${
              msg.ok ? "text-brand-green" : "text-red-600"
            }`}
          >
            {msg.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {msg.text}
          </span>
        )}
      </div>
    </form>
  );
}
