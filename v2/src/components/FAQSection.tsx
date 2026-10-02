"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronDown, CheckCircle2 } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: "Comment fonctionne l'Avance Immédiate du crédit d'impôt 50% ?",
      answer:
        "Grâce à notre partenariat avec la coopérative déclarée Unipros, vous ne réglez que 50% de la facture. L'URSSAF prend directement en charge les 50% restants au moment de la facturation. Vous n'avez plus besoin d'avancer l'argent et d'attendre votre déclaration d'impôts l'année suivante !",
    },
    {
      question: "Quels sont les moyens de paiement acceptés pour le crédit d'impôt ?",
      answer:
        "Conformément à la réglementation stricte des Services à la Personne (SAP, Art. 199 sexdecies du CGI), le paiement doit être strictement traçable : chèque bancaire libellé à l'ordre de 'PINO ANDRES', virement bancaire direct, titres CESU / e-CESU (Edenred, Chèque Domicile, Pluxee, Up) ou prélèvement URSSAF. Les espèces n'ouvrent pas droit au crédit d'impôt et la carte bancaire n'est pas utilisée pour ces prestations.",
    },
    {
      question: "Quels petits travaux de jardinage sont éligibles aux 50% d'impôt ?",
      answer:
        "Sont éligibles : la tonte de pelouse, la taille de haies et d'arbustes, le débroussaillage courant, le ramassage des feuilles mortes, le désherbage manuel et l'évacuation des déchets verts. Les gros travaux d'élagage d'arbres ou de terrassement lourd relèvent quant à eux de nos prestations artisanales directes avec devis dédié.",
    },
    {
      question: "Le devis est-il payant ou engageant ?",
      answer:
        "Le devis préalable est 100% gratuit et sans aucun engagement. Il est valable pendant 30 jours et détaille précisément la nature des travaux, la superficie estimée et la déduction fiscale applicable.",
    },
    {
      question: "Dans quel secteur géographique intervenez-vous ?",
      answer:
        "Nous intervenons dans un rayon habituel de 40 à 45 km autour d'Entraigues-sur-la-Sorgue (Avignon, Sorgues, Vedène, Le Pontet, Carpentras, Cavaillon...) ainsi que sur la Gironde (Bordeaux Métropole et communes voisines).",
    },
    {
      question: "Comment appliquer le code de réduction PELABOLA (-20%) ?",
      answer:
        "Il vous suffit de mentionner le code PELABOLA dans le formulaire de devis ou lors de votre premier contact téléphonique. Une remise immédiate de 20% sur la main d'œuvre sera directement appliquée sur votre premier devis.",
    },
  ];

  return (
    <section id="faq" className="py-16 sm:py-24 bg-[#f2f6ee] border-b border-[#8fa07e]/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#1e5138]/10 text-[#1e5138] text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" /> Réponses à Vos Questions
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#2d4d36]">
            Questions Fréquentes & Modalités
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Tout ce que vous devez savoir sur nos interventions, l&apos;Avance Immédiate et la fiscalité.
          </p>
        </div>

        <div className="space-y-3.5">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-[#8fa07e]/30 overflow-hidden shadow-xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <span className="font-serif text-base sm:text-lg font-bold text-[#2d4d36] flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#1e5138] shrink-0" />
                    <span>{faq.question}</span>
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#8fa07e] shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-[#1e5138]" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-100">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
