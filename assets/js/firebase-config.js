/**
 * Pino Espaces Verts — Configuration Firebase (source unique d'auth + données en v1)
 * Projet : pagepino-e8e97
 * Realtime Database : https://pagepino-e8e97-default-rtdb.europe-west1.firebasedatabase.app
 *
 * La clé apiKey est publique par conception (identifie le projet) ; la sécurité repose
 * sur Firebase Auth + database.rules.json. Ne jamais mettre de clé serveur ici.
 */

window.PINO_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCOrSsb3dMl-tYr9y23zCPaDu63cRn7l-k",
  authDomain: "pagepino-e8e97.firebaseapp.com",
  databaseURL: "https://pagepino-e8e97-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "pagepino-e8e97",
  storageBucket: "pagepino-e8e97.firebasestorage.app",
  messagingSenderId: "102396108475",
  appId: "1:102396108475:web:070dcbdf881bd2b10c139e"
};

/**
 * Drapeaux de fonctionnalités (v1 statique : modifier ici puis redéployer).
 * appleLogin : n'activer qu'après configuration du fournisseur « apple.com » dans
 * Firebase → Authentication → Sign-in method (Apple Developer Program requis).
 */
window.PINO_FLAGS = Object.assign({ appleLogin: false }, window.PINO_FLAGS || {});

/**
 * URL publique officielle utilisée dans les e-mails et notifications.
 * ► À changer ICI (une seule ligne) le jour où le domaine définitif est branché.
 */
window.PINO_PUBLIC_URL = "https://jomstudiovzla.github.io/pinopage/";
window.pinoSiteUrl = () => window.PINO_PUBLIC_URL;

/**
 * URL du site courant (domaine réellement visité) : retour des liens Firebase
 * de vérification / réinitialisation. Le domaine doit figurer dans Firebase → Authentication → Authorized domains.
 */
(function computeSiteUrl() {
  const { protocol, origin, pathname } = window.location;
  if (protocol === "file:") {
    window.PINO_SITE_URL = "";
    return;
  }
  const dir = pathname.replace(/[^/]*$/, "");
  window.PINO_SITE_URL = origin + dir;
})();

/**
 * Émulateurs Firebase (tests E2E et développement uniquement).
 * Actifs seulement sur localhost/127.0.0.1 ET avec ?emulator=1 (mémorisé pour l'onglet).
 */
window.PINO_USE_EMULATOR = (function () {
  const host = window.location.hostname;
  if (host !== "localhost" && host !== "127.0.0.1") return false;
  try {
    if (new URLSearchParams(window.location.search).get("emulator") === "1") {
      sessionStorage.setItem("pino_emulator", "1");
    }
    return sessionStorage.getItem("pino_emulator") === "1";
  } catch (e) {
    return false;
  }
})();

window.initPinoFirebase = () => {
  if (typeof firebase === 'undefined') {
    console.warn('[pino-firebase] Firebase SDK non chargé.');
    return false;
  }
  try {
    const cfg = Object.assign({}, window.PINO_FIREBASE_CONFIG);
    if (window.PINO_USE_EMULATOR) {
      cfg.projectId = "demo-pino";
      cfg.databaseURL = "http://127.0.0.1:9000?ns=demo-pino-default-rtdb";
    }
    if (!firebase.apps.length) {
      firebase.initializeApp(cfg);
    }
    window.pinoAuth = firebase.auth();
    window.pinoRtdb = firebase.database();

    if (window.PINO_USE_EMULATOR) {
      window.pinoAuth.useEmulator("http://127.0.0.1:9099", { disableWarnings: true });
      window.pinoRtdb.useEmulator("127.0.0.1", 9000);
      console.info('[pino-firebase] Mode émulateur (tests).');
    }

    // Persistance adaptée aux navigateurs avec ITP / Safari / Navigation privée
    if (window.pinoAuth && typeof window.pinoAuth.setPersistence === 'function') {
      window.pinoAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .catch(() => window.pinoAuth.setPersistence(firebase.auth.Auth.Persistence.SESSION))
        .catch((e) => console.warn('[pino-firebase] Note persistance:', e));
    }

    return true;
  } catch (err) {
    console.error('[pino-firebase] Erreur d\'initialisation:', err);
    return false;
  }
};

if (typeof firebase !== 'undefined') {
  window.initPinoFirebase();
}

document.addEventListener('DOMContentLoaded', () => {
  const appleBtn = document.getElementById('apple-auth-btn');
  if (appleBtn && window.PINO_FLAGS.appleLogin === true) appleBtn.style.display = '';
});
