"use client";

import { useState } from "react";
import { Calculator, Info } from "lucide-react";

type Mode = "unipros" | "declaration";

const PLAFOND = 5000; // € de dépense/an éligible (petits travaux de jardinage)
const TAUX = 0.5;

const eur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export default function FiscalCalculator() {
  const [budget, setBudget] = useState<number>(600);
  const [mode, setMode] = useState<Mode>("unipros");

  const base = Math.max(0, Number(budget) || 0);
  const eligible = Math.min(base, PLAFOND);
  const credit = Math.round(eligible * TAUX); // avantage fiscal (plafonné à 2 500 €)
  const overCap = base > PLAFOND;

  // Unipros (avance immédiate) : on ne paie que le reste (50 %) tout de suite.
  // Déclaration annuelle : on paie 100 % puis on récupère le crédit l'année suivante.
  const payerMaintenant = mode === "unipros" ? base - credit : base;
  const coutNet = base - credit;

  return (
    <div className="rounded-3xl border-2 border-[#1e5138]/30 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-4 flex items-center gap-2 text-[#2d4d36]">
        <Calculator className="h-5 w-5" />
        <h2 className="font-serif text-xl font-bold">Simulateur de crédit d&apos;impôt</h2>
      </div>

      <label className="block text-xs font-semibold text-slate-600">
        Budget estimé des travaux (€ TTC)
        <input
          type="number"
          min="0"
          step="50"
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="mt-1 w-full rounded-xl border-2 border-[#8fa07e]/40 bg-white px-3 py-2.5 text-lg font-bold text-[#2d4d36] outline-none focus:border-[#1e5138]"
        />
      </label>

      {/* Sélecteur de mode */}
      <div className="mt-4 inline-flex w-full rounded-xl border-2 border-[#8fa07e]/30 bg-[#f2f6ee] p-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => setMode("unipros")}
          className={`flex-1 rounded-lg px-3 py-2 transition ${
            mode === "unipros" ? "bg-[#1e5138] text-white" : "text-slate-600"
          }`}
        >
          Avance immédiate Unipros
        </button>
        <button
          type="button"
          onClick={() => setMode("declaration")}
          className={`flex-1 rounded-lg px-3 py-2 transition ${
            mode === "declaration" ? "bg-[#1e5138] text-white" : "text-slate-600"
          }`}
        >
          Déclaration annuelle (7DB)
        </button>
      </div>

      {/* Résultats */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#8fa07e]/20 bg-[#f2f6ee] p-4 text-center">
          <p className="text-xs font-semibold uppercase text-slate-500">Crédit d&apos;impôt (50 %)</p>
          <p className="mt-1 text-2xl font-black text-[#1e5138]">{eur(credit)}</p>
        </div>
        <div className="rounded-2xl border border-[#8fa07e]/20 bg-white p-4 text-center">
          <p className="text-xs font-semibold uppercase text-slate-500">
            {mode === "unipros" ? "À payer maintenant" : "À avancer maintenant"}
          </p>
          <p className="mt-1 text-2xl font-black text-[#2d4d36]">{eur(payerMaintenant)}</p>
        </div>
        <div className="rounded-2xl border border-[#8fa07e]/20 bg-white p-4 text-center">
          <p className="text-xs font-semibold uppercase text-slate-500">Coût net final</p>
          <p className="mt-1 text-2xl font-black text-[#2d4d36]">{eur(coutNet)}</p>
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-700">
        {mode === "unipros"
          ? "Avec l'avance immédiate Unipros, vous ne réglez que votre reste à charge (50 %). Le crédit d'impôt est déduit directement, sans attendre la déclaration."
          : "En déclaration annuelle, vous payez la totalité puis récupérez le crédit d'impôt l'année suivante via la case 7DB de votre déclaration de revenus."}
      </p>

      {overCap && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          Plafond de dépense atteint : le crédit d&apos;impôt est calculé sur 5 000 € maximum par an
          et par foyer fiscal (avantage maximal : 2 500 €). La part au-delà reste à votre charge.
        </p>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
        Simulation non contractuelle, à titre indicatif (Art. 199 sexdecies du CGI). Le montant réel
        dépend de votre situation fiscale. Plafond de 5 000 €/an pour les petits travaux de jardinage.
      </p>
    </div>
  );
}
