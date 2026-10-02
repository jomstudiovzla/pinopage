import React from "react";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { ServicesSection } from "@/components/ServicesSection";
import { UniprosSection } from "@/components/UniprosSection";
import { CouponSection } from "@/components/CouponSection";
import { GalerieSection } from "@/components/GalerieSection";
import { DevisSection } from "@/components/DevisSection";
import { FAQSection } from "@/components/FAQSection";
import { Footer } from "@/components/Footer";
import { CookieConsent } from "@/components/CookieConsent";

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    "name": "Pino Espaces Verts",
    "image": "https://pinoespacesverts.online/assets/logo/Logo%20completo.png",
    "telephone": "+33651594034",
    "email": "pino.espacesverts@gmail.com",
    "url": "https://pinoespacesverts.online",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "1990 ROUTE de Trévouse",
      "addressLocality": "Entraigues-sur-la-Sorgue",
      "postalCode": "84320",
      "addressCountry": "FR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 43.9997,
      "longitude": 4.9272
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "opens": "08:00",
        "closes": "19:00"
      }
    ],
    "priceRange": "€€",
    "currenciesAccepted": "EUR",
    "paymentAccepted": "Check, Bank Transfer, CESU",
    "areaServed": ["Vaucluse", "Gironde", "Entraigues-sur-la-Sorgue", "Avignon", "Bordeaux"],
    "description":
      "Artisan paysagiste spécialisé dans l'entretien soigné de jardins, tonte, taille de haies, élagage et débroussaillage. 50% de crédit d'impôt immédiat via la coopérative Unipros (SAP).",
    "sameAs": [
      "https://www.instagram.com/pino.espacesverts"
    ]
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fbf8f2] text-[#222820]">
      {/* Structured data SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar />

      <main className="flex-1">
        <HeroSection />
        <ServicesSection />
        <UniprosSection />
        <CouponSection />
        <GalerieSection />
        <DevisSection />
        <FAQSection />
      </main>

      <Footer />
      <CookieConsent />
    </div>
  );
}
