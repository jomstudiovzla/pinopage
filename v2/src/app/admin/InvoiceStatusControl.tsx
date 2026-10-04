"use client";

import { useState, useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import { updateInvoiceStatus } from "./actions";

const LABEL: Record<string, string> = {
  draft: "Brouillon",
  issued: "Émise",
  pending: "En attente",
  paid: "Payée",
  cancelled: "Annulée",
  anonymized: "Anonymisée",
};

export default function InvoiceStatusControl({
  invoiceId,
  current,
}: {
  invoiceId: string;
  current: string | null;
}) {
  const [status, setStatus] = useState(current ?? "draft");
  const [pending, startTransition] = useTransition();

  function markPaid() {
    const prev = status;
    setStatus("paid");
    startTransition(async () => {
      const res = await updateInvoiceStatus(invoiceId, "paid");
      if (!res.ok) setStatus(prev);
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-bold text-brand-green">
        {LABEL[status] || status}
      </span>
      {status !== "paid" && (
        <button
          type="button"
          onClick={markPaid}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-lg bg-brand-vivid px-2 py-1 text-xs font-bold text-white transition hover:bg-brand-green disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Payée
        </button>
      )}
    </span>
  );
}
