"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, Settings } from "lucide-react";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("pino_cookie_consent");
    if (!consent) {
      // Delay display slightly for smooth page load
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(
      "pino_cookie_consent",
      JSON.stringify({ essential: true, analytics: true, date: new Date().toISOString() })
    );
    setVisible(false);
  };

  const handleRejectAll = () => {
    localStorage.setItem(
      "pino_cookie_consent",
      JSON.stringify({ essential: true, analytics: false, date: new Date().toISOString() })
    );
    setVisible(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem(
      "pino_cookie_consent",
      JSON.stringify({ essential: true, analytics: analyticsEnabled, date: new Date().toISOString() })
    );
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentement aux cookies"
      className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 bg-[#fbf8f2] border-2 border-[#8fa07e]/40 rounded-3xl p-5 sm:p-6 shadow-2xl animate-in slide-in-from-bottom duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#1e5138]/10 text-[#1e5138] flex items-center justify-center shrink-0">
          <Cookie className="w-5 h-5" />
        </div>
        <div className="space-y-2 flex-1">
          <h3 className="font-serif text-lg font-bold text-[#2d4d36]">Gestion des Cookies & Vie Privée</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Nous utilisons des cookies techniques indispensables au fonctionnement du site et, avec votre accord,
            des cookies d&apos;analyse de navigation anonymes (CNIL).
          </p>

          {showPreferences && (
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2.5 my-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">Cookies Essentiels</span>
                <span className="text-[10px] font-extrabold text-[#1e5138] bg-emerald-50 px-2 py-0.5 rounded-full">
                  Toujours Actifs
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                <span className="font-semibold text-slate-700">Mesure d&apos;audience anonyme</span>
                <input
                  type="checkbox"
                  checked={analyticsEnabled}
                  onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-[#1e5138] border-slate-300 focus:ring-[#1e5138] cursor-pointer"
                />
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-wrap gap-2 text-xs font-bold">
            {showPreferences ? (
              <button
                type="button"
                onClick={handleSavePreferences}
                className="bg-[#1e5138] hover:bg-[#2d4d36] text-white px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Enregistrer mes choix
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="bg-[#1e5138] hover:bg-[#2d4d36] text-white px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  Tout Accepter
                </button>
                <button
                  type="button"
                  onClick={handleRejectAll}
                  className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Refuser
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreferences(true)}
                  className="text-slate-500 hover:text-slate-800 underline px-2 py-2 cursor-pointer flex items-center gap-1"
                >
                  <Settings className="w-3.5 h-3.5" /> Personnaliser
                </button>
              </>
            )}
          </div>

          <div className="pt-1">
            <Link
              href="/confidentialite"
              className="text-[10px] text-slate-400 hover:text-slate-600 underline"
            >
              Consulter notre politique de confidentialité
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
