import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Conditions Générales de Vente (CGV) | Pino Espaces Verts",
  description:
    "Conditions Générales de Vente applicables aux prestations d'entretien paysager et de Services à la Personne (SAP).",
};

export default function CGVPage() {
  return (
    <main className="min-h-screen bg-[#fbf8f2] py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#1e5138] hover:text-[#2d4d36] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à l&apos;accueil
        </Link>

        <div className="bg-white p-8 sm:p-12 rounded-3xl border-2 border-[#8fa07e]/20 shadow-xl space-y-8">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#1e5138]/10 text-[#1e5138] flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#2d4d36]">
                Conditions Générales de Vente
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Applicables aux prestations de petits travaux de jardinage et d&apos;entretien d&apos;espaces verts.
              </p>
            </div>
          </div>

          <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-bold text-base text-slate-900">Article 1 – Objet et Champ d&apos;Application</h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Les présentes Conditions Générales de Vente s&apos;appliquent à l&apos;ensemble des prestations d&apos;entretien de jardins réalisées par l&apos;entreprise individuelle Andres Pino (nom commercial : Pino Espaces Verts), SIRET 105 075 006 00012, sise 1990 ROUTE de Trévouse, 84320 Entraigues-sur-la-Sorgue. Tout client faisant appel à nos services accepte sans réserve les présentes conditions.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-base text-slate-900">Article 2 – Services à la Personne (SAP) & Crédit d&apos;Impôt</h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Les prestations de petits travaux de jardinage à domicile (tonte, taille de haies, désherbage, ramassage de feuilles) ouvrent droit à un <strong>crédit d&apos;impôt de 50 %</strong> au titre de l&apos;article 199 sexdecies du CGI, dans la limite du plafond légal de 5 000 € TTC par an et par foyer fiscal.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-base text-slate-900">Article 3 – Moyens de Règlement Obligatoires</h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Afin de garantir l&apos;ouverture aux avantages fiscaux, le paiement doit être obligatoirement traçable :
              </p>
              <ul className="text-xs sm:text-sm pl-4 list-disc text-slate-600 space-y-1">
                <li><strong>Chèque bancaire</strong> libellé impérativement à l&apos;ordre exact de : <strong>PINO ANDRES</strong>.</li>
                <li><strong>Virement bancaire</strong> direct sur le compte de l&apos;entreprise.</li>
                <li><strong>Titres CESU / e-CESU</strong> préfinancés (Edenred, Chèque Domicile, Pluxee, Up).</li>
                <li><strong>Prélèvement URSSAF</strong> dans le cadre de l&apos;Avance Immédiate via la coopérative Unipros.</li>
              </ul>
              <p className="text-xs text-amber-900 font-semibold bg-amber-50 p-3 rounded-xl border border-amber-200 mt-2">
                Conformément à la réglementation fiscale, les règlements en espèces n&apos;ouvrent pas droit au crédit d&apos;impôt. La carte bancaire n&apos;est pas proposée pour les prestations SAP.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-base text-slate-900">Article 4 – Devis & Conclusion du Contrat</h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Chaque intervention fait l&apos;objet d&apos;un devis préalable gratuit et détaillé, valable 30 jours à compter de son émission. Le contrat est réputé conclu dès la signature du devis ou validation électronique. Aucun acompte n&apos;est exigé à la signature pour les prestations d&apos;entretien courant.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-base text-slate-900">Article 5 – Médiation de la Consommation</h2>
              <p className="text-xs sm:text-sm text-slate-600">
                En cas de litige non résolu à l&apos;amiable, le client consommateur peut recourir gratuitement au médiateur de la consommation désigné : <strong>CM2C</strong> (Centre de la Médiation de la Consommation de Conciliateurs de Justice) — <a href="https://www.cm2c.net/" target="_blank" rel="noopener noreferrer" className="text-[#1e5138] underline font-bold">https://www.cm2c.net/</a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
