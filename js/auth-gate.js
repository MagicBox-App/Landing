/**
 * Puerta de acceso: mientras no haya sesión, solo se ve #loginScreen.
 * Al autenticar, se muestra #appRoot y se dispara la carga de datos
 * (window.initAppData, definido en app.js) una sola vez.
 *
 * Login por NUMERO DE TELEFONO (SMS), no correo/contraseña — nada que
 * la dueña tenga que recordar salvo su propio numero. El SDK guarda la
 * sesion en el navegador por defecto, asi que en la practica solo pide
 * el codigo la primera vez que entra desde un dispositivo.
 *
 * MODO DEMO: Si Firebase no está configurado, salta el login
 * y muestra la app directamente con datos locales.
 */

let dataStarted = false;

function showLogin(errorMsg) {
  document.getElementById('loginScreen').hidden = false;
  document.getElementById('appRoot').hidden = true;
  const err = document.getElementById('loginError');
  err.textContent = errorMsg || '';
  err.hidden = !errorMsg;
}

function showApp() {
  document.getElementById('loginScreen').hidden = true;
  document.getElementById('appRoot').hidden = false;
  if (!dataStarted && typeof window.initAppData === 'function') {
    dataStarted = true;
    window.initAppData();
  }
}

if (window.DEMO_MODE) {
  /* ---- Modo demo: entrar directo a la aplicacion ---- */
  showApp();
} else {
  /* ---- Modo producción: auth real con Firebase (SMS) ---- */
  const { onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber, signOut } = window.firebaseAuthFns;
  const auth = window.firebaseAuth;

  let recaptchaVerifier = null;
  let confirmationResult = null;

  function getRecaptcha() {
    if (!recaptchaVerifier) {
      recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptchaContainer', { size: 'invisible' });
    }
    return recaptchaVerifier;
  }

  onAuthStateChanged(auth, user => {
    if (user) {
      showApp();
    } else {
      showLogin();
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    const phoneStep = document.getElementById('loginPhoneForm');
    const codeStep = document.getElementById('loginCodeStep');

    phoneStep.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phone = document.getElementById('loginPhone').value.trim();
      const submitBtn = document.getElementById('loginPhoneSubmit');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
      try {
        confirmationResult = await signInWithPhoneNumber(auth, phone, getRecaptcha());
        phoneStep.hidden = true;
        codeStep.hidden = false;
        document.getElementById('loginCode').focus();
      } catch (err) {
        showLogin('No se pudo enviar el código. Revisa el número (con código de país, ej. +51987654321).');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar código';
      }
    });

    codeStep.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = document.getElementById('loginCode').value.trim();
      const submitBtn = document.getElementById('loginCodeSubmit');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verificando...';
      try {
        await confirmationResult.confirm(code);
      } catch (err) {
        showLogin('Código incorrecto. Vuelve a intentar.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Verificar';
      }
    });

    document.getElementById('loginResendPhone').addEventListener('click', () => {
      codeStep.hidden = true;
      phoneStep.hidden = false;
      document.getElementById('loginCode').value = '';
    });

    const logoutBtn = document.getElementById('btnLogout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => signOut(auth));
    }
  });
}
