import React from "react";
import Image from "next/image";
import { TreePine, CalendarCheck, MessageSquare, Zap, Percent, ShieldCheck, CheckCircle2 } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-[#f2f6ee] via-[#faf8f2] to-[#eaf2e6] overflow-hidden py-14 lg:py-20 border-b border-[#8fa07e]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Column: Headlines & Pitch */}
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-[#1e5138]/10 border border-[#1e5138]/20 px-3.5 py-1.5 rounded-full text-[#1e5138] text-xs font-bold uppercase tracking-wider">
            <TreePine className="w-3.5 h-3.5" />
            <span>Artisan Paysagiste — Entretien & Création de Jardins</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#2d4d36] leading-[1.15]">
            Pino Espaces Verts
            <span className="text-[#1e5138] font-sans text-2xl sm:text-3xl lg:text-4xl block mt-2 font-bold">
              Entretien Soigné & Création Paysagère
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#222820]/90 font-medium max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            Pour les particuliers comme les professionnels, nous prenons soin de vos jardins avec rigueur,
            passion et savoir-faire artisanal. Profitez de prestations soignées et déductibles à 50% d&apos;impôt.
          </p>

          {/* Unipros Official Box (Avance Immédiate 50%) */}
          <div className="relative p-5 sm:p-6 rounded-3xl shadow-xl border-2 border-[#00D2D3] bg-gradient-to-br from-white via-[#f0fbfb] to-[#fdf2f8] overflow-hidden text-left">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#D926B8] via-[#00D2D3] to-[#00E676]" />

            <div className="flex flex-col sm:flex-row items-center gap-5 pt-1">
              <a
                href="#unipros"
                title="Découvrir l'Avance Immédiate avec Unipros"
                className="shrink-0 bg-white p-3 rounded-2xl border-2 border-[#00D2D3]/40 shadow-md hover:border-[#D926B8] hover:scale-105 transition-all duration-300 flex flex-col items-center group cursor-pointer"
              >
                <div className="relative h-12 sm:h-14 w-32">
                  <Image
                    src="/assets/logo/unipros.png"
                    alt="Logo Coopérative Unipros SAP"
                    fill
                    sizes="128px"
                    className="object-contain"
                  />
                </div>
                <span className="text-[10px] font-extrabold text-[#1F3A8A] uppercase tracking-wider mt-1.5 flex items-center gap-1 group-hover:text-[#D926B8] transition-colors">
                  <span>Calculer le prix</span> →
                </span>
              </a>

              <div className="space-y-1.5 text-center sm:text-left flex-1">
                <div className="inline-flex items-center gap-1.5 bg-[#D926B8]/15 text-[#b21e96] font-extrabold text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" /> Coopérative déclarée Services à la Personne (SAP)
                </div>
                <h2 className="font-extrabold text-base sm:text-lg text-[#1F3A8A] leading-snug">
                  Bénéficiez de 50% de crédit d&apos;impôt immédiat avec Unipros !
                </h2>
                <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                  Grâce à l&apos;Avance Immédiate de l&apos;URSSAF, vous ne réglez que la moitié du montant de votre facture. Pas d&apos;avance de trésorerie !
                </p>
              </div>
            </div>

            {/* Accepted payment methods */}
            <div className="mt-4 pt-3.5 border-t border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-extrabold text-[#1F3A8A] uppercase tracking-wider">
                  Règlements SAP traçables (Art. 199 sexdecies du CGI) :
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-xs font-bold text-slate-800">
                  <CheckCircle2 className="w-3 h-3 text-blue-600" /> Chèque bancaire
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-xs font-bold text-slate-800">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Virement bancaire
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-xs font-bold text-slate-800">
                  <CheckCircle2 className="w-3 h-3 text-amber-600" /> Chèques CESU / e-CESU
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-xs font-bold text-slate-800">
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Prélèvement URSSAF
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
            <a
              href="#devis"
              className="bg-[#1e5138] hover:bg-[#2d4d36] text-white text-base font-bold px-8 py-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              <CalendarCheck className="w-5 h-5" />
              <span>Demander mon Devis Gratuit</span>
            </a>
            <a
              href="https://wa.me/33651594034"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-[#f2f6f0] text-[#2d4d36] border-2 border-[#8fa07e]/40 text-base font-bold px-8 py-4 rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <span>WhatsApp Andrés Pino</span>
            </a>
          </div>

          {/* Trust Guarantees */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2 text-xs text-[#222820]/80">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-900">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" /> Réponse sous 24h
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-emerald-900">
              <Percent className="w-4 h-4 text-emerald-600" /> 50% Avance Immédiate URSSAF
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> Devis gratuit & sans engagement
            </span>
          </div>
        </div>

        {/* Right Column: Visual Card */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="relative bg-white p-6 rounded-3xl shadow-2xl border border-[#8fa07e]/20 max-w-sm w-full transform hover:scale-[1.02] transition-transform duration-300">
            <div className="aspect-square bg-[#f2f6f0] rounded-2xl flex items-center justify-center overflow-hidden mb-6 p-4 relative">
              <Image
                src="/assets/logo/Logo completo.png"
                alt="Logo Complet Pino Espaces Verts"
                fill
                sizes="(max-w-768px) 100vw, 360px"
                className="object-contain p-4"
                priority
              />
            </div>
            <div className="space-y-1.5 text-center">
              <h2 className="font-serif text-2xl font-semibold text-[#2d4d36]">Pino Espaces Verts</h2>
              <p className="text-sm text-[#7b956c] font-medium">Jardinage & Aménagement Paysager</p>
              <div className="pt-2 text-xs text-slate-500 font-medium">
                Particuliers & Copropriétés • SIRET 105 075 006 00012
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
