"use client";

import React, { useState } from "react";
import { Tag, Sparkles, Check, Copy } from "lucide-react";

export function CouponSection() {
  const [copied, setCopied] = useState(false);
  const [code] = useState("PELABOLA");

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section id="coupon" className="py-16 sm:py-20 bg-white border-b border-[#8fa07e]/20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-gradient-to-br from-[#1e5138] to-[#2d4d36] rounded-3xl p-8 sm:p-12 text-white shadow-2xl overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Offer Details */}
            <div className="lg:col-span-7 space-y-4 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/15 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Offre Spéciale Nouveaux Clients</span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
                -20% Immédiats sur Votre Premier Chantier
              </h2>

              <p className="text-white/80 text-sm sm:text-base leading-relaxed max-w-xl">
                Valable sur toute prestation d&apos;entretien ou d&apos;aménagement de jardin.
                Cumulable avec les 50% de crédit d&apos;impôt immédiat via Unipros !
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-white/70">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-lime-400" /> Sans engagement
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-lime-400" /> Déductible dès le devis
                </span>
              </div>
            </div>

            {/* Right Column: Voucher Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="bg-[#fbf8f2] text-[#222820] p-6 rounded-2xl border-2 border-dashed border-[#8fa07e] w-full max-w-sm shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#1e5138] flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Bon de Réduction
                  </span>
                  <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    Actif
                  </span>
                </div>

                <div className="text-center py-2 bg-white rounded-xl border border-slate-200 shadow-inner">
                  <span className="font-mono text-2xl sm:text-3xl font-black tracking-widest text-[#1e5138]">
                    {code}
                  </span>
                  <span className="block text-[11px] text-slate-500 font-semibold mt-1">
                    Remise de 20% sur la main d&apos;œuvre
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-full bg-[#1e5138] hover:bg-[#2d4d36] text-white py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-lime-400" />
                      <span>Code copié dans le presse-papier !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copier le code promo</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-slate-500 text-center leading-normal">
                  Indiquez ce code lors de votre demande de devis ou dans votre espace client.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
