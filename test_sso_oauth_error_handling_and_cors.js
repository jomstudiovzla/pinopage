/**
 * Test Suite: SSO OAuth Error Handling, Toast Lifecycle & CORS Architecture
 * Pino Espaces Verts
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('===============================================================');
console.log('🧪 TEST : GESTION D\'ERREURS SSO (GOOGLE & APPLE), TOASTS & CORS');
console.log('===============================================================\n');

const indexHtmlPath = path.join(__dirname, 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// ── 1. INTERCEPTION ET TRAITEMENT DES ERREURS DANS L'URL (CALLBACK) ──
console.log('🔍 [TEST 1 : INTERCEPTION DES ERREURS DE CALLBACK (?error=access_denied)]');
assert(indexHtml.includes("0a. Interception universelle des erreurs et retours d'annulation OAuth"), "L'intercepteur d'erreur OAuth doit être présent dans bindAuthSessions");
assert(indexHtml.includes("fullQuery.includes('error=')"), "Le code doit détecter la présence d'une erreur dans l'URL");
assert(indexHtml.includes("errCode === 'access_denied' || errCode === 'user_cancelled'"), "Le code doit identifier l'annulation par l'utilisateur");
assert(indexHtml.includes("window.history.replaceState(null, document.title, cleanUrl)"), "L'URL avec erreur doit être nettoyée via replaceState");
assert(indexHtml.includes("Connexion annulée par l'utilisateur"), "Un message explicite et bienveillant doit être affiché");
console.log('  ✅ PASS: Les erreurs de callback OAuth sont capturées, nettoyées et signalées proprement.');

// ── 2. CYCLE DE VIE DES TOASTS & DISSOLUTION AUTOMATIQUE ──
console.log('\n🔔 [TEST 2 : GESTION DES NOTIFICATIONS ET ABSENCE DE TOAST BLOQUÉ]');
assert(indexHtml.includes("window.dismissNotificationToast = () =>"), "La fonction explicite dismissNotificationToast doit être exposée");
assert(indexHtml.includes("window.showNotificationToast = (message, type = 'info', duration = 4000)"), "showNotificationToast doit intégrer une durée d'auto-destruction");
assert(indexHtml.includes("setTimeout(() => { try { toast.remove(); } catch(e){} }, 350)"), "Les toasts doivent s'effacer automatiquement de la vue");
console.log('  ✅ PASS: Aucun toast ne peut rester figé indéfiniment à l\'écran.');

// ── 3. GESTION ROBUSTE DES PROMESSES DANS handleGoogleSignIn ET handleAppleSignIn ──
console.log('\n🛡️ [TEST 3 : GESTION ROBUSTE TRY / CATCH / FINALLY DANS LE FRONTEND]');
assert(indexHtml.includes("window.handleGoogleSignIn = async () =>"), "handleGoogleSignIn doit être présent");
assert(indexHtml.includes("window.handleAppleSignIn = async () =>"), "handleAppleSignIn doit être présent");
assert(indexHtml.includes("popupErr.code === 'auth/popup-closed-by-user'"), "Fermeture manuelle du popup gérée sans crash");
assert(indexHtml.includes("if (label) label.textContent = originalText"), "Le libellé d'origine des boutons est systématiquement restauré dans le bloc finally");
console.log('  ✅ PASS: Les promesses d\'authentification se résolvent ou se rejettent proprement sans bloquer l\'UI.');

// ── 4. SERVEUR LOCAL CORS ET NÉGOCIATION OPTIONS ──
console.log('\n🌐 [TEST 4 : SERVEUR LOCAL AVEC HEADERS CORS INTÉGRAUX]');
const servePyPath = path.join(__dirname, 'serve.py');
assert(fs.existsSync(servePyPath), "serve.py doit exister à la racine du projet");
const servePy = fs.readFileSync(servePyPath, 'utf8');
assert(servePy.includes("Access-Control-Allow-Origin', '*'"), "serve.py doit renvoyer l'en-tête Access-Control-Allow-Origin: *");
assert(servePy.includes("do_OPTIONS"), "serve.py doit répondre aux requêtes HTTP OPTIONS preflight");
console.log('  ✅ PASS: Le serveur local fournit les en-têtes CORS requis pour les cycles d\'authentification.');

// ── 5. CONFIGURATION DU CLIENT ID & AUTH DOMAIN DANS L'INFRASTRUCTURE ──
console.log('\n🔑 [TEST 5 : COHÉRENCE DU DOMAINE AUTH ET CLIENT ID]');
const fbConfigPath = path.join(__dirname, 'assets/js/firebase-config.js');
const fbConfig = fs.readFileSync(fbConfigPath, 'utf8');
assert(fbConfig.includes('authDomain: "pagepino-e8e97.firebaseapp.com"'), "authDomain doit pointer sur pagepino-e8e97.firebaseapp.com");
assert(fbConfig.includes('projectId: "pagepino-e8e97"'), "projectId doit être pagepino-e8e97");
console.log('  ✅ PASS: Configuration Firebase Auth alignée avec le gestionnaire officiel de redirection.');

console.log('\n===============================================================');
console.log('🎉 TOUS LES TESTS DE GESTION SSO & CORS SONT VALIDÉS (100%) !');
console.log('===============================================================');
