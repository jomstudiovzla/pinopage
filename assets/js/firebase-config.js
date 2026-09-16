/**
 * Pino Espaces Verts — Configuration Firebase
 * Projet : pagepino-e8e97
 * Realtime Database : https://pagepino-e8e97-default-rtdb.europe-west1.firebasedatabase.app
 */

window.PINO_FIREBASE_CONFIG = {
  apiKey: window.PINO_FIREBASE_API_KEY || "", // Se completa con la Web API Key de la consola Firebase
  authDomain: "pagepino-e8e97.firebaseapp.com",
  databaseURL: "https://pagepino-e8e97-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "pagepino-e8e97",
  storageBucket: "pagepino-e8e97.firebasestorage.app",
  messagingSenderId: "1032428929981",
  appId: window.PINO_FIREBASE_APP_ID || ""
};

// Función para inicializar Firebase de forma segura
window.initPinoFirebase = () => {
  if (typeof firebase === 'undefined') {
    console.warn('[pino-firebase] Firebase SDK no cargado aún.');
    return false;
  }
  try {
    if (!firebase.apps.length) {
      if (!window.PINO_FIREBASE_CONFIG.apiKey) {
        console.warn('[pino-firebase] apiKey pendiente en PINO_FIREBASE_CONFIG.');
      }
      firebase.initializeApp(window.PINO_FIREBASE_CONFIG);
      console.log('[pino-firebase] Inicializado con proyecto pagepino-e8e97.');
    }
    window.pinoAuth = firebase.auth();
    window.pinoRtdb = firebase.database();
    return true;
  } catch (err) {
    console.warn('[pino-firebase] Error al inicializar:', err);
    return false;
  }
};

if (typeof firebase !== 'undefined') {
  window.initPinoFirebase();
}
