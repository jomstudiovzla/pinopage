import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";

export const metadata: Metadata = {
  title: "Mentions Légales | Pino Espaces Verts",
  description:
    "Mentions légales de l'entreprise Pino Espaces Verts (SIRET 105 075 006 00012) conformément à la loi LCEN n° 2004-575.",
};

export default function MentionsLegalesPage() {
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
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#2d4d36]">Mentions Légales</h1>
              <p className="text-xs text-slate-500 mt-1">
                Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie numérique (LCEN).
              </p>
            </div>
          </div>

          <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-bold text-base text-slate-900">1. Éditeur & Exploitant du Site</h2>
              <ul className="space-y-1.5 text-xs sm:text-sm pl-4 list-disc text-slate-600">
                <li><strong>Dénomination commerciale :</strong> Pino Espaces Verts</li>
                <li><strong>Responsable d&apos;exploitation :</strong> Andrés Pino (Entreprise Individuelle)</li>
                <li><strong>Numéro SIRET :</strong> 105 075 006 00012</li>
                <li><strong>Siège d&apos;activité :</strong> 1990 ROUTE de Trévouse, 84320 Entraigues-sur-la-Sorgue (Vaucluse), France</li>
                <li><strong>Téléphone :</strong> <a href="tel:+33651594034" className="text-[#1e5138] underline font-bold">+33 6 51 59 40 34</a></li>
                <li><strong>Courriel :</strong> <a href="mailto:pino.espacesverts@gmail.com" className="text-[#1e5138] underline font-bold">pino.espacesverts@gmail.com</a></li>
                <li><strong>Activité principale (Code APE/NAF) :</strong> 81.30Z - Services d&apos;aménagement paysager</li>
                <li><strong>Déclaration Services à la Personne (SAP) :</strong> Déposée le 26/06/2026 — Crédit d&apos;impôt 50% (CGI art. 199 sexdecies)</li>
                <li><strong>Régime de TVA :</strong> Franchise en base de TVA selon l&apos;article 293 B du CGI (« TVA non applicable, art. 293 B du CGI ») pour les prestations directes hors SAP.</li>
                <li><strong>Directeur de la publication :</strong> Andrés Pino</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-base text-slate-900">2. Partenaire Coopératif Agréé (Services à la Personne)</h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Les prestations d&apos;entretien de jardin ouvrant droit aux <strong>50% de crédit d&apos;impôt immédiat</strong> (Loi Borloo / Art. 199 sexdecies du CGI) sont émises et déclarées en partenariat avec :
              </p>
              <div className="p-4 rounded-2xl bg-[#fafaf6] border border-[#8fa07e]/30 space-y-1.5 text-xs text-slate-700">
                <p><strong>Coopérative Unipros</strong> (SCIC à capital variable)</p>
                <p>Déclaration SAP enregistrée auprès des services de l&apos;État français</p>
                <p>Site officiel : <a href="https://unipros.coop" target="_blank" rel="noopener noreferrer" className="text-[#1e5138] underline font-bold">https://unipros.coop</a></p>
                <p>Support téléphonique : 01 89 71 48 25</p>
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-base text-slate-900">3. Assurance Responsabilité Civile Professionnelle</h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Pino Espaces Verts est titulaire d&apos;un contrat d&apos;<strong>Assurance Responsabilité Civile Professionnelle (RC Pro)</strong> couvrant l&apos;ensemble de ses activités d&apos;entretien de jardin, tonte, débroussaillage et élagage pour les dommages causés aux tiers.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-base text-slate-900">4. Hébergement du Site Internet</h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Le présent site internet est hébergé par Firebase Hosting (Google Ireland Ltd, Gordon House, Barrow Street, Dublin 4, Irlande) et Vercel Inc. (440 N Barranca Ave #4133, Covina, CA 91723, États-Unis). Les données de formulaire sont hébergées sur des infrastructures sécurisées situées au sein de l&apos;Union européenne (Paris, région eu-west-3).
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-base text-slate-900">5. Propriété Intellectuelle</h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Tous les textes, photographies de chantiers, logos et éléments graphiques présents sur ce site sont la propriété exclusive de Pino Espaces Verts ou de leurs titulaires respectifs. Toute reproduction sans accord écrit préalable est interdite.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
