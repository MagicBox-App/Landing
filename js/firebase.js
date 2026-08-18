/**
 * Inicialización de Firebase (SDK modular v10, vía CDN, sin build step).
 * Este es el único archivo con el config del proyecto — pégalo aquí
 * después de crear la Web App en la consola de Firebase.
 *
 * app.js, chatbot.js y admin.js son scripts clásicos (no módulos), así
 * que este módulo expone lo necesario en window para que puedan usarlo.
 *
 * MODO DEMO: Si las credenciales son placeholder, la app funciona
 * al 100% con datos locales (localStorage) para mostrar la interfaz
 * sin necesidad de un backend real.
 */

// TODO: reemplazar con el config real de tu Web App
// (Firebase Console → Configuración del proyecto → Tus apps → Config del SDK)
const firebaseConfig = {
  apiKey: 'TU_API_KEY',
  authDomain: 'TU_PROYECTO.firebaseapp.com',
  projectId: 'TU_PROYECTO',
  storageBucket: 'TU_PROYECTO.appspot.com',
  messagingSenderId: 'TU_SENDER_ID',
  appId: 'TU_APP_ID'
};

const isDemo = !firebaseConfig.apiKey || firebaseConfig.apiKey === 'TU_API_KEY';
window.DEMO_MODE = isDemo;

if (!isDemo) {
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js');
  const {
    getAuth,
    onAuthStateChanged,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    signOut
  } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js');
  const {
    getFirestore,
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager
  } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');

  const firebaseApp = initializeApp(firebaseConfig);
  const auth = getAuth(firebaseApp);

  let db;
  try {
    db = initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  } catch (e) {
    // Falla en navegación privada / navegadores sin soporte de IndexedDB:
    // seguimos funcionando online-only en vez de romper la app.
    console.warn('Persistencia offline no disponible, continuando solo en línea.', e);
    db = getFirestore(firebaseApp);
  }

  window.firebaseAuth = auth;
  window.firestoreDb = db;
  // Login por numero de telefono (SMS) en vez de correo/contrasena:
  // mas simple para una usuaria no tecnica — nada que recordar salvo su
  // propio numero, y el navegador recuerda la sesion despues del primer
  // ingreso (persistencia local por defecto del SDK).
  window.firebaseAuthFns = { onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber, signOut };
} else {
  console.info('%c🎉 MODO DEMO — Firebase no configurado, usando datos locales', 'color:#7C3AED;font-weight:bold;font-size:13px');
  window.firebaseAuth = {};
  window.firestoreDb = {};
  window.firebaseAuthFns = {
    onAuthStateChanged: () => {},
    RecaptchaVerifier: function () {},
    signInWithPhoneNumber: () => Promise.resolve({ confirm: () => Promise.resolve() }),
    signOut: () => Promise.resolve()
  };
}
