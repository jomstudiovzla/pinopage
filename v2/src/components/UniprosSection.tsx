"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ShieldCheck, Calculator, ArrowRight, Building2 } from "lucide-react";

export function UniprosSection() {
  const [amount, setAmount] = useState<number>(200);

  const clientPays = Math.round(amount * 0.5);
  const taxCredit = Math.round(amount * 0.5);

  return (
    <section id="unipros" className="py-16 sm:py-24 bg-[#f2f6ee] border-b border-[#8fa07e]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#00D2D3]/15 text-[#006f70] text-xs font-extrabold px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#00D2D3]" /> Partenaire Coopératif Déclaré SAP
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#2d4d36]">
            50% de Crédit d&apos;Impôt Immédiat avec Unipros
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Grâce à notre affiliation avec la coopérative nationale Unipros (Services à la Personne), bénéficiez
            de l&apos;Avance Immédiate URSSAF sur l&apos;ensemble de vos petits travaux de jardinage.
          </p>
        </div>

        {/* 2-column layout: Simulator + Explanation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Interactive Calculator */}
          <div className="lg:col-span-6 bg-white p-7 sm:p-9 rounded-3xl shadow-xl border-2 border-[#00D2D3]/30 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00D2D3]/15 flex items-center justify-center text-[#00898a]">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#2d4d36]">Simulateur Avance Immédiate</h3>
                  <p className="text-xs text-slate-500">Calcul en temps réel selon l&apos;Art. 199 sexdecies du CGI</p>
                </div>
              </div>
              <div className="relative h-8 w-24">
                <Image
                  src="/assets/logo/unipros.png"
                  alt="Unipros"
                  fill
                  sizes="96px"
                  className="object-contain"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="simulator-amount" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Montant estimé de votre prestation :
              </label>
              <div className="relative">
                <input
                  id="simulator-amount"
                  type="range"
                  min="50"
                  max="1500"
                  step="25"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1e5138]"
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 font-semibold">
                <span>50 €</span>
                <span className="text-sm font-extrabold text-[#1e5138]">{amount} €</span>
                <span>1 500 €</span>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="p-5 rounded-2xl bg-[#fafaf6] border border-[#8fa07e]/30 space-y-3">
              <div className="flex justify-between items-center text-sm text-slate-600">
                <span>Prix normal de la prestation :</span>
                <span className="font-bold text-slate-800">{amount} €</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-[#b21e96]">
                <span className="flex items-center gap-1.5">
                  <span>Avance immédiate 50% de l&apos;État :</span>
                </span>
                <span>- {taxCredit} €</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="font-serif text-lg font-bold text-[#2d4d36]">Vous ne payez que :</span>
                <span className="text-3xl font-extrabold text-[#1e5138]">{clientPays} €</span>
              </div>
              <p className="text-[11px] text-slate-500 italic pt-1">
                * Sous réserve du plafond légal annuel de 5 000 € TTC par foyer fiscal pour les petits travaux de jardinage.
              </p>
            </div>

            <a
              href="#devis"
              className="w-full bg-[#1e5138] hover:bg-[#2d4d36] text-white py-3.5 px-6 rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Demander un devis avec avantage 50%</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Explanation & Steps */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-white border border-[#8fa07e]/30 text-[#1e5138] flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-[#2d4d36] text-base">Devis & Prestation Réalisée</h4>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    Andrés Pino réalise vos travaux de jardinage au tarif convenu. Aucune mauvaise surprise.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-white border border-[#8fa07e]/30 text-[#1e5138] flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-[#2d4d36] text-base">Transmission Automatique à l&apos;URSSAF</h4>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    La coopérative Unipros transmet la demande d&apos;Avance Immédiate directement à l&apos;administration fiscale.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-white border border-[#8fa07e]/30 text-[#1e5138] flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-[#2d4d36] text-base">Vous Ne Payez Que 50%</h4>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    L&apos;URSSAF valide le dossier et vous n&apos;êtes prélevé que du solde restant. Pas d&apos;attente jusqu&apos;à l&apos;année prochaine !
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-white border border-[#8fa07e]/30 text-[#1e5138] flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                  4
                </div>
                <div>
                  <h4 className="font-bold text-[#2d4d36] text-base">Attestation Fiscale Case 7DB</h4>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    Votre attestation fiscale annuelle officielle vous est automatiquement remise pour votre déclaration d&apos;impôts.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#8fa07e]/20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-[#1e5138] shrink-0" />
                <span className="text-xs text-slate-700 font-medium">
                  En savoir plus sur la coopérative Unipros et le dispositif SAP :
                </span>
              </div>
              <a
                href="https://unipros.coop"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-[#1e5138] hover:underline shrink-0"
              >
                unipros.coop ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
