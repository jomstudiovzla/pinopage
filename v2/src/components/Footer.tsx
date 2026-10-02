import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#2d4d36] text-white/90 py-14 border-t border-white/10 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Col 1: Identity & Legal Identity */}
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 shrink-0 brightness-0 invert opacity-95">
              <Image
                src="/assets/logo/Logo pino.png"
                alt="Pino Espaces Verts"
                fill
                sizes="44px"
                className="object-contain"
              />
            </div>
            <h3 className="font-serif text-2xl font-bold tracking-tight">Pino Espaces Verts</h3>
          </div>
          <p className="text-white/70 text-xs leading-relaxed">
            Entreprise individuelle Andres Pino — SIRET <strong>105 075 006 00012</strong>.
            Artisan paysagiste spécialisé dans l&apos;entretien de jardins avec Avance Immédiate du crédit d&apos;impôt 50%.
          </p>
          <div className="pt-1 flex items-center gap-2 text-xs text-white/80">
            <MapPin className="w-3.5 h-3.5 text-[#8fa07e] shrink-0" />
            <span>1990 ROUTE de Trévouse, 84320 Entraigues-sur-la-Sorgue</span>
          </div>
        </div>

        {/* Col 2: Navigation */}
        <div className="space-y-3">
          <h4 className="font-semibold text-[#8fa07e] uppercase tracking-widest text-xs">
            Plan du Site
          </h4>
          <ul className="space-y-2 text-xs text-white/75">
            <li>
              <a href="#services" className="hover:text-white hover:underline transition-colors">
                🌿 Prestations & Tarifs
              </a>
            </li>
            <li>
              <a href="#unipros" className="hover:text-white hover:underline transition-colors">
                🏛️ Crédit d&apos;Impôt 50% Unipros
              </a>
            </li>
            <li>
              <a href="#realisations" className="hover:text-white hover:underline transition-colors">
                📸 Réalisations Avant / Après
              </a>
            </li>
            <li>
              <a href="#coupon" className="hover:text-white hover:underline transition-colors">
                🎁 Code Promo PELABOLA (-20%)
              </a>
            </li>
            <li>
              <a href="#devis" className="hover:text-white hover:underline transition-colors">
                📝 Demander un Devis Gratuit
              </a>
            </li>
            <li>
              <Link href="/connexion" className="hover:text-white hover:underline transition-colors">
                🔐 Mon Espace Client
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Legal France */}
        <div className="space-y-3">
          <h4 className="font-semibold text-[#8fa07e] uppercase tracking-widest text-xs">
            Légal & Conformité France
          </h4>
          <ul className="space-y-2 text-xs text-white/75">
            <li>
              <Link href="/mentions-legales" className="hover:text-white hover:underline transition-colors">
                Mentions Légales (LCEN)
              </Link>
            </li>
            <li>
              <Link href="/cgv" className="hover:text-white hover:underline transition-colors">
                Conditions Générales de Vente (CGV)
              </Link>
            </li>
            <li>
              <Link href="/confidentialite" className="hover:text-white hover:underline transition-colors">
                Protection des Données (RGPD)
              </Link>
            </li>
            <li>
              <Link href="/aides-fiscales" className="hover:text-white hover:underline transition-colors">
                Réglementation Fiscale SAP (Case 7DB)
              </Link>
            </li>
            <li>
              <a
                href="https://unipros.coop"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white hover:underline transition-colors flex items-center gap-1.5"
              >
                <span>Site officiel Coopérative Unipros</span> ↗
              </a>
            </li>
          </ul>
        </div>

        {/* Col 4: Contact & Regulation */}
        <div className="space-y-3">
          <h4 className="font-semibold text-[#8fa07e] uppercase tracking-widest text-xs">
            Contact & Intervention
          </h4>
          <div className="space-y-2 text-xs text-white/75">
            <a
              href="tel:+33651594034"
              className="flex items-center gap-2 hover:text-white transition-colors font-bold text-sm text-lime-300"
            >
              <Phone className="w-4 h-4" /> 06 51 59 40 34
            </a>
            <a
              href="mailto:pino.espacesverts@gmail.com"
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <Mail className="w-4 h-4 text-[#8fa07e]" /> pino.espacesverts@gmail.com
            </a>
            <p className="text-[11px] text-white/60 leading-normal pt-2">
              Intervention en Vaucluse (84) & Gironde (33). TVA non applicable, art. 293 B du CGI pour les prestations directes.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-10 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
        <div>Tous droits réservés © {new Date().getFullYear()} Pino Espaces Verts.</div>
        <div className="flex items-center gap-2">
          <span>Artisan déclaré • Démarche éco-responsable</span>
        </div>
      </div>
    </footer>
  );
}
