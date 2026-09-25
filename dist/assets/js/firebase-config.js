/**
 * Pino Espaces Verts — Configuration Firebase Production
 * Projet : pagepino-e8e97
 * Realtime Database : https://pagepino-e8e97-default-rtdb.europe-west1.firebasedatabase.app
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

window.PINO_FLAGS = Object.assign({ appleLogin: false }, window.PINO_FLAGS || {});

window.PINO_PUBLIC_URL = "https://www.pinoespacesverts.fr/";
window.pinoSiteUrl = () => window.PINO_PUBLIC_URL;

(function computeSiteUrl() {
  const { protocol, origin, pathname } = window.location;
  if (protocol === "file:") {
    window.PINO_SITE_URL = "";
    return;
  }
  const dir = pathname.replace(/[^/]*$/, "");
  window.PINO_SITE_URL = origin + dir;
})();

window.PINO_USE_EMULATOR = false;

window.initPinoFirebase = () => {
  if (typeof firebase === 'undefined') {
    console.warn('[pino-firebase] Firebase SDK non chargé.');
    return false;
  }
  try {
    const cfg = Object.assign({}, window.PINO_FIREBASE_CONFIG);
    if (!firebase.apps.length) {
      firebase.initializeApp(cfg);
    }
    window.pinoAuth = firebase.auth();
    window.pinoRtdb = firebase.database();

    if (window.pinoAuth && typeof window.pinoAuth.setPersistence === 'function') {
      window.pinoAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .catch((err) => console.warn('[pino-auth] Persistance LOCAL indisponible:', err));
    }
    return true;
  } catch (err) {
    console.error('[pino-firebase] Échec initialisation:', err);
    return false;
  }
};
