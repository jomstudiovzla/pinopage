import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Percent, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Crédit d'Impôt 50% & Avance Immédiate (SAP) | Pino Espaces Verts",
  description:
    "Comprendre le crédit d'impôt immédiat de 50% pour vos travaux de jardinage avec Pino Espaces Verts et la coopérative Unipros (Case 7DB).",
};

export default function AidesFiscalesPage() {
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
            <div className="w-12 h-12 rounded-2xl bg-[#00D2D3]/15 text-[#006f70] flex items-center justify-center">
              <Percent className="w-6 h-6 text-[#00D2D3]" />
            </div>
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#2d4d36]">
                Crédit d&apos;Impôt de 50% & Avance Immédiate
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Dispositif légal des Services à la Personne (Article 199 sexdecies du CGI).
              </p>
            </div>
          </div>

          <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
            <section className="space-y-3">
              <h2 className="font-bold text-base text-slate-900">Qu&apos;est-ce que l&apos;Avance Immédiate ?</h2>
              <p className="text-xs sm:text-sm text-slate-600">
                L&apos;Avance Immédiate est un service optionnel et gratuit proposé par l&apos;URSSAF et la Direction Générale des Finances Publiques. Il vous permet de déduire immédiatement vos <strong>50% de crédit d&apos;impôt</strong> du montant total de votre facture lors de son règlement.
              </p>
              <div className="p-4 rounded-2xl bg-[#f2f6ee] border border-[#1e5138]/20 flex items-center justify-between">
                <span className="font-bold text-xs sm:text-sm text-[#2d4d36]">
                  Exemple : Facture de 200 € → Vous ne déboursez que 100 € !
                </span>
                <span className="bg-[#1e5138] text-white text-[11px] font-black px-3 py-1 rounded-full uppercase">
                  -50% Direct
                </span>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-bold text-base text-slate-900">Plafonds & Éligibilité</h2>
              <ul className="text-xs sm:text-sm pl-4 list-disc text-slate-600 space-y-1.5">
                <li>Le plafond légal annuel pour les petits travaux de jardinage est fixé à <strong>5 000 € TTC de dépenses par foyer fiscal</strong> (soit jusqu&apos;à 2 500 € d&apos;économie directe par an).</li>
                <li>Ouvert à tous les contribuables domiciliés fiscalement en France (résidence principale ou secondaire, propriétaires ou locataires).</li>
                <li>Prestations éligibles : tonte, taille de haies, débroussaillage, ramassage de feuilles mortes, désherbage et remise en état d&apos;allées.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-bold text-base text-slate-900">Case 7DB sur Votre Déclaration d&apos;Impôts</h2>
              <p className="text-xs sm:text-sm text-slate-600">
                En début d&apos;année suivante, une <strong>attestation fiscale annuelle</strong> récapitulative vous est délivrée par la coopérative Unipros. Le montant déduit est automatiquement pré-rempli sur votre déclaration de revenus (formulaire 2042 RICI, Case 7DB).
              </p>
            </section>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-500 font-medium">
                Vous souhaitez en profiter pour votre jardin ?
              </span>
              <Link
                href="/#devis"
                className="bg-[#1e5138] hover:bg-[#2d4d36] text-white text-xs font-bold py-3 px-6 rounded-full flex items-center gap-2 transition-colors shadow-md"
              >
                <span>Demander mon devis éligible 50%</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
