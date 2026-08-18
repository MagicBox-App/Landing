// Carga variables de entorno de forma segura
// En desarrollo: desde .env.local
// En producción (Netlify): desde variables de entorno del sistema

(async () => {
  // En Netlify, las variables de entorno están disponibles como window.env.*
  // En desarrollo local, intentamos cargar desde .env.local

  const envVars = {
    GEMINI_API_KEY: null
  };

  // Intenta cargar .env.local en desarrollo
  if (!window.location.hostname.includes('netlify') && !window.location.hostname.includes('vercel')) {
    try {
      const res = await fetch('/.env.local');
      if (res.ok) {
        const text = await res.text();
        const lines = text.split('\n');
        lines.forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            const value = valueParts.join('=').replace(/^["']|["']$/g, '');
            if (key in envVars) {
              envVars[key] = value;
            }
          }
        });
      }
    } catch (e) {
      console.info('No .env.local encontrado (normal en desarrollo sin Gemini)');
    }
  }

  // En Netlify, las vars de entorno vienen en window.env (inyectado en el build)
  // O como proceso de Node en tiempo de build
  // Fallback: buscar en variables globales del navegador
  Object.keys(envVars).forEach(key => {
    // Prioridad:
    // 1. Variables de entorno locales (.env.local en desarrollo)
    // 2. Variables inyectadas en el HTML (Netlify)
    // 3. Variables globales (si las hubiera)
    window[key] = envVars[key] || window[key] || null;
  });

  if (!window.GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY no configurada. Chat usará solo reglas locales.');
  } else {
    console.log('✓ API keys cargadas correctamente');
  }
})();
