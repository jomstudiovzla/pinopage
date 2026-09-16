/**
 * Pino Espaces Verts — Configuration Firebase
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

window.initPinoFirebase = () => {
  if (typeof firebase === 'undefined') {
    console.warn('[pino-firebase] Firebase SDK non chargé.');
    return false;
  }
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(window.PINO_FIREBASE_CONFIG);
      console.log('[pino-firebase] Connecté avec succès à pagepino-e8e97 (europe-west1).');
    }
    window.pinoAuth = firebase.auth();
    window.pinoRtdb = firebase.database();

    // Persistance adaptée aux navigateurs avec ITP / Safari / Navigation privée
    if (window.pinoAuth && typeof window.pinoAuth.setPersistence === 'function') {
      window.pinoAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .catch(() => {
          return window.pinoAuth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
        })
        .catch(() => {
          return window.pinoAuth.setPersistence(firebase.auth.Auth.Persistence.NONE);
        })
        .catch((e) => {
          console.warn('[pino-firebase] Note persistance:', e);
        });
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
