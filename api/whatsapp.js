/**
 * Webhook de WhatsApp (Twilio) -- mismo asistente que el chat web
 * (api/_gemini.js), pero por WhatsApp: Twilio manda aqui cada mensaje
 * entrante, y la respuesta se devuelve como TwiML (<Message>) para que
 * Twilio se la reenvie al cliente.
 *
 * Variables de entorno necesarias (Vercel + .env local):
 * - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN: de la consola de Twilio.
 * - TWILIO_WHATSAPP_NUMBER: no se usa para enviar (se responde via TwiML,
 *   no via la API REST), pero queda documentado aqui por si mas adelante
 *   se necesita mandar mensajes salientes fuera de una respuesta directa.
 *
 * Limitacion conocida: sin un mecanismo de cola/lock compartido (Redis,
 * Vercel KV, etc.) no se puede garantizar en serverless que dos mensajes
 * casi simultaneos del mismo numero se procesen uno despues del otro --
 * cada invocacion es independiente. En la practica WhatsApp entrega los
 * mensajes de a uno por webhook, asi que es infrecuente, pero si alguien
 * escribe dos mensajes muy pegados podria recibir dos respuestas fuera de
 * orden. Arreglarlo bien necesita ese lock compartido -- pendiente.
 */

const twilio = require('twilio');
const { askAssistant } = require('./_gemini');
const { getConversation, saveConversation, getBookedDates, reserveBooking, holdFailureNote } = require('./_db');

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, function (c) {
    return { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c];
  });
}

function twiml(message) {
  return '<?xml version="1.0" encoding="UTF-8"?><Response><Message>' + escapeXml(message) + '</Message></Response>';
}

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  const body = req.body || {};

  /* Verifica que el mensaje realmente venga de Twilio (no de cualquiera
     pegandole al endpoint) -- necesita TWILIO_AUTH_TOKEN. Si todavia no
     esta configurada, deja pasar con un aviso en vez de romper todo,
     para poder probar el resto del flujo mientras se termina de armar
     la cuenta de Twilio. */
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (authToken) {
    const signature = req.headers['x-twilio-signature'];
    const protocol = (req.headers['x-forwarded-proto'] || 'https');
    const fullUrl = protocol + '://' + req.headers.host + req.url;
    const valid = twilio.validateRequest(authToken, signature || '', fullUrl, body);
    if (!valid) {
      console.warn('whatsapp.js: firma de Twilio invalida, se rechaza el pedido.');
      res.status(403).send('Invalid signature');
      return;
    }
  } else {
    console.warn('whatsapp.js: TWILIO_AUTH_TOKEN no configurada -- validacion de firma DESACTIVADA (solo para pruebas).');
  }

  const from = String(body.From || '').replace(/^whatsapp:/, '');
  const message = String(body.Body || '').trim().slice(0, 1000);

  if (!from || !message) {
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(twiml(''));
    return;
  }

  const startedAt = Date.now();
  /* Id fijo por numero: una sola reserva por cliente, y se excluye del
     chequeo de cruces para no decirle que su propia fecha esta ocupada. */
  const holdId = 'wa_' + from;

  try {
    const [history, bookedDates] = await Promise.all([
      getConversation(from),
      getBookedDates(holdId)
    ]);

    /* Presupuesto corto: Twilio espera la respuesta como mucho 15s. */
    const result = await askAssistant(message, history, bookedDates || [], '', { channel: 'whatsapp', budgetMs: 11000, skipDelay: true });
    let reply = result.reply;

    /* Mismo criterio que el chat web: si detecto fecha+horario confirmados,
       los aparta (hold de 3 dias) con reserveBooking, que revisa y guarda
       en un solo paso para que dos clientes no tomen el mismo horario.
       Id fijo por numero de telefono: si cambia de fecha a mitad de charla,
       se mueve el mismo registro en vez de dejar dos sueltos. */
    if (result.eventDateIso && result.eventStart && result.eventEnd) {
      const r = await reserveBooking(holdId, {
        client_name: 'Cliente WhatsApp (' + from + ')',
        phone: from,
        event_date: result.eventDateIso,
        event_start: result.eventStart,
        event_end: result.eventEnd,
        status: 'chat_ia',
        source: 'whatsapp'
      });
      if (!r.ok) reply += '\n\n' + holdFailureNote(r.reason, 'whatsapp');
    }

    const newHistory = history.concat([
      { role: 'user', text: message },
      { role: 'model', text: reply }
    ]).slice(-16);
    await saveConversation(from, newHistory);

    /* Pausa corta antes de responder -- para que no se sienta como una
       maquina contestando al milisegundo (sobre todo con las respuestas
       pregrabadas, que salen al instante). Si la IA ya tardo, no se
       agrega nada: Twilio corta a los 15s. */
    const elapsed = Date.now() - startedAt;
    if (elapsed < 2500) await sleep(900 + Math.floor(Math.random() * 1200));

    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(twiml(reply));
  } catch (err) {
    console.error('whatsapp.js error', err);
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(
      twiml('Uy, tuve un problema para responder justo ahora 🐰 Escríbenos directo o intenta de nuevo en un ratito.')
    );
  }
};
