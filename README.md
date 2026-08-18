# Magic Box — Panel de Cotizaciones

Herramienta de cotización para "Magic Box" (antes "Fiesta Feliz"), un negocio de servicios para fiestas infantiles en Lima, Perú. Sitio estático (HTML/CSS/JS, sin build step) más un puñado de funciones serverless para lo que sí necesita backend real.

## Qué mostrar primero

- **`_preview_prototipo.html`** es la landing aprobada y la que efectivamente se despliega. Contiene **dos vistas en un solo archivo**: el panel interno del dueño y la vista pública del cliente, alternables con el switcher "Panel interno / Link del cliente" (ese switcher es solo para revisar el prototipo — en producción el cliente entra directo a su vista, sin login ni el switcher).
- **`index.html`** ya no es la app — es un redirect instantáneo (meta-refresh + JS) hacia `_preview_prototipo.html`, para que cualquier hosting estático (GitHub Pages, Vercel, lo que sea) muestre lo correcto en `/` sin depender de configuración especial de rutas.
- **`panel-legacy.html`** es la app modular original (Firebase/Firestore, arquitectura por módulos en `js/*.js`) — se conserva por si se retoma esa versión, pero no es lo que está en producción.

## Arquitectura por pieza

### 1. Frontend (`_preview_prototipo.html`)

Un solo archivo HTML con `<style>` inline y un IIFE de JavaScript vanilla (sin build, sin framework, sin dependencias de frontend). Internamente se organiza por banners de comentario (`=== NOMBRE ===`) — buscar esos banners es la forma más rápida de navegar el archivo:

- **`PROTOTYPE STAGE SWITCHER`** — alterna panel interno / vista cliente (solo para este prototipo).
- **`PANEL INTERNO`** — catálogo, buscador con fuzzy matching, carrito, historial de pedidos, botón de Excel de clientes.
- **`VISTA CLIENTE`** — catálogo público, tarjetas de producto con imagen grande (fondo difuminado + foto nítida encima, para disimular que las fotos fuente son de baja resolución), carrusel de testimonios con auto-scroll infinito, footer con datos de contacto.
- **`ASISTENTE DE CHAT`** — chat de pantalla completa con IA (Gemini), consultivo: recomienda y adjunta fotos reales del catálogo cuando las menciona, pero nunca agrega nada al pedido por su cuenta — eso lo hace la persona con los botones.
- **`TOGGLE DE TEMA`** — claro/oscuro, oscuro por defecto (pedido explícito del dueño).

Imágenes: convención de nombre de archivo, no de datos — `img/cat/<categoria>.jpg` y `img/prod/<producto>.jpg`. Un producto nuevo necesita su id agregado a la lista `PROD_PHOTO` en el script y el archivo correspondiente en `img/prod/`.

Video de fondo del hero: `video/hero-loop.mp4` y `video/hero-loop-2.mp4` rotan en loop infinito — las fotos del mosaico se ven primero (~1s), se difuminan, y queda el video de fondo permanente. Se retoma solo si el navegador lo pausa (pestaña en segundo plano).

### 2. Asistente de chat (`api/chat.js`)

La única pieza con backend real. El navegador nunca ve una API key de Gemini — todo pasa por esta función serverless:

- `POST /api/chat` recibe `{ message, history }`, arma el prompt con `SYSTEM_INSTRUCTION` (persona del conejo, catálogo resumido) y responde con el texto de Gemini.
- **Pool de keys con failover paralelo**: `GEMINI_API_KEYS` (variable de entorno, separadas por coma) se prueban de a 5 en paralelo con `Promise.any` — si una tarda o falla (429/403/timeout), gana la primera que responda bien, sin esperar a que fallen todas en secuencia.
- Catálogo y precios están hardcodeados en `CATALOG_SUMMARY` dentro de este archivo — si cambian los precios reales, hay que actualizarlos acá a mano (no se derivan de `js/data.js` ni de `catalogo-magic-box.md`).

### 3. Captura de leads (Google Forms → Google Sheets)

Sin backend propio ni credenciales que proteger: se usa el truco estándar de enviar un `POST` con `fetch(..., {mode:'no-cors'})` directo al endpoint público de un Google Form, usando los `entry.XXXXXXX` de cada pregunta. Cada respuesta se guarda como fila nueva en el Sheet conectado al formulario, en tiempo real.

Dos canales escriben al mismo formulario (función compartida `sendLeadToGoogleForm()` en el script):
- **Panel interno** → al hacer click en "Guardar pedido" (tiene nombre + teléfono + total real, porque el dueño ya cotizó).
- **Chat del cliente** → al agregar un ítem desde el asistente de IA (nombre del cliente + categoría de interés).

El formulario tiene 9 campos, todos de texto libre (a propósito: así el dato que llega del chat de WhatsApp más adelante, que también será texto sin estructura, es comparable sin tener que reconciliar un dropdown contra texto libre). Ver `ENV_SETUP.md` si hace falta reconfigurar el endpoint o los `entry.XXX`.

**Pendiente / a futuro**: columnas para el dato *real* del negocio (precio final cotizado, fecha confirmada, estado del lead) se agregan a mano en el Sheet, no vienen del formulario — porque eso lo sabe el dueño después de hablar con el cliente, no el cliente mismo.

### 4. Excel descargable

Dos descargas distintas, ambas 100% en el navegador (sin servidor), y ambas con **fecha y hora en el nombre del archivo** para que el explorador de archivos de Android/Windows nunca sobrescriba una descarga anterior:

- **Panel interno → "Descargar Excel de clientes"**: genera un `.xlsx` real con [SheetJS](https://sheetjs.com/) (cargado por CDN). Hoy usa datos de prueba (`LEADS_DEMO`) — cuando Supabase esté conectado, se reemplaza por un `fetch` a la tabla real.
- **Chat del cliente → "Descargar mi lista" / "Copiar para WhatsApp"**: al terminar de elegir, el cliente puede descargar un `.txt` con su pedido, copiarlo al portapapeles, o abrir WhatsApp con el mensaje ya armado — las tres opciones comparten el mismo texto (`buildClientOrderText()`).

### 5. Base de datos (Supabase) — provisionada, aún no conectada

`supabase-schema.sql` crea la tabla `whatsapp_leads` (Fecha, Nombre, Teléfono, Consulta, Categoría, Estado, Monto, Fuente) con Row Level Security activado y sin políticas — bloqueada para cualquiera excepto quien tenga la `service_role` / *Secret key*, que solo debe vivir en variables de entorno de servidor, nunca en el navegador. El proyecto ya existe y la tabla ya está creada; falta el webhook que la llene automáticamente (ver más abajo).

### 6. Lo que falta para el flujo 100% automático

El plan completo (WhatsApp real → base de datos → Excel) tiene una pieza pendiente, fuera del control de este repo:

1. **Verificar el número de WhatsApp Business con Meta** (proceso de Meta, no técnico, puede tardar días la primera vez).
2. Una vez verificado: un webhook (función serverless, mismo patrón que `api/chat.js`) recibe cada mensaje entrante — Meta manda automáticamente el número de teléfono y el nombre de perfil de WhatsApp — y lo guarda en `whatsapp_leads` de Supabase.
3. El botón "Descargar Excel de clientes" del panel interno se conecta a esa tabla real en vez de a `LEADS_DEMO`.

Mientras tanto, el Google Form + los dos canales que ya escriben ahí (panel interno, chat) cumplen la misma función de forma manual/semi-automática, sin depender de esa verificación.

## Comandos

```bash
node dev-server.js
```

Sirve todo el sitio estático **y** ejecuta `api/chat.js` en `POST /api/chat`, imitando el runtime de funciones de Vercel (`req.body`, `res.status().json()`). Carga `.env` automáticamente. Escucha en `PORT` o `8934`; `/` sirve `_preview_prototipo.html`.

```bash
python -m http.server 8934
```

Alternativa solo para navegar el sitio estático — `/api/chat` da 404 ahí, el chat cae a las reglas locales.

No hay lint, test ni build configurado.

## Variables de entorno (`.env`, nunca se sube a git)

| Variable | Para qué |
|----------|----------|
| `GEMINI_API_KEYS` | Pool de API keys de Gemini, separadas por coma — usadas solo por `api/chat.js` |
| `SUPABASE_URL` | URL del proyecto de Supabase |
| `SUPABASE_PUBLISHABLE_KEY` | Clave pública (segura para el navegador, protegida por RLS) |
| `SUPABASE_SECRET_KEY` | Clave con acceso total — **solo backend**, nunca en código que corre en el navegador |

Ver `.env.example` para la plantilla y `ENV_SETUP.md` para instrucciones paso a paso.

## Deploy

- **Vercel**: `vercel.json` enruta `/` a `_preview_prototipo.html`; `api/chat.js` se detecta automáticamente como función serverless. Variables de entorno se configuran en el dashboard de Vercel.
- **GitHub Pages**: sirve `index.html` en `/` por convención — como ese archivo ahora es un redirect a `_preview_prototipo.html`, funciona igual sin necesitar configuración de rutas.

## Referencias

- **`catalogo-magic-box.md`** — productos y precios reales, fuente de verdad para actualizar precios en cualquier parte del código.
- **`PROMPT_ANTIGRAVITY_FRONTEND.md`** — brief de diseño original (contexto de negocio, flujo actual del dueño por WhatsApp y Word).
- **`ENV_SETUP.md`** — configuración detallada de variables de entorno, desarrollo y producción.
- **`CLAUDE.md`** — guía para trabajar en este repo con Claude Code.

## Notas de seguridad

- El repo es **público**. `config.js`, `.env` y `.vercel` están en `.gitignore` — nunca deben tener contenido real commiteado.
- Ninguna API key (Gemini, Supabase) vive en código que se ejecuta en el navegador — todas pasan por funciones serverless o quedan protegidas por Row Level Security.
