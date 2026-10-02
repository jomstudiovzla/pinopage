"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Camera, ChevronLeft, ChevronRight, MapPin } from "lucide-react";

interface Pair {
  title: string;
  category: string;
  location: string;
  before: string;
  after: string;
  description: string;
}

export function GalerieSection() {
  const pairs: Pair[] = [
    {
      title: "Remise en état complète de jardin",
      category: "Débroussaillage & Tonte",
      location: "Entraigues-sur-la-Sorgue",
      before: "/assets/images/before_after_avant_real.jpg",
      after: "/assets/images/before_after_apres_real.jpg",
      description: "Fauchage des herbes hautes, taille d'arbustes et évacuation de 4m³ de déchets verts.",
    },
    {
      title: "Taille sculptée de haie de cyprès",
      category: "Taille de Haies",
      location: "Avignon & Environs",
      before: "/assets/images/real_haie_cypres_avant.jpg",
      after: "/assets/images/real_haie_cypres_apres.jpg",
      description: "Alignement au cordeau et rabattage des pousses annuelles sur 35 mètres linéaires.",
    },
    {
      title: "Taille de cyprès en colonnes",
      category: "Taille d'Ornement",
      location: "Vaucluse",
      before: "/assets/images/real_cypres_colonnes_avant.jpg",
      after: "/assets/images/real_cypres_colonnes_apres.jpg",
      description: "Restructuration architecturale et mise en valeur des sujets adultes.",
    },
  ];

  const [activePairIndex, setActivePairIndex] = useState(0);
  const [sliderPos, setSliderPos] = useState(50);

  const current = pairs[activePairIndex];

  const handleNext = () => {
    setActivePairIndex((prev) => (prev + 1) % pairs.length);
    setSliderPos(50);
  };

  const handlePrev = () => {
    setActivePairIndex((prev) => (prev - 1 + pairs.length) % pairs.length);
    setSliderPos(50);
  };

  return (
    <section id="realisations" className="py-16 sm:py-24 bg-[#fbf8f2] border-b border-[#8fa07e]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#1e5138]/10 text-[#1e5138] text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            <Camera className="w-3.5 h-3.5" /> Nos Réalisations Réelles
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#2d4d36]">
            Avant / Après : Le Résultat en Images
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Glissez le curseur central pour apprécier la transformation de nos chantiers d&apos;entretien et d&apos;élagage.
          </p>
        </div>

        {/* Interactive Before / After Card */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-4 sm:p-7 shadow-2xl border-2 border-[#8fa07e]/20 space-y-6">
          {/* Pair selector header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#1e5138]">
                {current.category}
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#2d4d36]">{current.title}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#8fa07e]" /> {current.location}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handlePrev}
                className="w-10 h-10 rounded-full border border-[#8fa07e]/30 hover:border-[#1e5138] hover:bg-[#f2f6f0] text-[#1e5138] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Projet précédent"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-xs font-bold text-slate-600 px-2">
                {activePairIndex + 1} / {pairs.length}
              </span>
              <button
                type="button"
                onClick={handleNext}
                className="w-10 h-10 rounded-full border border-[#8fa07e]/30 hover:border-[#1e5138] hover:bg-[#f2f6f0] text-[#1e5138] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Projet suivant"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Slider Container */}
          <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-2xl overflow-hidden shadow-inner select-none touch-none bg-slate-100">
            {/* After Image (Full background) */}
            <div className="absolute inset-0">
              <Image
                src={current.after}
                alt={`${current.title} - Après`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 896px"
                priority
              />
              <span className="absolute bottom-4 right-4 bg-[#1e5138]/90 text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-md backdrop-blur-xs">
                Après
              </span>
            </div>

            {/* Before Image (Clipped with width) */}
            <div
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: `${sliderPos}%` }}
            >
              <div className="relative w-full h-full" style={{ minWidth: "100%", width: "100%" }}>
                {/* We need the inner image to match container width to prevent distortion */}
                <div className="absolute inset-0 w-[100cqi] max-w-none">
                  {/* Container uses cqi or standard width */}
                </div>
                <Image
                  src={current.before}
                  alt={`${current.title} - Avant`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 896px"
                  priority
                />
              </div>
              <span className="absolute bottom-4 left-4 bg-slate-900/80 text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-md backdrop-blur-xs">
                Avant
              </span>
            </div>

            {/* Drag Handle Bar */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20 flex items-center justify-center"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="w-9 h-9 rounded-full bg-white shadow-xl border-2 border-[#1e5138] flex items-center justify-center text-[#1e5138] text-xs font-bold">
                ↔
              </div>
            </div>

            {/* Invisible Range Input for Full Accessibility & Mobile Dragging */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              aria-label="Curseur avant après"
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
            />
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed text-center sm:text-left italic">
            &ldquo;{current.description}&rdquo;
          </p>
        </div>

        {/* Additional Real Project Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
          <div className="bg-white rounded-2xl p-4 border border-[#8fa07e]/20 shadow-xs space-y-2">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
              <Image
                src="/assets/images/real_taille_murier.jpg"
                alt="Taille raisonnée de mûrier"
                fill
                sizes="(max-width: 640px) 100vw, 300px"
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <h4 className="font-bold text-sm text-[#2d4d36] pt-1">Taille Raisonnée de Mûrier</h4>
            <p className="text-xs text-slate-500">Mise en forme esthétique et aération de la ramure.</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#8fa07e]/20 shadow-xs space-y-2">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
              <Image
                src="/assets/images/real_palmiers_apres.jpg"
                alt="Nettoyage et taille de palmiers"
                fill
                sizes="(max-width: 640px) 100vw, 300px"
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <h4 className="font-bold text-sm text-[#2d4d36] pt-1">Soin & Élagage de Palmiers</h4>
            <p className="text-xs text-slate-500">Suppression des palmes sèches et sécurisation.</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#8fa07e]/20 shadow-xs space-y-2">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
              <Image
                src="/assets/images/real_elagage_arbre.jpg"
                alt="Élagage d'arbre d'ornement"
                fill
                sizes="(max-width: 640px) 100vw, 300px"
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <h4 className="font-bold text-sm text-[#2d4d36] pt-1">Élagage d&apos;Arbres de Haut Jet</h4>
            <p className="text-xs text-slate-500">Éclaircie pour apporter de la lumière au gazon.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
