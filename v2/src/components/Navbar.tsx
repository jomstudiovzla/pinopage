"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Phone, FileText, User, Menu, X, ShieldCheck } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#fbf8f2]/95 backdrop-blur-md border-b border-[#8fa07e]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Logo & Unipros Seal */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative h-11 w-11 shrink-0">
              <Image
                src="/assets/logo/Logo pino.png"
                alt="Pino Espaces Verts"
                fill
                sizes="44px"
                className="object-contain transition-transform group-hover:scale-105"
                priority
              />
            </div>
            <span className="font-serif font-bold text-[#2d4d36] leading-tight text-lg sm:text-xl">
              <span className="block">Pino Espaces</span>
              <span className="block text-[#1e5138]">Verts</span>
            </span>
          </Link>

          {/* Unipros Official Link (Header requirement from AGENTS.md) */}
          <a
            href="https://unipros.coop"
            target="_blank"
            rel="noopener noreferrer"
            title="Coopérative Unipros — Crédit d'impôt 50 % SAP"
            className="hidden sm:flex items-center pl-3.5 ml-2 border-l border-[#8fa07e]/30 hover:opacity-80 transition-opacity"
          >
            <div className="relative h-7 w-24">
              <Image
                src="/assets/logo/unipros.png"
                alt="Unipros coopérative partenaire"
                fill
                sizes="96px"
                className="object-contain"
              />
            </div>
          </a>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6 font-medium text-sm text-[#222820]/80">
          <a href="#services" className="hover:text-[#1e5138] transition-colors py-1">
            Services
          </a>
          <a href="#unipros" className="hover:text-[#1e5138] transition-colors py-1 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-[#1e5138]" />
            Crédit d&apos;impôt 50%
          </a>
          <a href="#realisations" className="hover:text-[#1e5138] transition-colors py-1">
            Réalisations
          </a>
          <a href="#coupon" className="hover:text-[#1e5138] transition-colors py-1 text-[#1e5138] font-semibold">
            Offre -20%
          </a>
          <a href="#faq" className="hover:text-[#1e5138] transition-colors py-1">
            FAQ
          </a>

          <div className="flex items-center gap-3 pl-3 border-l border-[#8fa07e]/20">
            <a
              href="tel:+33651594034"
              className="flex items-center gap-1.5 text-xs font-bold text-[#1e5138] hover:text-[#2d4d36] transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#1e5138]" />
              <span>06 51 59 40 34</span>
            </a>

            <a
              href="#devis"
              className="bg-[#1e5138] hover:bg-[#2d4d36] text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm hover:shadow flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Devis Gratuit</span>
            </a>

            <Link
              href="/connexion"
              className="border border-[#1e5138]/30 hover:border-[#1e5138] bg-white text-[#1e5138] px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>Espace Client</span>
            </Link>
          </div>
        </nav>

        {/* Mobile menu trigger */}
        <div className="lg:hidden flex items-center gap-2">
          <a
            href="tel:+33651594034"
            className="p-2 rounded-full bg-white border border-[#8fa07e]/30 text-[#1e5138]"
            aria-label="Appeler Pino Espaces Verts"
          >
            <Phone className="w-4 h-4" />
          </a>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#2d4d36] rounded-lg hover:bg-[#f2f6f0] transition-colors"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#fbf8f2] border-b border-[#8fa07e]/20 px-4 pt-3 pb-6 space-y-3 animate-in fade-in duration-200">
          <a
            href="#services"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-3 rounded-lg text-sm font-semibold text-[#222820] hover:bg-[#f2f6f0]"
          >
            🌿 Services & Forfaits
          </a>
          <a
            href="#unipros"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-3 rounded-lg text-sm font-semibold text-[#222820] hover:bg-[#f2f6f0]"
          >
            🏛️ Crédit d&apos;impôt Immédiat 50% (Unipros)
          </a>
          <a
            href="#realisations"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-3 rounded-lg text-sm font-semibold text-[#222820] hover:bg-[#f2f6f0]"
          >
            📸 Réalisations Avant / Après
          </a>
          <a
            href="#coupon"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-3 rounded-lg text-sm font-semibold text-[#1e5138] hover:bg-[#f2f6f0]"
          >
            🎁 Offre Spéciale -20%
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-3 rounded-lg text-sm font-semibold text-[#222820] hover:bg-[#f2f6f0]"
          >
            ❓ Questions Fréquentes
          </a>

          <a
            href="https://unipros.coop"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white border border-[#00D2D3]/40 text-xs font-bold text-[#1F3A8A]"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00D2D3]" /> Partenaire Officiel Coopérative Unipros
            </span>
            <span className="text-[10px] text-slate-500">unipros.coop ↗</span>
          </a>

          <div className="pt-2 border-t border-[#8fa07e]/20 space-y-2">
            <a
              href="#devis"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center bg-[#1e5138] hover:bg-[#2d4d36] text-white py-3 rounded-xl font-bold text-sm shadow-md"
            >
              Demander mon Devis Gratuit
            </a>
            <Link
              href="/connexion"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center bg-white border border-[#1e5138]/30 text-[#1e5138] py-2.5 rounded-xl font-bold text-sm"
            >
              Mon Espace Client
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
