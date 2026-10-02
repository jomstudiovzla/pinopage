import React from "react";
import { Scissors, Shovel, Sparkles, Trash2, Trees, Flower2, Check, ArrowRight } from "lucide-react";

export function ServicesSection() {
  const services = [
    {
      id: "tonte",
      title: "Tonte de Pelouse & Finitions",
      icon: Shovel,
      description:
        "Tonte soignée, mulching ou ramassage, découpe nette des bordures et passages d'allées. Contrats annuels ou passages ponctuels.",
      sapEligible: true,
      popular: true,
      features: ["Hauteur de coupe ajustée", "Nettoyage des abords", "Évacuation comprise"],
    },
    {
      id: "taille",
      title: "Taille de Haies & Arbustes",
      icon: Scissors,
      description:
        "Taille géométrique ou raisonnée de vos haies (thuyas, lauriers, cyprès, troènes) et arbustes d'ornement pour une silhouette parfaite.",
      sapEligible: true,
      popular: true,
      features: ["Élagage des repousses", "Respect des périodes nidicoles", "Chantier laissé impeccable"],
    },
    {
      id: "debroussaillage",
      title: "Débroussaillage & Nettoyage",
      icon: Trees,
      description:
        "Mise aux normes OLD (Obligations Légales de Débroussaillement), fauchage des ronces et broussailles sur parcelles et terrains en pente.",
      sapEligible: true,
      popular: false,
      features: ["Prévention incendie", "Machines professionnelles", "Terrains difficiles"],
    },
    {
      id: "remise-etat",
      title: "Remise en État Complète",
      icon: Sparkles,
      description:
        "Après un hiver ou une absence prolongée, nous redonnons vie à votre jardin : désherbage manuel, taille de remise en forme, scarification.",
      sapEligible: true,
      popular: false,
      features: ["Bilan de l'état végétal", "Nettoyage en profondeur", "Conseils d'entretien"],
    },
    {
      id: "elagage",
      title: "Élagage & Soin des Arbres",
      icon: Trees,
      description:
        "Taille d'éclaircie, suppression des bois morts et branches dangereuses à proximité de toitures ou lignes. Travail en sécurité.",
      sapEligible: false,
      popular: false,
      badge: "Prestation Artisanale Directe",
      features: ["Sécurité certifiée", "Évacuation des gros bois", "Respect de la physiologie végétale"],
    },
    {
      id: "evacuation",
      title: "Évacuation des Déchets Verts",
      icon: Trash2,
      description:
        "Broyage sur place ou évacuation vers la filière de compostage agréée de tous les branchages, herbes et résidus de coupe.",
      sapEligible: true,
      popular: false,
      features: ["100% valorisé en compost", "Aucun déchet laissé sur place", "Éco-responsable"],
    },
  ];

  return (
    <section id="services" className="py-16 sm:py-24 bg-white border-b border-[#8fa07e]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#1e5138]/10 text-[#1e5138] text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            <Flower2 className="w-3.5 h-3.5" /> Nos Prestations Paysagères
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#2d4d36]">
            Des Services Clés en Main Pour Votre Jardin
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            De l&apos;entretien récurrent aux interventions saisonnières, profitez d&apos;une expertise de terrain et d&apos;un matériel professionnel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.id}
                className="relative bg-[#fbf8f2] rounded-3xl p-7 border-2 border-[#8fa07e]/20 hover:border-[#1e5138] transition-all duration-300 hover:shadow-xl flex flex-col justify-between group"
              >
                {service.popular && (
                  <span className="absolute -top-3.5 right-6 bg-[#1e5138] text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    Prestation Populaire
                  </span>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-13 h-13 rounded-2xl bg-white border border-[#8fa07e]/30 flex items-center justify-center text-[#1e5138] shadow-xs group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    {service.sapEligible ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2.5 py-1 rounded-full">
                        Crédit d&apos;impôt 50%
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-900 text-[11px] font-extrabold px-2.5 py-1 rounded-full">
                        Devis Direct
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#2d4d36] group-hover:text-[#1e5138] transition-colors">
                    {service.title}
                  </h3>

                  <p className="text-slate-600 text-sm leading-relaxed">{service.description}</p>

                  <ul className="space-y-2 pt-2 border-t border-[#8fa07e]/15">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                        <Check className="w-3.5 h-3.5 text-[#1e5138] shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 mt-4 border-t border-[#8fa07e]/15">
                  <a
                    href="#devis"
                    className="inline-flex items-center gap-2 text-xs font-bold text-[#1e5138] group-hover:text-[#2d4d36] transition-colors"
                  >
                    <span>Demander un devis pour ce service</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
