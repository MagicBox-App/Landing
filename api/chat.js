/**
 * Backend del asistente de chat (vista cliente web). El frontend
 * (_preview_prototipo.html) hace POST aqui con el mensaje y el historial;
 * nunca ve las API keys de Gemini. La logica real (prompt, catalogo,
 * respuestas pregrabadas, llamada a Gemini con failover) vive en
 * api/_gemini.js, compartida con el bot de WhatsApp (api/whatsapp.js).
 *
 * El asistente es solo consultivo: recomienda servicios y precios del
 * catalogo real de Magic Box, pero no agrega nada al pedido por si mismo
 * -- eso lo sigue haciendo la persona con los botones normales. Lo unico
 * que escribe es el "hold" de fecha+horario en el calendario (Firestore),
 * uno solo por conversacion (id fijo 'web_<sessionId>').
 */

const { askAssistant } = require('./_gemini');
const { getBookedDates, reserveBooking, holdFailureNote } = require('./_db');

/* Limite basico contra abuso (alguien spameando el endpoint para gastar
   cuota o llenar el calendario). Vive en memoria de la instancia: no es
   perfecto en serverless, pero corta el caso tipico de un script. */
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 40;
const rateHits = {};
function rateLimited(ip) {
  const now = Date.now();
  const hits = (rateHits[ip] || []).filter(function (t) { return now - t < RATE_WINDOW_MS; });
  hits.push(now);
  rateHits[ip] = hits;
  return hits.length > RATE_MAX;
}

function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || 'web').split(',')[0].trim();
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
  body = body || {};
  const message = (body.message ? String(body.message) : '').trim().slice(0, 1000);
  const history = Array.isArray(body.history) ? body.history.slice(-12) : [];
  const cart = (body.cart ? String(body.cart) : '').slice(0, 2000);
  const ip = clientIp(req);
  /* Id estable de esta conversacion (lo genera el navegador). Con el se
     aparta UNA sola reserva por charla y se excluye del chequeo de cruces,
     para no decirle al cliente que su propia fecha esta ocupada. */
  const sessionId = String(body.sessionId || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 32) ||
    ('ip' + ip.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20));
  const holdId = 'web_' + sessionId;

  if (!message) {
    res.status(400).json({ error: 'Falta el mensaje.' });
    return;
  }
  if (rateLimited(ip)) {
    res.status(429).json({ error: 'Vas muy rápido 🐰 Espera un ratito o escríbenos directo por WhatsApp al 956 206 360.' });
    return;
  }

  /* Fechas ocupadas: SIEMPRE desde Firestore (el calendario real). Lo que
     manda el navegador solo se usa si Firestore no esta disponible. */
  let bookedDates = await getBookedDates(holdId);
  if (bookedDates === null) {
    bookedDates = Array.isArray(body.bookedDates) ? body.bookedDates.slice(0, 60) : [];
  }

  try {
    const result = await askAssistant(message, history, bookedDates, cart, { channel: 'web', budgetMs: 20000 });
    let heldId = null;

    let reply = result.reply;

    /* Aparta fecha+horario en el calendario compartido. reserveBooking
       revisa y guarda en un solo paso (con candado por fecha): si otro
       cliente tomo ese horario en el mismo instante, este recibe 'clash'. */
    if (result.eventDateIso && result.eventStart && result.eventEnd) {
      const r = await reserveBooking(holdId, {
        client_name: String(body.clientName || 'Cliente Web').slice(0, 80),
        phone: body.clientPhone ? String(body.clientPhone).slice(0, 20) : null,
        event_date: result.eventDateIso,
        event_start: result.eventStart,
        event_end: result.eventEnd,
        status: 'chat_ia',
        source: 'web'
      });
      if (r.ok) heldId = holdId;
      else reply += '\n\n' + holdFailureNote(r.reason, 'web');
    }

    res.status(200).json({
      reply: reply,
      eventDateIso: result.eventDateIso,
      eventStart: result.eventStart,
      eventEnd: result.eventEnd,
      holdId: heldId
    });
  } catch (err) {
    console.error('chat.js error', err && (err.error || err.message || err));
    res.status(err.status || 500).json({ error: err.error || 'Error de conexión con el asistente.' });
  }
};
