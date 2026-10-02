import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pino Espaces Verts | Jardinier Paysagiste à Bordeaux & Gironde (33)",
  description:
    "Entretien et création d'espaces verts en Gironde. Tonte, taille de haies, élagage et aménagement. Bénéficiez de 50% de crédit d'impôt immédiat via la coopérative Unipros (SAP).",
  metadataBase: new URL("https://pinoespacesverts.online"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Pino Espaces Verts | Jardinier Paysagiste en Gironde",
    description:
      "Services paysagers professionnels avec 50% d'Avance Immédiate de crédit d'impôt. Devis gratuit et personnalisé.",
    url: "https://pinoespacesverts.online",
    siteName: "Pino Espaces Verts",
    locale: "fr_FR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${cormorant.variable} ${jakarta.variable} scroll-smooth`}>
      <body className="min-h-screen flex flex-col bg-brand-cream text-brand-charcoal antialiased">
        {children}
      </body>
    </html>
  );
}
