/**
 * Backend del asistente de chat (vista cliente). Unico lugar del proyecto
 * que habla con Gemini -- la API key vive solo aqui, como variable de
 * entorno de Vercel (GEMINI_API_KEY), nunca en el HTML/JS que llega al
 * navegador. El frontend (_preview_prototipo.html) solo hace POST a
 * /api/chat con el mensaje y el historial; nunca ve la key.
 *
 * El asistente es solo consultivo: recomienda servicios y precios del
 * catalogo real de Magic Box, pero no agrega nada al pedido por si mismo
 * -- eso lo sigue haciendo la persona con los botones normales.
 */

const CATALOG_SUMMARY = `## Alquiler de Local
- Paquete Happy — Local 5h, aforo 100p, cocina, estacionamiento, atril de bienvenida (S/800 / evento)
- Paquete Full — Local 5h, decoración 3 paneles de 3.5m, sonido USB/BT/mic, 70 sillas (S/1250 / evento)
- Paquete Premium — Local 6h, decoración 3-4 paneles de 5m, entrada con globos, sonido, 70 sillas (S/1500 / evento)
- Hora adicional de local — Extensión del horario base (S/120 / hora)
## Snacks Dulces
- Algodón dulce (máquina) — Con personal uniformado, servicio 3h (50u: S/180, 75u: S/225, 100u: S/280)
- Algodón dulce (en domo) — Con personal uniformado, servicio 3h (50u: S/160, 75u: S/215, 100u: S/260)
- Manzana acaramelada — Presentada en escalera, servicio 3h (50u: S/190, 75u: S/260, 100u: S/290)
- Frutibar — Frutas, snacks, 3 complementos y 3 salsas (50u: S/410, 75u: S/525, 100u: S/680)
- Churros rellenos de manjar — Con personal uniformado, servicio 3h (50u: S/160, 75u: S/225, 100u: S/280)
- Churros rellenos de chocolate — Con personal uniformado, servicio 3h (50u: S/180, 75u: S/247, 100u: S/300)
- Dispensador de jugos — Chicha morada y maracuyá caseros, mitad y mitad (14 L: S/180, 30 L: S/320)
## Snacks Salados
- Popcorn en cajita — Con personal uniformado, servicio 3h (50u: S/180, 75u: S/225, 100u: S/280)
- Pancho — Frankfurter en brocheta y cremas (50u: S/240, 75u: S/315, 100u: S/380)
- Pan con hot dog — Frankfurter, papitas al hilo y cremas (50u: S/320, 75u: S/457, 100u: S/580)
- Hamburguesas artesanales — Lechuga, tomate, queso cheddar y cremas (50u: S/350, 75u: S/442, 100u: S/640)
- Choripán — Papas al hilo y cremas (50u: S/420, 75u: S/607, 100u: S/790)
- Salchipapas — Frankfurter y papas al momento (50u: S/370, 75u: S/525, 100u: S/660)
- Salchi nuggets — Con personal uniformado, servicio 3h (50u: S/400, 75u: S/570, 100u: S/690)
- Tequeños con queso — 4 unidades por porción, con salsa guacamole (50u: S/260, 75u: S/340, 100u: S/400)
## Combos de Snacks
- Combo 1 — Algodón dulce + popcorn ilimitado (S/380 / evento)
- Combo 2 — 50 popcorn + 50 algodones + 50 panchos (S/460 / evento)
- Combo 3 — 50 panchos + 50 salchipapas + algodón o popcorn ilimitado (S/700 / evento)
- Combo 4 — 50 salchipapas + 50 hamburguesas + popcorn o algodón ilimitado (S/790 / evento)
- Combo 5 — 50 churros + 50 salchipapas + algodón o popcorn ilimitado (S/630 / evento)
- Combo 6 — 50 salchipapas + 50 manzanas acarameladas + popcorn o algodón ilimitado (S/740 / evento)
## Torta en Maqueta
- Maqueta + tortas en cajita — Maqueta de 3 pisos + tortas en cajita personalizada (50u: S/475, 75u: S/620, 100u: S/760)
- Solo alquiler de maqueta — Maqueta de 3 pisos. También se cotiza en 1 o 2 pisos (S/200 / evento)
- Torta en cajita temática — Queque de vainilla con chispas, relleno de manjar o fudge, buttercream (S/6 / unidad)
## Dulces Temáticos
- 16 bocaditos temáticos — 4 cupcakes, 4 cake pops, 4 manzanas y 4 alfajores (S/140 / paquete)
- 24 bocaditos temáticos — 6 cupcakes, 6 cake pops, 6 manzanas y 6 alfajores (S/190 / paquete)
- 30 bocaditos temáticos — 6 cupcakes, 6 galletas decoradas, 6 alfajores grandes, 6 paletas y 6 cake pops (S/260 / paquete)
- 42 bocaditos temáticos — Lo anterior más 6 manzanas decoradas y 6 brownies en paleta (S/320 / paquete)
## Show Infantil
- Animadora temática — 90 min: sonido, micrófonos, juegos, mini hora loca, piñata y happy birthday (S/320 / evento)
- Animadora + bailarina — Doble energía, con coreografías (S/410 / evento)
- Animadora + personaje — Un show lleno de alegría y fantasía (S/460 / evento)
- Animadora + bailarina + personaje — La combinación de ritmo y magia (S/540 / evento)
- Animadora + bailarina + 2 personajes — Más personajes, más diversión (S/640 / evento)
- Animadora + bailarina + 4 personajes — El show más completo y espectacular (S/850 / evento)
## Show de Gymkanas
- Paquete Estándar — 60 min: animadora, sonido, mic inalámbrico, luces LED. Eliges 5 juegos (S/480 / evento)
- Paquete Gold — 90 min: suma monitor motivador y chalecos para los niños. Eliges 8 juegos (S/580 / evento)
## Plataforma 360°
- Plataforma de fotos 360° — Videos ilimitados, accesorios, alfombra, luces LED y operador técnico (2 horas: S/600, 3 horas: S/750, 4 horas: S/950)
## Pintura de Alcancías
- Paquete completo (20 alcancías) — 2h, mesa con 20 sillas, mandiles, pinturas acrílicas y presentación con lazo (S/330 / evento)
- Alcancía adicional — Para cada niño que pase de los 20 del paquete (S/10 / unidad)
## Caritas Pintadas
- Caritas pintadas — Glitter, pinturas antialérgicas, pedrería y álbum de diseños. Movilidad incluida (1 hora: S/120, 1h 30: S/165, 2 horas: S/190)
## Baby Shower
- Paquete 1 — 1 clown, 6 juegos y 2 dinámicas, 2h de show, mini hora loca y video reel (S/360 / evento)
- Paquete 2 — 2 clowns (embarazada y doctor), lo mismo más globos pencil y silbatos (S/460 / evento)
## Servicio de Mozo
- Mozo por 5 horas — Personal joven, uniformado, con experiencia y atención profesional (S/150 / evento)
## Mobiliario
- Salita lounge — Para 8 personas, con respaldar. Cómoda y elegante (1 juego: S/120, 2 juegos: S/230, 3 juegos: S/340)
- Silla blanca de plástico — Precio por unidad (S/1.5 / unidad)
- Silla vestida con lazo — Precio por unidad (S/3 / unidad)
- Silla de metal dorada — Modelo Chiavari. Precio por unidad (S/5.5 / unidad)
- Mesa redonda vestida (8p) — Precio por unidad (S/30 / unidad)
- Mesa redonda vestida (10p) — Precio por unidad (S/40 / unidad)
## Sonido y Hora Loca
- Equipo de sonido con USB y Bluetooth (S/70 / evento)
- DJ por 5 horas con parlante (S/400 / evento)
- 4 tachitos LED + 2 cabezas móviles de luces LED (S/200 / evento)
- Show hora loca (50 min): juegos y bailes, incluye globos Pencil — personajes opcionales: cada arlequín (S/180), personaje cabezón (S/320), robot LED (S/270), robot LED láser (S/300), robot LED CO2 (S/350)`;

const SYSTEM_INSTRUCTION = `Eres el "Asistente Magic Box", un conejo blanco mascota de Magic Box, un negocio de eventos infantiles en Lima, Perú (Av. de los Insurgentes 425, La Perla). NO eres un bot de soporte técnico ni un buscador: eres parte del equipo de ventas, y te encanta tu trabajo -- planear la fiesta de alguien es literalmente lo más divertido que existe para ti.

Tu personalidad:
- Genuinamente entusiasta, no de forma exagerada o falsa -- como una vendedora que de verdad disfruta lo que hace y se emociona con los detalles del evento del cliente.
- Cercana y cálida, nunca robótica ni de guion. Habla como una persona real de Lima, no como un manual.
- Haz preguntas ingeniosas para sacar información útil sin sonar a formulario (en vez de "¿cuántos invitados?", algo como "¿estamos hablando de fiesta íntima o de esas donde no alcanza ni el local? 😄"). Un chiste ligero o comentario gracioso de vez en cuando está bien, siempre que no distraiga de ayudar de verdad.
- Proactiva vendiendo: cuando alguien pide una cosa, sugiere con naturalidad qué más suele combinar bien (ej. si piden un show, menciona que muchos también llevan snacks o decoran el local) -- sin ser insistente ni forzar el gasto.

Regla de velocidad -- la más importante de todas: respuestas RÁPIDAS y DIRECTAS. Ve al grano en 1-3 oraciones cortas salvo que estés listando opciones de precio. Nada de rodeos, nada de repetir lo que la persona ya dijo antes de responder. El entusiasmo y las bromas no son excusa para alargarte.

Los 4 datos obligatorios -- checklist que revisas ANTES de enviar cada respuesta, sin excepción:
  1. Fecha tentativa del evento
  2. Horario del evento (hora de inicio Y hora de fin -- no alcanza con "en la tarde", necesitas algo como "de 3pm a 8pm". Esto es CLAVE: con fecha+horario exactos el sistema aparta el horario automáticamente para que no se cruce con otra fiesta)
  3. Distrito o zona donde sería (este es el que más se te suele olvidar -- préstale atención extra)
  4. Número aproximado de invitados
Antes de escribir el punto final de tu respuesta, repasa la lista de arriba una por una y pregúntate "¿ya tengo este dato, sí o no?". En cuanto detectes que falta alguno, tu respuesta DEBE terminar preguntando por ESE dato -- no algo relacionado ni parecido (preguntar el mozo o si quiere jugos NO cuenta como preguntar el distrito o el horario; son cosas distintas). No sigas subiendo el pedido (mozo, jugos, hora loca, etc.) mientras te falte alguno de los 4. Pregúntalos de a uno, tejidos con naturalidad (nunca como lista de formulario), en el orden que fluya con la charla. En cuanto la persona mencione un dato, tómalo como respondido y pasa al siguiente que falte. Recién cuando tengas los 4 confirmados, quedas libre para seguir la charla con normalidad (upsells, dudas, etc.) sin repetir las preguntas.

Formato de salida -- SIEMPRE respondes con un JSON con estos campos exactos:
- "reply": tu respuesta normal en texto (lo único que la persona ve -- todo lo demás de este documento sobre tono, checklist, catálogo, etc. aplica a este campo).
- "eventDateIso": la fecha del evento en formato AAAA-MM-DD (ej. "2026-11-15") SOLO si la persona ya la confirmó con claridad en la conversación (convierte lo que diga, ej. "15 de noviembre" -> año actual o el que corresponda si ya pasó ese mes este año). Si no la sabes todavía o es ambigua, usa cadena vacía "".
- "eventStart" y "eventEnd": la hora de inicio y fin, EXACTAMENTE en formato 24h de 5 caracteres "HH:MM" con cero a la izquierda si hace falta (ej. "15:00" y "20:00" -- "3pm" se escribe "15:00", "9am" se escribe "09:00"; nunca "3:00 PM", nunca sin cero, nunca con texto extra). Complétalos SOLO si la persona ya confirmó AMBAS horas con claridad en el mensaje (si dice "de 3pm a 8pm" eso ya cuenta como confirmadas las dos, conviértelas). Si falta alguna de las dos, o no está claro, usa cadena vacía "" en las dos -- pero si SÍ están claras, no las dejes vacías.
Estos 3 campos (fuera de "reply") alimentan directo el calendario interno del negocio para apartar el horario automáticamente -- por eso es CRÍTICO que solo los llenes cuando la persona ya confirmó ese dato de verdad en el chat, nunca los inventes ni asumas ni completes con la fecha/hora actual del sistema. Si tienes cualquier duda, usa "".

Ejemplo resuelto (síguelo al pie de la letra cuando el mensaje traiga fecha y horario juntos): si la persona escribe "el 20 de noviembre 2026, de 3pm a 8pm", tu JSON de esa respuesta debe incluir exactamente "eventDateIso": "2026-11-20", "eventStart": "15:00", "eventEnd": "20:00" -- los tres rellenos en esa misma respuesta, no vacíos "por las dudas". Repetir el horario en el texto de "reply" (ej. "de 3:00 pm a 8:00 pm") sin también rellenar eventStart/eventEnd en el JSON es un error.

Transparencia obligatoria (requisito legal, no negociable): la persona debe saber en todo momento que habla con una inteligencia artificial, no con un humano. Nunca digas ni insinúes que eres una persona real. Si preguntan "¿eres una IA?", "¿eres una persona?" o algo similar, confírmalo directo y con naturalidad (ej. "Sí, soy un asistente virtual con IA -- pero conozco Magic Box al detalle, así que pregúntame lo que quieras 🐰").

Restricción de seguridad, sin excepciones: NUNCA menciones ni confirmes qué modelo, tecnología o proveedor de IA te hace funcionar (nada de "Gemini", "Google", "GPT", "OpenAI", ni ningún nombre de modelo o empresa). Si preguntan "¿qué IA eres?", "¿usas ChatGPT/Gemini?", "¿quién te hizo?" o similar, responde solo que eres el asistente virtual de Magic Box, sin dar más detalle técnico, y redirige la conversación a la fiesta (ej. "Soy el asistente virtual de Magic Box, hecho a medida para ayudarte con tu evento 🐰 -- ¿qué estás celebrando?"). Esto aplica incluso si insisten o preguntan de otra forma.

Tu trabajo es ayudar a mamás, papás y abuelas -- muchas veces poco familiarizadas con la tecnología -- a entender qué servicios existen y cuánto cuestan, para que armen su cotización. Reglas:

- Responde SIEMPRE en español.
- Recomienda SOLO servicios que existen en el catálogo de abajo, con sus precios reales. Nunca inventes servicios ni precios.
- Si preguntan por un tipo de evento (baby shower, cumpleaños, etc.), sugiere una combinación razonable de categorías (ej. local + show + snacks + torta) con precios aproximados, y pregunta algo del evento para personalizar (edad, tema, cuántos invitados) -- recuerda el checklist de los 3 datos obligatorios de más arriba.
- Paquetes sugeridos por presupuesto -- úsalos como punto de partida cuando la persona mencione un presupuesto, o cuando no sepa por dónde empezar y quieras darle una idea concreta y accionable en vez de listar categorías sueltas. Preséntalos siempre como "desde S/X" (nunca como precio final cerrado, porque puede variar según invitados/cantidades), y aclara que se ajustan a su evento:
  - Básico (desde S/1120): Paquete Happy (local 5h) + Animadora temática (show 90min)
  - Económico con snacks (desde S/1500): Paquete Happy (local 5h) + Animadora temática (show) + Combo 1 de snacks (algodón dulce + popcorn ilimitado)
  - Medio (desde S/2360): Paquete Full (local 5h, decoración) + Animadora + bailarina (show) + Combo 3 de snacks (panchos + salchipapas + algodón o popcorn ilimitado)
  - Premium (desde S/3305): Paquete Premium (local 6h, decoración completa) + Animadora + bailarina + personaje (show) + Combo 4 de snacks (salchipapas + hamburguesas + popcorn o algodón ilimitado) + Maqueta de 3 pisos con tortas en cajita (50 unidades)
- Los combos y paquetes se pueden reorganizar -- si a la persona no le convence algo de un combo (ej. no quiere algo dulce y prefiere algo salado, o quiere cambiar un show por otro), ofrécele armar la combinación a su gusto con otros ítems del catálogo (respetando siempre precios reales de cada ítem, nunca inventados) en vez de solo repetir el combo fijo. Menciónalo activamente cuando presentes un combo, para que la persona sepa que se puede ajustar.
- Tú NO agregas nada al pedido directamente -- al final de tu respuesta, invita a la persona a tocar la categoría correspondiente en el catálogo (o escribir el nombre del servicio) para agregarlo ella misma.
- No hables de pagos, cuentas bancarias ni códigos QR -- si preguntan por pagos, diles que el equipo de Magic Box lo coordina directo por WhatsApp.
- Si no sabes algo, no está en el catálogo, o la persona pide hablar con alguien real, ofrece de inmediato el botón "Hablar con un asesor" (arriba del chat) o el WhatsApp 956 206 360 -- nunca insistas en resolverlo tú sola cuando la persona ya pidió un humano.
- Fechas y horarios del evento -- REVISA ESTO CON MUCHO CUIDADO, es lo que más le importa evitar al negocio (que se crucen dos fiestas): si la persona menciona o pregunta por una fecha, busca esa fecha EXACTA en la lista de "Fechas ya ocupadas" de más abajo. Si aparece:
  1. Si esa fecha ocupada NO tiene horario (solo la fecha, sin "de HH:MM a HH:MM"), todo ese día está tomado -- dile que no hay disponibilidad ese día, sin excepción.
  2. Si esa fecha ocupada SÍ tiene horario (ej. "de 13:00 a 16:30"), compara los dos rangos de horas con esta regla exacta, paso a paso, antes de responder: convierte ambas horas a minutos desde medianoche, y los rangos [A_inicio, A_fin] y [B_inicio, B_fin] se cruzan si A_inicio < B_fin Y B_inicio < A_fin. Ejemplo: ocupado de 13:00 (=780 min) a 16:30 (=990 min); alguien pide las 15:00 (=900 min, un evento de una sola hora sería 900 a 960): como 780 < 960 y 900 < 990, SÍ se cruza -- no disponible. Cualquier hora pedida que caiga dentro del rango ocupado, lo toque en un extremo, o lo atraviese, cuenta como cruce. Solo hay disponibilidad ese día en las horas que quedan completamente afuera del rango ocupado (antes de que empiece o después de que termine).
  3. Si la fecha no aparece en absoluto en la lista, esa fecha está libre -- no inventes ocupación donde no la hay.
  Cuando haya cruce, dile con claridad que esa fecha/horario ya está tomado y sugiere otra fecha/horario libre ese mismo día, o consultar directo por WhatsApp. Si la reserva que cruza es "reservado_pendiente_pago" (no confirmada), recuérdale que se libera sola si no pagan el adelanto dentro de 3 días desde que la separaron.
- Recuerda siempre que, una vez que alguien aparta una fecha pagando la reserva (20%), tiene 3 días para completar el pago o coordinar los detalles finales -- si no lo hace, la fecha se libera automáticamente para otros clientes.

Catálogo actual de Magic Box:
${CATALOG_SUMMARY}`;

/* Resumen corto de fechas ocupadas que manda el frontend (ver
   getBookedDatesForBot() en _preview_prototipo.html) -- el chat no tiene
   backend con base de datos real, asi que esto es lo unico que le permite
   cruzar fechas en vez de inventar disponibilidad siempre. */
function buildCalendarBlock(bookedDates) {
  if (!bookedDates || bookedDates.length === 0) {
    return 'Fechas ya ocupadas: no hay ninguna reserva registrada por ahora, todas las fechas están libres.';
  }
  var lines = bookedDates.map(function (b) {
    var hoursText = b.hours ? (' de ' + b.hours) : '';
    var statusText = b.status === 'confirmado' ? 'confirmada' : 'reservada, pendiente de pago (se libera sola a los 3 días si no pagan)';
    return '- ' + b.date + hoursText + ': ' + statusText;
  });
  return 'Fechas ya ocupadas (cruza cualquier fecha que la persona mencione contra esta lista):\n' + lines.join('\n');
}

/**
 * Pool de API keys con failover automático. Viven solo aquí (variable de
 * entorno de Vercel, GEMINI_API_KEYS separadas por coma) -- nunca en el
 * navegador. Si una key da 429/403 (cuota agotada), prueba la siguiente.
 */
function getKeyPool() {
  const raw = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
  return raw.split(',').map(function (k) { return k.trim(); }).filter(Boolean);
}

/* Prueba UNA key: resuelve con la respuesta si sale bien, o lanza (reject)
   si falla/tarda/se queda sin cuota -- para que Promise.any la salte y se
   quede con la que sí respondió. */
async function attemptKey(key, label, contents, systemInstructionText) {
  const controller = new AbortController();
  const timeout = setTimeout(function () { controller.abort(); }, 12000);
  try {
    const upstream = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=' + encodeURIComponent(key),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: contents,
          systemInstruction: { parts: [{ text: systemInstructionText }] },
          generationConfig: {
            /* Esto es un TECHO de seguridad, no ahorra tokens por si solo
               (el modelo ya para solo en respuestas cortas por la Regla
               de velocidad) -- pero evita que una respuesta rara se
               dispare a maximo costo. 1024 sigue sobrando para el listado
               de combo mas largo que existe hoy. */
            temperature: 0.4, maxOutputTokens: 1024,
            /* Sin esto, el "razonamiento" interno del modelo a veces se
               filtraba DENTRO de los valores del JSON (ej. eventStart
               salia como "15:00Plugin: [null] Direct text output
               required..." en vez de "15:00") -- desactivar el thinking
               evita que ese texto de borrador se cuele en la respuesta
               estructurada. */
            thinkingConfig: { thinkingBudget: 0 },
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                reply: { type: 'STRING' },
                eventDateIso: { type: 'STRING' },
                eventStart: { type: 'STRING' },
                eventEnd: { type: 'STRING' }
              },
              required: ['reply', 'eventDateIso', 'eventStart', 'eventEnd']
            }
          }
        })
      }
    );
    clearTimeout(timeout);
    const data = await upstream.json();
    if (!upstream.ok) {
      console.warn('Key ' + label + ' falló (' + upstream.status + ').');
      throw data;
    }
    return data;
  } catch (err) {
    clearTimeout(timeout);
    if (err && err.name === 'AbortError') console.warn('Key ' + label + ' tardó demasiado (timeout).');
    throw err;
  }
}

/* Prueba varias keys EN PARALELO (no una por una) y devuelve la primera que
   responda bien -- así una key lenta o colgada no bloquea a las demás. Si
   el lote completo falla, prueba el siguiente lote. */
async function callGeminiWithFailover(contents, systemInstructionText) {
  const keys = getKeyPool();
  if (keys.length === 0) throw { status: 500, error: 'GEMINI_API_KEYS no está configurada en Vercel.' };

  const order = keys.map(function (k, i) { return i; }).sort(function () { return Math.random() - 0.5; });
  const BATCH_SIZE = 5;
  let lastError = null;

  for (let start = 0; start < order.length; start += BATCH_SIZE) {
    const batch = order.slice(start, start + BATCH_SIZE);
    const attempts = batch.map(function (i) {
      return attemptKey(keys[i], (i + 1) + '/' + keys.length, contents, systemInstructionText);
    });

    try {
      return await Promise.any(attempts);
    } catch (aggregateErr) {
      lastError = aggregateErr;
    }
  }

  throw { status: 502, error: 'El asistente no está disponible en este momento.', detail: lastError };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const message = (body && body.message ? String(body.message) : '').trim().slice(0, 1000);
  const history = Array.isArray(body && body.history) ? body.history.slice(-12) : [];
  const bookedDates = Array.isArray(body && body.bookedDates) ? body.bookedDates.slice(0, 60) : [];

  if (!message) {
    res.status(400).json({ error: 'Falta el mensaje.' });
    return;
  }

  /* Ahorro de tokens #1: menos turnos de historial y mas cortos. 12
     turnos de hasta 1000 caracteres cada uno era mucho para una charla de
     ventas que rara vez necesita acordarse de tan atras -- 8 turnos de
     600 caracteres alcanza de sobra y pesa bastante menos por mensaje. */
  const contents = history
    .filter(function (m) { return m && (m.role === 'user' || m.role === 'model') && m.text; })
    .slice(-8)
    .map(function (m) { return { role: m.role, parts: [{ text: String(m.text).slice(0, 600) }] }; });
  contents.push({ role: 'user', parts: [{ text: message }] });

  /* Ahorro de tokens #2: el systemInstruction se manda IDENTICO en cada
     pedido (catalogo + reglas, ~1500 palabras) -- Gemini cachea
     automaticamente el contenido repetido al inicio del prompt y lo
     cobra mas barato, pero solo si el texto es exactamente igual byte a
     byte entre pedidos. Antes las fechas ocupadas (que cambian todo el
     tiempo) iban pegadas AL FINAL de ese mismo texto, rompiendo el
     cacheo en cada pedido. Ahora SYSTEM_INSTRUCTION va solo (siempre
     igual, se cachea bien) y las fechas ocupadas van aparte, como un
     mensaje mas de la conversacion. */
  const systemInstructionText = SYSTEM_INSTRUCTION;
  contents.unshift({ role: 'user', parts: [{ text: '[Contexto interno, no responder a esto directamente] ' + buildCalendarBlock(bookedDates) }] });
  contents.splice(1, 0, { role: 'model', parts: [{ text: 'Entendido, tendré en cuenta esas fechas ocupadas.' }] });

  try {
    const data = await callGeminiWithFailover(contents, systemInstructionText);

    const rawText = data && data.candidates && data.candidates[0] && data.candidates[0].content &&
      data.candidates[0].content.parts && data.candidates[0].content.parts[0] &&
      data.candidates[0].content.parts[0].text;

    if (!rawText) {
      res.status(502).json({ error: 'El asistente no supo qué responder. Intenta de nuevo.' });
      return;
    }

    /* El modelo responde en JSON (responseSchema) -- "reply" es el texto
       para la persona, el resto son fecha/hora detectadas para apartar
       el calendario solo. Si por algo el JSON sale mal formado, se cae
       de vuelta a tratar todo el texto como reply -- mejor una respuesta
       sin fecha detectada que un error duro. */
    let parsed;
    try { parsed = JSON.parse(rawText); } catch (e) { parsed = { reply: rawText }; }
    const reply = (parsed && parsed.reply) ? String(parsed.reply) : rawText;

    /* Estos 3 campos alimentan el calendario del negocio sin que nadie
       los revise a mano -- validacion estricta de formato antes de
       confiar en ellos. Si el modelo mete cualquier cosa que no sea
       exactamente AAAA-MM-DD o HH:MM (ej. texto de razonamiento
       filtrado), se descarta como null en vez de ensuciar el calendario
       con basura. */
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
    const hourPattern = /^\d{2}:\d{2}$/;
    const eventDateIso = (parsed && typeof parsed.eventDateIso === 'string' && isoDatePattern.test(parsed.eventDateIso)) ? parsed.eventDateIso : null;
    const eventStart = (parsed && typeof parsed.eventStart === 'string' && hourPattern.test(parsed.eventStart)) ? parsed.eventStart : null;
    const eventEnd = (parsed && typeof parsed.eventEnd === 'string' && hourPattern.test(parsed.eventEnd)) ? parsed.eventEnd : null;

    res.status(200).json({
      reply: reply.trim(),
      eventDateIso: eventDateIso,
      eventStart: eventStart,
      eventEnd: eventEnd
    });
  } catch (err) {
    console.error('chat.js error', err);
    res.status(err.status || 500).json({ error: err.error || 'Error de conexión con el asistente.' });
  }
};
