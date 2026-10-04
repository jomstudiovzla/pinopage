"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { Upload, Loader2, Trash2, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import {
  uploadPortfolioItem,
  togglePortfolioPublished,
  deletePortfolioItem,
} from "./portfolio-actions";

export type PortfolioItem = {
  id: string;
  title: string;
  commune: string | null;
  kind: string;
  published: boolean;
  image_path: string;
  url: string;
};

export default function PortfolioManager({ items }: { items: PortfolioItem[] }) {
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setMsg(null);
    startTransition(async () => {
      const res = await uploadPortfolioItem(fd);
      if (res.ok) {
        setMsg({ ok: true, text: "Photo ajoutée au portfolio." });
        form.reset();
      } else {
        setMsg({
          ok: false,
          text:
            res.error === "file_too_large"
              ? "Fichier trop volumineux (max 15 Mo)."
              : "Échec : " + (res.error || "erreur"),
        });
      }
    });
  }

  function onToggle(id: string, next: boolean) {
    setBusyId(id);
    startTransition(async () => {
      await togglePortfolioPublished(id, next);
      setBusyId(null);
    });
  }

  function onDelete(id: string, path: string) {
    setBusyId(id);
    startTransition(async () => {
      await deletePortfolioItem(id, path);
      setBusyId(null);
    });
  }

  const field =
    "rounded-lg border-2 border-brand-accent/30 bg-white px-2 py-2 text-sm text-brand-charcoal outline-none focus:border-brand-vivid";

  return (
    <div className="space-y-5">
      {/* Formulaire d'ajout */}
      <form
        onSubmit={onUpload}
        className="grid grid-cols-1 gap-3 rounded-2xl border border-brand-accent/20 bg-brand-light/40 p-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
      >
        <label className="flex flex-col gap-1 text-xs font-semibold text-brand-charcoal/70">
          Titre
          <input name="title" type="text" required placeholder="Taille de haies" className={field} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-brand-charcoal/70">
          Commune
          <input name="commune" type="text" placeholder="Vaucluse (84)" className={field} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-brand-charcoal/70">
          Type
          <select name="kind" defaultValue="real_work" className={field}>
            <option value="real_work">Chantier réel</option>
            <option value="marketing">Marketing</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-brand-charcoal/70">
          Photo
          <input
            name="file"
            type="file"
            accept="image/*"
            required
            className="rounded-lg border-2 border-brand-accent/30 bg-white px-2 py-1.5 text-xs text-brand-charcoal outline-none file:mr-2 file:rounded file:border-0 file:bg-brand-light file:px-2 file:py-1 file:text-xs file:font-bold file:text-brand-green focus:border-brand-vivid"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-vivid px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-green disabled:opacity-60"
        >
          {pending && !busyId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Ajouter
        </button>
        {msg && (
          <span
            className={`sm:col-span-2 lg:col-span-5 flex items-center gap-1.5 text-sm ${
              msg.ok ? "text-brand-green" : "text-red-600"
            }`}
          >
            {msg.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {msg.text}
          </span>
        )}
      </form>

      {/* Grille */}
      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-brand-charcoal/60">
          Aucune photo pour le moment.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((it) => (
            <div
              key={it.id}
              className="overflow-hidden rounded-2xl border-2 border-brand-accent/15 bg-white shadow-sm"
            >
              <div className="relative aspect-[4/3] bg-brand-light">
                <Image
                  src={it.url}
                  alt={it.title}
                  fill
                  sizes="(max-width:768px) 50vw, 25vw"
                  className="object-cover"
                  unoptimized
                />
                {!it.published && (
                  <span className="absolute left-2 top-2 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-white">
                    Brouillon
                  </span>
                )}
              </div>
              <div className="space-y-2 p-3">
                <p className="truncate text-sm font-bold text-brand-charcoal">{it.title}</p>
                <p className="truncate text-xs text-brand-charcoal/60">{it.commune || "—"}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onToggle(it.id, !it.published)}
                    disabled={busyId === it.id}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg border-2 border-brand-accent/30 py-1.5 text-xs font-bold text-brand-green transition hover:border-brand-vivid disabled:opacity-50"
                  >
                    {it.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {it.published ? "Masquer" : "Publier"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(it.id, it.image_path)}
                    disabled={busyId === it.id}
                    className="flex items-center justify-center rounded-lg border-2 border-red-200 px-2 py-1.5 text-red-600 transition hover:border-red-400 hover:bg-red-50 disabled:opacity-50"
                    aria-label="Supprimer"
                  >
                    {busyId === it.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
