import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Politique de Confidentialité (RGPD) | Pino Espaces Verts",
  description:
    "Traitement et protection des données à caractère personnel conformément au Règlement Général sur la Protection des Données (RGPD).",
};

export default function ConfidentialitePage() {
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
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#2d4d36]">
                Politique de Confidentialité & RGPD
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Conforme au Règlement (UE) 2016/679 et à la loi Informatique et Libertés.
              </p>
            </div>
          </div>

          <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-bold text-base text-slate-900">1. Responsable du Traitement</h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Le responsable du traitement des données est Andrés Pino, exploitant de Pino Espaces Verts (SIRET 105 075 006 00012). Contact : <a href="mailto:pino.espacesverts@gmail.com" className="text-[#1e5138] underline font-bold">pino.espacesverts@gmail.com</a>.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-base text-slate-900">2. Données Collectées & Finalités</h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Nous collectons uniquement les données strictement nécessaires :
              </p>
              <ul className="text-xs sm:text-sm pl-4 list-disc text-slate-600 space-y-1">
                <li><strong>Nom, prénom, téléphone, e-mail, code postal et commune :</strong> pour vous contacter, établir votre devis gratuit et exécuter la prestation.</li>
                <li><strong>Données fiscales SAP :</strong> transmises à la coopérative Unipros et à l&apos;URSSAF pour l&apos;octroi du crédit d&apos;impôt de 50%.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-base text-slate-900">3. Durée de Conservation & Droits</h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Les demandes de devis non conclues sont conservées 3 ans maximum. Les factures et données comptables sont conservées pendant 10 ans conformément aux obligations du Code de commerce français. Vous disposez d&apos;un droit d&apos;accès, de rectification, de portabilité et d&apos;effacement (avec anonymisation des données personnelles) en écrivant à <a href="mailto:pino.espacesverts@gmail.com" className="text-[#1e5138] underline font-bold">pino.espacesverts@gmail.com</a>.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-base text-slate-900">4. Hébergement au sein de l&apos;Union Européenne</h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Toutes les données de formulaires et de comptes clients sont hébergées sur des infrastructures sécurisées situées au sein de l&apos;Union européenne (Paris, France / Francfort, Allemagne) avec chiffrement au repos et en transit.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
