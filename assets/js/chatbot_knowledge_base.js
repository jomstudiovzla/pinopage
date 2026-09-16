/**
 * BASE DE CONNAISSANCES OFFICIELLE & MOTEUR INTELLIGENT DU CHATBOT
 * Pino Espaces Verts & Partenaire Agréé Coopérative Unipros
 * Données officielles extraites directement de https://unipros.coop
 */

window.PINO_CHATBOT_KB = {
  // 1. Identité & Contact Direct Andrés Pino (Pour tout ce qui concerne un jardin spécifique)
  pino: {
    name: "Pino Espaces Verts",
    owner: "Andrés Pino",
    role: "Artisan Paysagiste & Entretien d'Espaces Verts",
    phone: "+33 6 51 59 40 34",
    phoneFormatted: "06 51 59 40 34",
    phoneUrl: "tel:+33651594034",
    whatsappUrl: "https://wa.me/33651594034",
    email: "pino.spacesverts@gmail.com",
    emailUrl: "mailto:pino.spacesverts@gmail.com",
    instagram: "@pino.espacesverts",
    instagramUrl: "https://www.instagram.com/pino.espacesverts",
    zone: "Bordeaux Métropole & Gironde (33)",
    hours: "Lundi au Samedi, 8h00 - 19h00 (Urgences & Devis sous 24h)",
    insurance: "Responsabilité Civile Professionnelle (RC Pro) complète",
    quoteNotice: "Déplacement & Devis 100% Gratuits sous 24h"
  },

  // 2. Coopérative Unipros (Données officielles extraites de https://unipros.coop)
  unipros: {
    name: "Coopérative Unipros (SCIC de Services à la Personne)",
    description: "Première Société Coopérative d'Intérêt Collectif (SCIC) nationale déclarée Services à la Personne (SAP - Loi Borloo / Art. 199 sexdecies du CGI). Sans commission appliquée sur les factures des particuliers.",
    taxCredit: "50% de crédit ou réduction d'impôt immédiat via l'Avance Immédiate de l'URSSAF.",
    howItWorks: "Vous ne réglez que 50% du montant de votre facture de jardinage. Les 50% restants sont directement pris en charge par l'État via l'URSSAF. Aucune avance de trésorerie !",
    maxCeiling: "Jusqu'à 5 000 € TTC de dépenses de jardinage éligibles par an et par foyer fiscal (soit jusqu'à 2 500 € d'économie réelle nette d'impôt).",
    taxFormBox: "Case 7DB sur la déclaration de revenus n° 2042.",
    attestationFiscale: "Délivrée chaque début d'année (courant janvier) pour toutes les factures réglées et encaissées l'année N-1. Téléchargeable dans votre espace personnel.",
    secondaryHome: "Les résidences secondaires situées en France sont 100% éligibles au crédit d'impôt de 50%. En revanche, les terrains nus sans habitation ne sont pas éligibles.",
    paymentMethods: {
      avanceImmediate: "Prélèvement direct des 50% par l'URSSAF (compte activé au préalable)",
      carteBancaire: "Paiement en ligne sécurisé 24/7 sur https://paiement.unipros.coop/payment/step1",
      virement: "Vers le compte Unipros avec numéro de facture obligatoire dans l'intitulé",
      cheque: "À l'ordre strict d'UNIPROS à remettre au professionnel ou à envoyer à la coopérative",
      cesu: "Titres CESU & e-CESU préfinancés (Edenred, Chèque Domicile, Pluxee/Sodexo, Up) jusqu'à 2 540 €/an par bénéficiaire. Panachage possible (ex: CESU + CB).",
      especesInterdites: "Les espèces ne sont strictement pas autorisées dans le cadre légal du crédit d'impôt SAP."
    },
    contacts: {
      phone: "01 89 71 48 25",
      phoneUrl: "tel:0189714825",
      phoneFree: "08 05 38 11 61",
      email: "contact@unipros.coop",
      emailUrl: "mailto:contact@unipros.coop",
      hours: "Du lundi au samedi de 8h00 à 20h00 (Numéro vert et gratuit)",
      website: "https://unipros.coop",
      paymentPortal: "https://paiement.unipros.coop/payment/step1",
      clientApp: "https://app.unipros.coop"
    }
  },

  // 3. Code Promo
  coupon: {
    code: "PELABOLA",
    discount: "20% de remise",
    scope: "Valable sur le premier contrat d'entretien ou prestation de jardinage",
    stackable: "100% cumulable avec les 50% de crédit d'impôt Unipros",
    database: "Enregistré en temps réel dans la base cloud Firebase (projet crm-jom)"
  },

  // 4. Catalogue des Services de Jardinage (Pino)
  services: [
    {
      id: "tonte",
      name: "Tonte de Pelouse & Finitions",
      eligibleUnipros: true,
      priceFrom: "60 € TTC",
      creditPrice: "30 € après crédit d'impôt 50%",
      details: "Tonte soignée de toutes surfaces, coupe-bordure au rotofil autour des massifs et clôtures, ramassage et soufflage des abords."
    },
    {
      id: "taille",
      name: "Taille de Haies, Arbustes & Végétaux",
      eligibleUnipros: true,
      priceFrom: "120 € TTC",
      creditPrice: "60 € après crédit d'impôt 50%",
      details: "Taille de formation, entretien et rabattage de haies (lauriers, thuyas, troènes, cyprès). Coupe rectiligne au cordeau et évacuation des rémanents."
    },
    {
      id: "debroussaillage",
      name: "Débroussaillage & Remise en État de Jardins",
      eligibleUnipros: true,
      priceFrom: "180 € TTC",
      creditPrice: "90 € après crédit d'impôt 50%",
      details: "Débroussaillage mécanique de friches, ronces géantes, herbes hautes, nettoyage d'allées sans phytosanitaires et évacuation totale."
    },
    {
      id: "creation",
      name: "Aménagement Paysager & Massifs",
      eligibleUnipros: "Partiel (Main d'œuvre d'entretien déductible)",
      priceFrom: "Sur devis personnalisé gratuit",
      creditPrice: "50% déductible sur la main d'œuvre de mise en place",
      details: "Création de massifs fleuris méditerranéens, bordures minérales en pierre calcaire, paillage d'écorces et bacs contemporains plage de piscine."
    },
    {
      id: "evacuation",
      name: "Évacuation & Recyclage des Déchets Verts",
      eligibleUnipros: true,
      priceFrom: "Inclus ou dès 50 €",
      creditPrice: "25 € après crédit d'impôt 50%",
      details: "Broyage sur place ou chargement en camion et acheminement vers les centres de compostage écologique agréés de Gironde."
    },
    {
      id: "b2b",
      name: "Contrats Annuels Copropriétés & Entreprises (B2B)",
      eligibleUnipros: false,
      priceFrom: "Sur devis sous 24h",
      creditPrice: "Facturation avec TVA 100% déductible pour professionnels",
      details: "Contrats d'entretien programmés pour syndics, cours d'immeubles, bureaux et commerces sur Bordeaux Métropole."
    }
  ],

  // 5. Communes desservies
  localities: [
    "Bordeaux (Caudéran, Centre, Nansouty, Chartrons, etc.)",
    "Talence", "Pessac", "Mérignac", "Gradignan", "Villenave-d'Ornon", 
    "Bègles", "Le Bouscat", "Bruges", "Eysines", "Blanquefort", 
    "Saint-Médard-en-Jalles", "Le Haillan", "Cenon", "Floirac", "Lormont"
  ]
};

/**
 * Moteur de recherche sémantique avec double aiguillage strict :
 * - Question sur Unipros / problème de paiement / URSSAF / inconnu Unipros -> Contacts UNIPROS
 * - Question sur un jardin en particulier / devis / taille / tonte -> Contacts PINO
 */
window.resolveChatbotQuery = function(userText) {
  const q = (userText || "").toLowerCase().trim();
  const kb = window.PINO_CHATBOT_KB;

  // ─────────────────────────────────────────────────────────────
  // A. QUESTIONS RELATIVES À UNIPROS & PAIEMENT
  // ─────────────────────────────────────────────────────────────

  // 1. Problème ou incident de paiement Unipros / Rejet / Question spécifique non résolue
  if (
    (q.includes("unipros") || q.includes("unispro") || q.includes("unipro") || q.includes("paiement") || q.includes("payer") || q.includes("facture") || q.includes("urssaf")) &&
    (q.includes("probleme") || q.includes("problème") || q.includes("litige") || q.includes("rejet") || q.includes("bloqu") || q.includes("inconvenient") || q.includes("inconvénient") || q.includes("contestation") || q.includes("erreur") || q.includes("echec") || q.includes("échec"))
  ) {
    return `
      <div class="space-y-2">
        <p class="font-bold text-emerald-800 flex items-center gap-1.5">
          <i class="fa-solid fa-triangle-exclamation text-amber-500 text-base"></i>
          Résolution de Problème de Paiement Unipros
        </p>
        <p class="text-xs text-slate-700 leading-relaxed">
          Pour tout incident de paiement (rejet de prélèvement, compte URSSAF bloqué ou problème de facture), voici la démarche directe :
        </p>
        
        <div class="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1.5">
          <p class="font-bold text-emerald-900">1. Andrés Pino intervient en priorité pour vous :</p>
          <p class="text-slate-700">En tant qu'artisan adhérent, Andrés dispose d'un contact direct avec son gestionnaire de compte Unipros pour débloquer votre dossier :</p>
          <div class="flex flex-wrap gap-2 pt-1">
            <a href="${kb.pino.phoneUrl}" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs shadow-sm">
              <i class="fa-solid fa-phone"></i> ${kb.pino.phoneFormatted}
            </a>
            <a href="${kb.pino.emailUrl}" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-bold text-xs shadow-sm">
              <i class="fa-solid fa-envelope"></i> E-mail Pino
            </a>
          </div>
        </div>

        <div class="p-2.5 bg-slate-100 rounded-xl border border-slate-200 text-xs space-y-1.5">
          <p class="font-bold text-slate-800">2. Ou contactez le Support Officiel Unipros :</p>
          <p class="text-slate-700 font-semibold">• Tél vert gratuit : <a href="${kb.unipros.contacts.phoneUrl}" class="text-emerald-700 underline font-bold">${kb.unipros.contacts.phone}</a> (${kb.unipros.contacts.hours})</p>
          <p class="text-slate-700 font-semibold">• E-mail : <a href="mailto:${kb.unipros.contacts.email}" class="text-emerald-700 underline font-bold">${kb.unipros.contacts.email}</a></p>
          <p class="text-slate-700 font-semibold">• Espace personnel : <a href="${kb.unipros.contacts.clientApp}" target="_blank" class="text-emerald-700 underline font-bold">${kb.unipros.contacts.clientApp}</a></p>
        </div>
      </div>
    `;
  }

  // 2. Inscription & Fonctionnement de l'Avance Immédiate URSSAF
  if (
    (q.includes("avance immediate") || q.includes("avance immédiate") || q.includes("inscri") || q.includes("comment marche") || q.includes("comment fonctionne")) &&
    (q.includes("unipros") || q.includes("unispro") || q.includes("urssaf") || q.includes("impot") || q.includes("impôt") || q.includes("credit") || q.includes("crédit"))
  ) {
    return `
      <div class="space-y-2">
        <p class="font-bold text-emerald-800 flex items-center gap-1.5">
          <i class="fa-solid fa-bolt text-base text-emerald-600"></i>
          Procédure d'Activation de l'Avance Immédiate (URSSAF)
        </p>
        <p class="text-xs text-slate-700 leading-relaxed">
          L'Avance Immédiate est un service <strong>gratuit et optionnel</strong> qui permet de ne payer que 50% de sa facture dès le règlement :
        </p>
        <ol class="text-xs text-slate-700 space-y-1 list-decimal list-inside bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
          <li>Unipros crée votre demande auprès de l'URSSAF avec vos coordonnées.</li>
          <li>Sous <strong>48h max</strong>, vous recevez un mail de l'URSSAF intitulé <em>« ne pas répondre »</em> (vérifiez vos spams !).</li>
          <li>Vous créez votre mot de passe et activez votre compte URSSAF.</li>
          <li>Vous validez le mandat de prélèvement SEPA.</li>
          <li>À chaque facture, l'URSSAF ne prélève que les <strong>50% de reste à charge</strong>.</li>
        </ol>
        <p class="text-[11px] text-slate-600">
          📞 Assistance inscription Unipros : <a href="${kb.unipros.contacts.phoneUrl}" class="text-emerald-700 font-bold underline">${kb.unipros.contacts.phone}</a> (gratuit, 8h-20h).
        </p>
      </div>
    `;
  }

  // 3. Moyens de paiement chez Unipros (CB, Chèque, CESU, Espèces)
  if (
    q.includes("moyen de paiement") || q.includes("moyens de paiement") || q.includes("comment payer") || 
    q.includes("carte") || q.includes("cb") || q.includes("cesu") || q.includes("cheque") || 
    q.includes("chèque") || q.includes("espece") || q.includes("espèce") || q.includes("especes") || q.includes("espèces") || q.includes("liquide")
  ) {
    return `
      <div class="space-y-2">
        <p class="font-bold text-emerald-800 flex items-center gap-1.5">
          <i class="fa-solid fa-credit-card text-base text-emerald-600"></i>
          Modes de Paiement Acceptés par Unipros
        </p>
        <div class="text-xs text-slate-700 space-y-1.5">
          <p>• <strong>Avance Immédiate :</strong> Prélèvement automatique direct des 50% restants.</p>
          <p>• <strong>Carte Bancaire (CB) :</strong> En ligne sur le portail sécurisé <a href="${kb.unipros.contacts.paymentPortal}" target="_blank" class="text-emerald-700 underline font-bold">paiement.unipros.coop</a>.</p>
          <p>• <strong>Virement bancaire :</strong> Vers le RIB Unipros (indiquer obligatoirement le n° de facture en intitulé).</p>
          <p>• <strong>Chèque bancaire :</strong> À l'ordre impératif d'<strong>UNIPROS</strong>.</p>
          <p>• <strong>Titres CESU & e-CESU :</strong> Acceptés (Edenred, Chèque Domicile, Sodexo/Pluxee, Up) jusqu'à 2 540 €/an. Possibilité de panachage (CESU + CB).</p>
        </div>
        <div class="p-2 bg-red-50 rounded-xl border border-red-200 text-xs text-red-800 font-semibold">
          ⚠️ Attention : Les règlements en espèces sont strictement interdits par la loi dans le cadre des Services à la Personne.
        </div>
      </div>
    `;
  }

  // 4. Attestation Fiscale / Case 7DB / Déclaration d'impôts
  if (q.includes("attestation") || q.includes("7db") || q.includes("case") || q.includes("declaration") || q.includes("déclaration") || q.includes("justificatif") || q.includes("impots") || q.includes("impôts")) {
    return `
      <div class="space-y-2">
        <p class="font-bold text-emerald-800 flex items-center gap-1.5">
          <i class="fa-solid fa-file-invoice text-base text-emerald-600"></i>
          Attestation Fiscale & Déclaration de Revenus
        </p>
        <ul class="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
          <li><strong>Délivrance :</strong> Votre attestation fiscale est émise chaque début d'année (courant janvier) pour toutes les factures réglées l'année précédente.</li>
          <li><strong>Où la trouver ?</strong> Téléchargeable en ligne sur votre espace client Unipros : <a href="${kb.unipros.contacts.clientApp}" target="_blank" class="text-emerald-700 underline font-bold">app.unipros.coop</a>.</li>
          <li><strong>Déclaration de revenus :</strong> Reportez le montant certifié en <strong>Case 7DB</strong> de votre déclaration n° 2042.</li>
          <li>Si vous avez utilisé l'Avance Immédiate, les montants sont automatiquement pré-remplis par le fisc.</li>
        </ul>
        <p class="text-[11px] text-slate-500">
          En cas d'attestation manquante, contactez Unipros au <a href="${kb.unipros.contacts.phoneUrl}" class="text-emerald-700 font-bold underline">${kb.unipros.contacts.phone}</a>.
        </p>
      </div>
    `;
  }

  // 5. Résidence secondaire & Terrain nu
  if (q.includes("secondaire") || q.includes("terrain nu") || q.includes("terrain")) {
    return `
      <div class="space-y-2">
        <p class="font-bold text-emerald-800 flex items-center gap-1.5">
          <i class="fa-solid fa-house-chimney text-base text-emerald-600"></i>
          Éligibilité : Résidence Secondaire & Terrains
        </p>
        <div class="text-xs text-slate-700 space-y-2">
          <p>✅ <strong>Résidence secondaire :</strong> OUI ! Vous bénéficiez des 50% de crédit d'impôt Unipros pour l'entretien d'une résidence secondaire située en France, que vous soyez propriétaire ou locataire.</p>
          <p>❌ <strong>Terrain nu :</strong> NON. Le dispositif des Services à la Personne exige que les travaux soient rattachés à un lieu de résidence. Un terrain nu sans logement n'ouvre pas droit au crédit d'impôt.</p>
        </div>
      </div>
    `;
  }

  // 6. Présentation générale d'Unipros & Crédit d'impôt 50%
  if (
    q.includes("50%") || q.includes("credit d'impot") || q.includes("crédit d'impôt") || q.includes("avantage fiscal") ||
    ((q.includes("unipros") || q.includes("unispro") || q.includes("unipro")) && (q.includes("c'est quoi") || q.includes("qui est") || q.includes("qu'est") || q.includes("presentation") || q.includes("présentation") || q.includes("partenaire") || q.includes("cooperative") || q.includes("coopérative")))
  ) {
    return `
      <div class="space-y-2">
        <p class="font-bold text-emerald-800 flex items-center gap-1.5">
          <i class="fa-solid fa-shield-halved text-base text-emerald-600"></i>
          Avantage Fiscal Unipros : 50% de Crédit d'Impôt Immédiat
        </p>
        <p class="text-xs text-slate-700 leading-relaxed">
          Pino Espaces Verts est membre de la coopérative agréée <strong>Unipros</strong> (<a href="${kb.unipros.contacts.website}" target="_blank" class="text-emerald-700 underline font-bold">unipros.coop</a>).
        </p>
        <div class="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1">
          <p class="font-bold text-emerald-900">• Déduction immédiate :</p>
          <p class="text-slate-700">Vous ne payez que 50% du montant de votre facture de jardinage. Les 50% restants sont réglés par l'État via l'URSSAF.</p>
          <p class="font-bold text-emerald-900 mt-1">• Plafond annuel jardinage :</p>
          <p class="text-slate-700">Jusqu'à <strong>5 000 € TTC par an et par foyer</strong> (soit 2 500 € d'économie réelle).</p>
        </div>
        <div class="text-xs text-slate-600 space-y-0.5">
          <p>📞 <strong>Support Unipros :</strong> ${kb.unipros.contacts.phone} (Lun-Sam 8h-20h)</p>
          <p>✉️ <strong>E-mail Unipros :</strong> ${kb.unipros.contacts.email}</p>
        </div>
      </div>
    `;
  }

  // ─────────────────────────────────────────────────────────────
  // B. COUPON PROMO -20% (Redirection vers le formulaire e-mail)
  // ─────────────────────────────────────────────────────────────
  if (q.includes("pelabola") || q.includes("promo") || q.includes("code") || q.includes("coupon") || q.includes("remise") || q.includes("reduction") || q.includes("réduction") || q.includes("20%")) {
    return `
      <div class="space-y-2.5">
        <p class="font-bold text-emerald-800 flex items-center gap-1.5">
          <i class="fa-solid fa-gift text-base text-emerald-600"></i>
          Coupon de Réduction Exclusif : -20% !
        </p>
        <p class="text-xs text-slate-700 leading-relaxed">
          Bénéficiez d'une <strong>remise immédiate de -20%</strong> sur votre première prestation de jardinage (tonte, taille de haies, débroussaillage).
        </p>
        
        <div class="p-3 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-2xl border-2 border-dashed border-emerald-400 text-center space-y-1">
          <span class="text-xs uppercase font-extrabold text-emerald-900 tracking-wider block">🎉 Bon de Réduction Immédiat</span>
          <span class="text-2xl font-black text-emerald-800 tracking-tight block">-20% DE REMISE</span>
          <span class="text-[11px] text-emerald-700 font-semibold block">100% cumulable avec les 50% de crédit d'impôt Unipros !</span>
        </div>

        <p class="text-[11px] text-slate-600 italic">
          Pour débloquer votre code promotionnel officiel et vérifié, connectez-vous simplement avec votre compte Google dans la section dédiée :
        </p>

        <div class="pt-1">
          <button onclick="if(window.goToCouponSection) window.goToCouponSection();" class="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer">
            <i class="fa-solid fa-shield-halved"></i> Obtenir mon code unique (-20%)
          </button>
        </div>
      </div>
    `;
  }

  // ─────────────────────────────────────────────────────────────
  // C. QUESTIONS RELATIVES À UN JARDIN SPÉCIFIQUE (Aiguillage PINO)
  // ─────────────────────────────────────────────────────────────

  // 1. Tonte de pelouse
  if (q.includes("tonte") || q.includes("pelouse") || q.includes("gazon") || q.includes("tendre") || q.includes("herbe")) {
    return `
      <div class="space-y-2">
        <p class="font-bold text-emerald-800 flex items-center gap-1.5">
          <i class="fa-solid fa-leaf text-base text-emerald-600"></i>
          Tonte de Pelouse pour Votre Jardin
        </p>
        <p class="text-xs text-slate-700 leading-relaxed">
          ${kb.services[0].details}
        </p>
        <div class="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1">
          <p>• Tarif indicatif : à partir de <strong>${kb.services[0].priceFrom}</strong></p>
          <p class="text-emerald-700 font-extrabold">• Soit <strong>${kb.services[0].creditPrice}</strong></p>
        </div>
        <div class="p-2.5 bg-slate-100 rounded-xl border border-slate-200 text-xs space-y-1">
          <p class="font-bold text-slate-800">🌲 Pour un chiffrage de votre jardin :</p>
          <p class="text-slate-600">Contactez directement Andrés Pino :</p>
          <div class="flex flex-wrap gap-2 pt-0.5">
            <a href="${kb.pino.phoneUrl}" class="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-xs shadow-sm">
              <i class="fa-solid fa-phone"></i> ${kb.pino.phoneFormatted}
            </a>
            <a href="${kb.pino.whatsappUrl}" target="_blank" class="inline-flex items-center gap-1 px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-xs shadow-sm">
              <i class="fa-brands fa-whatsapp"></i> WhatsApp
            </a>
            <a href="${kb.pino.emailUrl}" class="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded font-bold text-xs shadow-sm">
              <i class="fa-solid fa-envelope"></i> E-mail
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // 2. Taille de haie, arbustes, arbres
  if (q.includes("haie") || q.includes("taille") || q.includes("arbuste") || q.includes("arbres") || q.includes("arbre") || q.includes("rosier") || q.includes("laurier") || q.includes("élagage") || q.includes("elagage")) {
    return `
      <div class="space-y-2">
        <p class="font-bold text-emerald-800 flex items-center gap-1.5">
          <i class="fa-solid fa-scissors text-base text-emerald-600"></i>
          Taille de Haies & Végétaux de Votre Jardin
        </p>
        <p class="text-xs text-slate-700 leading-relaxed">
          ${kb.services[1].details}
        </p>
        <div class="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1">
          <p>• Tarif indicatif : à partir de <strong>${kb.services[1].priceFrom}</strong></p>
          <p class="text-emerald-700 font-extrabold">• Soit <strong>${kb.services[1].creditPrice}</strong></p>
        </div>
        <div class="p-2.5 bg-slate-100 rounded-xl border border-slate-200 text-xs space-y-1">
          <p class="font-bold text-slate-800">🌲 Estimation pour votre jardin :</p>
          <p class="text-slate-600">Envoyez la longueur de votre haie ou une photo à Andrés Pino :</p>
          <div class="flex flex-wrap gap-2 pt-0.5">
            <a href="${kb.pino.phoneUrl}" class="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-xs shadow-sm">
              <i class="fa-solid fa-phone"></i> ${kb.pino.phoneFormatted}
            </a>
            <a href="${kb.pino.whatsappUrl}" target="_blank" class="inline-flex items-center gap-1 px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-xs shadow-sm">
              <i class="fa-brands fa-whatsapp"></i> WhatsApp
            </a>
            <a href="${kb.pino.emailUrl}" class="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded font-bold text-xs shadow-sm">
              <i class="fa-solid fa-envelope"></i> E-mail
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // 3. Débroussaillage / Nettoyage / Friches
  if (q.includes("debroussaill") || q.includes("friche") || q.includes("nettoyage") || q.includes("ronce") || q.includes("évacuation") || q.includes("dechet")) {
    return `
      <div class="space-y-2">
        <p class="font-bold text-emerald-800 flex items-center gap-1.5">
          <i class="fa-solid fa-tractor text-base text-emerald-600"></i>
          Débroussaillage & Remise en État de Votre Terrain
        </p>
        <p class="text-xs text-slate-700 leading-relaxed">
          ${kb.services[2].details}
        </p>
        <div class="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1">
          <p>• Tarif indicatif : dès <strong>${kb.services[2].priceFrom}</strong> (soit <strong>${kb.services[2].creditPrice}</strong>)</p>
        </div>
        <div class="p-2.5 bg-slate-100 rounded-xl border border-slate-200 text-xs space-y-1">
          <p class="font-bold text-slate-800">🌲 Visite technique gratuite sur votre terrain :</p>
          <div class="flex flex-wrap gap-2 pt-0.5">
            <a href="${kb.pino.phoneUrl}" class="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-xs shadow-sm">
              <i class="fa-solid fa-phone"></i> ${kb.pino.phoneFormatted}
            </a>
            <a href="${kb.pino.whatsappUrl}" target="_blank" class="inline-flex items-center gap-1 px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-xs shadow-sm">
              <i class="fa-brands fa-whatsapp"></i> WhatsApp
            </a>
            <a href="${kb.pino.emailUrl}" class="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded font-bold text-xs shadow-sm">
              <i class="fa-solid fa-envelope"></i> E-mail
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // 4. Aménagement, plantation, création paysagère
  if (q.includes("amenagement") || q.includes("aménagement") || q.includes("creation") || q.includes("création") || q.includes("massif") || q.includes("piscine") || q.includes("plantation")) {
    return `
      <div class="space-y-2">
        <p class="font-bold text-emerald-800 flex items-center gap-1.5">
          <i class="fa-solid fa-tree text-base text-emerald-600"></i>
          Aménagement Paysager & Massifs
        </p>
        <p class="text-xs text-slate-700 leading-relaxed">
          ${kb.services[3].details}
        </p>
        <div class="p-2.5 bg-slate-100 rounded-xl border border-slate-200 text-xs space-y-1">
          <p class="font-bold text-slate-800">🌲 Étude de projet de jardin avec Andrés Pino :</p>
          <p class="text-slate-600">Discutez de vos envies ou convenez d'un rendez-vous sur place :</p>
          <div class="flex flex-wrap gap-2 pt-0.5">
            <a href="${kb.pino.phoneUrl}" class="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-xs shadow-sm">
              <i class="fa-solid fa-phone"></i> ${kb.pino.phoneFormatted}
            </a>
            <a href="${kb.pino.whatsappUrl}" target="_blank" class="inline-flex items-center gap-1 px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-xs shadow-sm">
              <i class="fa-brands fa-whatsapp"></i> WhatsApp
            </a>
            <a href="${kb.pino.emailUrl}" class="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded font-bold text-xs shadow-sm">
              <i class="fa-solid fa-envelope"></i> E-mail
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // 5. Devis gratuit ou question sur les tarifs d'un jardin
  if (q.includes("devis") || q.includes("prix") || q.includes("tarif") || q.includes("cout") || q.includes("coût") || q.includes("combien") || q.includes("chiffrage")) {
    return `
      <div class="space-y-2">
        <p class="font-bold text-emerald-800 flex items-center gap-1.5">
          <i class="fa-solid fa-file-invoice-dollar text-base text-emerald-600"></i>
          Devis Gratuit pour Votre Jardin sous 24h
        </p>
        <p class="text-xs text-slate-700 leading-relaxed">
          Le devis et le déplacement d'Andrés Pino sont <strong>100% gratuits et sans engagement</strong>.
        </p>
        <div class="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1.5">
          <p class="font-bold text-emerald-900">🌲 Contacter Andrés Pino pour votre jardin :</p>
          <p class="text-slate-700">• WhatsApp (le plus rapide pour envoyer des photos) : <a href="${kb.pino.whatsappUrl}" target="_blank" class="font-bold text-emerald-800 underline">${kb.pino.phoneFormatted}</a></p>
          <p class="text-slate-700">• Téléphone : <a href="${kb.pino.phoneUrl}" class="font-bold text-emerald-800 underline">${kb.pino.phone}</a></p>
          <p class="text-slate-700">• E-mail : <a href="${kb.pino.emailUrl}" class="font-bold text-emerald-800 underline">${kb.pino.email}</a></p>
        </div>
        <div class="pt-1">
          <a href="#devis" class="inline-block w-full text-center py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow transition-colors">
            Remplir le formulaire de devis en ligne
          </a>
        </div>
      </div>
    `;
  }

  // 6. Zone d'intervention
  if (/\b(zone|secteur|secteurs|villes?|communes?|quartiers?|déplacement|deplacement|bordeaux|merignac|mérignac|pessac|talence|cauderan|caudéran|gradignan|gironde|bègles|begles|villenave|bouscat|bruges|eysines|floirac|cenon|lormont)\b/i.test(q) || /\b(o[uù] (êtes|vous|intervenez|travaillez))\b/i.test(q)) {
    return `
      <div class="space-y-2">
        <p class="font-bold text-emerald-800 flex items-center gap-1.5">
          <i class="fa-solid fa-map-location-dot text-base text-emerald-600"></i>
          Zone d'Intervention : Bordeaux Métropole & Gironde
        </p>
        <p class="text-xs text-slate-700 leading-relaxed">
          Pino Espaces Verts se déplace gratuitement sur <strong>Bordeaux et toute sa périphérie</strong> :
        </p>
        <div class="p-2 bg-slate-100 rounded-xl text-[11px] text-slate-700 leading-relaxed">
          ${kb.localities.join(" • ")}
        </div>
        <p class="text-xs font-bold text-emerald-800">
          ✅ Déplacement et devis 100% GRATUITS sans frais kilométriques !
        </p>
      </div>
    `;
  }

  // ─────────────────────────────────────────────────────────────
  // D. PROTOCOLE D'AIGUILLAGE STRICT (RÈGLES AUDIO)
  // ─────────────────────────────────────────────────────────────

  // D1 : Si la recherche concerne Unipros mais n'a pas pu être résolue -> Aiguillage STRICT Unipros
  if (q.includes("unipros") || q.includes("unispro") || q.includes("unipro") || q.includes("urssaf") || q.includes("fiscal") || q.includes("impot") || q.includes("impôt") || q.includes("paiement")) {
    return `
      <div class="space-y-2.5">
        <p class="font-bold text-slate-800 flex items-center gap-1.5">
          <i class="fa-solid fa-building-columns text-base text-emerald-700"></i>
          Support Officiel Coopérative Unipros
        </p>
        <p class="text-xs text-slate-700 leading-relaxed">
          Pour cette demande administrative, fiscale ou bancaire spécifique liée à la coopérative <strong>Unipros</strong>, veuillez joindre directement le service client :
        </p>
        <div class="p-2.5 bg-slate-100 rounded-xl border border-slate-200 text-xs space-y-1.5">
          <p class="font-bold text-slate-800">📞 Contact Direct Support Unipros :</p>
          <p class="text-slate-700 font-semibold">• Téléphone gratuit : <a href="${kb.unipros.contacts.phoneUrl}" class="text-emerald-700 font-bold underline">${kb.unipros.contacts.phone}</a></p>
          <p class="text-slate-500 text-[10px]">Ouvert du lundi au samedi de 8h00 à 20h00</p>
          <p class="text-slate-700 font-semibold">• E-mail : <a href="mailto:${kb.unipros.contacts.email}" class="text-emerald-700 font-bold underline">${kb.unipros.contacts.email}</a></p>
          <p class="text-slate-700 font-semibold">• Espace personnel : <a href="${kb.unipros.contacts.clientApp}" target="_blank" class="text-emerald-700 font-bold underline">${kb.unipros.contacts.clientApp}</a></p>
          <p class="text-slate-700 font-semibold">• Site officiel : <a href="${kb.unipros.contacts.website}" target="_blank" class="text-emerald-700 font-bold underline">${kb.unipros.contacts.website}</a></p>
        </div>
      </div>
    `;
  }

  // D2 : Question spécifique sur un jardin ou demande générale d'artisanat -> Aiguillage STRICT Andrés Pino
  return `
    <div class="space-y-2.5">
      <p class="font-bold text-slate-800 flex items-center gap-1.5">
        <i class="fa-solid fa-user-tie text-base text-emerald-700"></i>
        Demande pour Votre Jardin avec Andrés Pino
      </p>
      <p class="text-xs text-slate-700 leading-relaxed">
        Pour toute question spécifique sur vos extérieurs, une visite technique sur place ou une demande de devis personnalisé, contactez directement <strong>Andrés Pino</strong> :
      </p>
      <div class="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-2">
        <p class="font-bold text-emerald-900">🌲 Coordonnées Directes de l'Artisan :</p>
        <div class="flex flex-wrap gap-2">
          <a href="${kb.pino.phoneUrl}" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs shadow-sm">
            <i class="fa-solid fa-phone"></i> ${kb.pino.phoneFormatted}
          </a>
          <a href="${kb.pino.whatsappUrl}" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-xs shadow-sm">
            <i class="fa-brands fa-whatsapp"></i> WhatsApp
          </a>
          <a href="${kb.pino.emailUrl}" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-bold text-xs shadow-sm">
            <i class="fa-solid fa-envelope"></i> ${kb.pino.email}
          </a>
        </div>
      </div>
      <p class="text-[11px] text-slate-500">
        Disponibilité : ${kb.pino.hours}. Déplacement et chiffrage 100% gratuits sur Bordeaux et Gironde.
      </p>
    </div>
  `;
};
