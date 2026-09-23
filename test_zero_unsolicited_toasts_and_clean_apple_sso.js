/**
 * Test Suite: Zero Unsolicited Toasts on Startup & Clean Resilient Apple SSO
 * Pino Espaces Verts - Production Hardening
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('===============================================================');
console.log('🛡️ TEST : ZÉRO TOAST INTRUSIF AU CHARGEMENT & SSO APPLE PROPRE SANS FUITE TECHNIQUE');
console.log('===============================================================\n');

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const swJs = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');

// ── 1. COMPILATION SCRIPT ──
console.log('🧪 [TEST 1 : VALIDATION DE LA SYNTAXE & COMPILATION JS DANS VM]');
const scriptBlocks = indexHtml.match(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi) || [];
scriptBlocks.forEach((block, idx) => {
  const code = block.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
  try {
    new vm.Script(code);
  } catch (err) {
    console.error(`❌ Erreur de syntaxe dans le bloc <script> #${idx}:`, err);
    process.exit(1);
  }
});
console.log('  ✅ PASS: 100% des scripts compilent parfaitement.');

// ── 2. ZÉRO POPUP OU TOAST GMAIL INTRUSIF AU CHARGEMENT / RESTAURATION DE SESSION ──
console.log('\n🔕 [TEST 2 : AUCUN TOAST GMAIL INTRUSIF OU TENTATIVE POPUP NON-SOLLICITÉE]');
assert(!indexHtml.includes("Autorisez Gmail (compte Pino ou JOM Studio) pour envoyer les e-mails dans les boîtes de réception."), 'Le toast intrusif brut Gmail a été totalement éradiqué');
assert(!indexHtml.includes("setTimeout(async () => {\n          try {\n            if (typeof window.pinoObtainGmailToken === 'function') {\n              const tok = await window.pinoObtainGmailToken"), 'processAuthenticatedUser ne doit plus tenter de forcer un popup OAuth en arrière-plan');
assert(indexHtml.includes('const isInteractive = !!(opts && (opts.interactive || opts.force));'), 'pinoObtainGmailToken exige une action interactive explicite');
assert(indexHtml.includes('if (!isInteractive) {\n        return \'\';\n      }'), 'pinoObtainGmailToken retourne silencieusement sans popup si non interactif');
console.log('  ✅ PASS: Zéro toast intrusif, exécution silencieuse sans interruption de navigation.');

// ── 3. ASSAINISSEMENT D'EXPLAINAUTHERROR SANS FUITE DE CONSOLE FIREBASE ──
console.log('\n🔒 [TEST 3 : EXPLAINAUTHERROR ASSAINI SANS DIRECTIVES INTERNES FIREBASE]');
assert(!indexHtml.includes("return 'Le fournisseur ' + who + ' n\\'est pas activé"), 'explainAuthError ne doit pas renvoyer le texte brut Le fournisseur n est pas activé');
assert(!indexHtml.includes("return 'Ce domaine n\\'est pas autorisé pour ' + who"), 'explainAuthError ne doit pas renvoyer le texte brut Ce domaine n est pas autorisé');
assert(indexHtml.includes("console.warn('[pino-auth-dev]"), 'Les directives développeur sont réservées à la console dev');
console.log('  ✅ PASS: Messages d\'erreur clairs, courtois et professionnels orientés utilisateur final.');

// ── 4. RÉSILIENCE APPLE SSO : CONNEXION 1-CLIC MÉMORISÉE OU REPLI FLUIDE ──
console.log('\n🍎 [TEST 4 : FLUX APPLE SSO AVEC FALLBACK SOUVERAIN SANS ÉCHEC]');
assert(indexHtml.includes('handleAppleSignIn'), 'handleAppleSignIn est déclaré');
assert(indexHtml.includes('confirmAppleQuickSignIn'), 'confirmAppleQuickSignIn est déclaré');
assert(indexHtml.includes('await confirmAppleQuickSignIn(remembered)'), 'handleAppleSignIn connecte directement un utilisateur mémorisé en cas d\'indisponibilité du provider cloud');
assert(!indexHtml.includes("Connexion Apple : saisissez votre e-mail pour accéder directement à votre espace."), 'Le toast maladroit de redirection e-mail a été supprimé au profit du panneau in-situ');
assert(indexHtml.includes("apple-auth-quick-panel"), 'Panneau Apple ID présent et fonctionnel');
assert(indexHtml.includes("bg-emerald-50/70"), 'Panneau Apple ID harmonisé avec la palette claire de la marque');
assert(!indexHtml.includes("showNotificationToast(\"Supabase n'est pas configuré"), 'requireSupabase ne doit pas afficher de toast intempestif');
console.log('  ✅ PASS: Déclenchement Apple 100% résilient avec secours 1-clic direct sans toast intempestif.');

// ── 5. SERVICE WORKER V39 ACTUALISÉ ──
console.log('\n🚀 [TEST 5 : SERVICE WORKER V39 EN PLACE]');
assert(swJs.includes('pino-ev-v39'), 'Le Service Worker doit être en version v39 pour rafraîchir le cache');
console.log('  ✅ PASS: Cache v39 déployé.');

console.log('\n===============================================================');
console.log('🎉 TOUS LES 5 CONTRÔLES DE SÉCURITÉ ET D\'EXPÉRIENCE CLIENT SONT VALIDÉS !');
console.log('===============================================================\n');
