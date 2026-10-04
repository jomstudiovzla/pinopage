"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { updateLeadStatus } from "./actions";

const OPTIONS: { value: string; label: string }[] = [
  { value: "new", label: "Nouveau" },
  { value: "contacted", label: "Contacté" },
  { value: "quoted", label: "Devis envoyé" },
  { value: "won", label: "Gagné" },
  { value: "lost", label: "Perdu" },
];

export default function LeadStatusSelect({
  leadId,
  current,
}: {
  leadId: string;
  current: string | null;
}) {
  const [value, setValue] = useState(current ?? "new");
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState(false);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    const prev = value;
    setValue(next);
    setErr(false);
    startTransition(async () => {
      const res = await updateLeadStatus(leadId, next);
      if (!res.ok) {
        setValue(prev); // rollback optimiste
        setErr(true);
      }
    });
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <select
        value={value}
        onChange={onChange}
        disabled={pending}
        className={`rounded-lg border-2 bg-white px-2 py-1 text-xs font-bold text-brand-green outline-none transition ${
          err ? "border-red-300" : "border-brand-accent/30 focus:border-brand-vivid"
        } disabled:opacity-60`}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-vivid" />}
    </span>
  );
}
