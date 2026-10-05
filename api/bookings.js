/**
 * Calendario compartido (coleccion event_bookings en Firebase Firestore). Antes cada
 * navegador tenia su propio calendario en localStorage y nadie veia lo de
 * los demas; ahora todo pasa por aqui.
 *
 * GET  /api/bookings
 *   - Sin clave: solo fechas/horarios ocupados (sin nombres, telefonos ni
 *     montos) -- lo usa la vista cliente para no ofrecer fechas tomadas.
 *   - Con header x-admin-key = ADMIN_PASSWORD: todo, para el panel interno.
 *     Clave incorrecta -> 401 (asi el panel sabe que el login fallo).
 * POST /api/bookings  { action: 'create', record }
 *   - Publico: solo puede crear 'solicitud_enviada' (cliente que mando su
 *     pedido) y solo si la fecha no choca con otra reserva.
 *   - Admin: cualquier estado (pedido guardado, bloqueo manual, etc.).
 * POST /api/bookings  { action: 'update', id, fields }   (solo admin)
 * POST /api/bookings  { action: 'chats' }   (solo admin: resumen de chats de WhatsApp para el Excel)
 */

const crypto = require('crypto');
const { getClient, listBookings, insertBooking, updateBooking, reserveBooking, listConversations, getBooking } = require('./_db');

const STATUSES = ['guardado', 'solicitud_enviada', 'confirmado', 'bloqueado_manual', 'cancelado', 'chat_ia'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HOUR = /^\d{2}:\d{2}$/;

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

/* null = sin clave (publico), true = admin, false = clave incorrecta. */
function adminStatus(req) {
  const given = req.headers['x-admin-key'];
  if (!given) return null;
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(given, expected);
}

const RATE_WINDOW_MS = 10 * 60 * 1000;
const rateHits = {};
function rateLimited(req, max) {
  const ip = String(req.headers['x-forwarded-for'] || 'x').split(',')[0].trim();
  const now = Date.now();
  const hits = (rateHits[ip] || []).filter(function (t) { return now - t < RATE_WINDOW_MS; });
  hits.push(now);
  rateHits[ip] = hits;
  return hits.length > max;
}

function str(v, max) { return (v === undefined || v === null || v === '') ? null : String(v).slice(0, max); }
function num(v) { const n = Number(v); return isFinite(n) ? n : null; }

/* Solo pasan los campos conocidos y con formato valido. */
function cleanFields(src) {
  src = src || {};
  const out = {};
  if ('client_name' in src) out.client_name = str(src.client_name, 120);
  if ('phone' in src) out.phone = str(src.phone, 30);
  if ('event_date' in src) out.event_date = ISO_DATE.test(String(src.event_date || '')) ? src.event_date : null;
  if ('event_start' in src) out.event_start = HOUR.test(String(src.event_start || '')) ? src.event_start : null;
  if ('event_end' in src) out.event_end = HOUR.test(String(src.event_end || '')) ? src.event_end : null;
  if ('status' in src && STATUSES.indexOf(src.status) !== -1) out.status = src.status;
  if ('total' in src) out.total = num(src.total);
  if ('deposit_amount' in src) out.deposit_amount = num(src.deposit_amount);
  if ('deposit_method' in src) out.deposit_method = str(src.deposit_method, 30);
  if ('boleta_num' in src) out.boleta_num = str(src.boleta_num, 40);
  if ('source' in src) out.source = str(src.source, 30);
  if ('items' in src) {
    const items = Array.isArray(src.items) ? src.items : [];
    out.items = JSON.stringify(items).length <= 30000 ? items : [];
  }
  return out;
}

module.exports = async function handler(req, res) {
  if (!getClient()) {
    res.status(503).json({ error: 'El calendario compartido no está configurado (falta FIREBASE_SERVICE_ACCOUNT).' });
    return;
  }
  const admin = adminStatus(req);
  if (admin === false) {
    res.status(401).json({ error: 'Contraseña incorrecta.' });
    return;
  }

  if (req.method === 'GET') {
    const rows = await listBookings(admin === true);
    if (rows === null) { res.status(502).json({ error: 'No se pudo leer el calendario.' }); return; }
    res.setHeader('Cache-Control', 'no-store');
    const payload = { bookings: rows, admin: admin === true };
    /* Datos de la propietaria para el contrato (contrato-local.html): solo
       al panel con clave, nunca en el HTML publico ni en el repo. */
    if (admin === true) {
      payload.owner = {
        name: process.env.CONTRATO_PROPIETARIO_NOMBRE || '',
        dni: process.env.CONTRATO_PROPIETARIO_DNI || ''
      };
    }
    res.status(200).json(payload);
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  if (body.action === 'create') {
    if (admin !== true && rateLimited(req, 10)) {
      res.status(429).json({ error: 'Demasiados pedidos seguidos. Intenta en unos minutos.' });
      return;
    }
    const fields = cleanFields(body.record);
    if (admin !== true) {
      fields.status = 'solicitud_enviada';
      fields.source = 'web';
      delete fields.boleta_num;
    }
    if (!fields.status) fields.status = 'guardado';
    const chatHoldId = body.sessionId ? 'web_' + String(body.sessionId).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32) : null;

    /* Si el pedido llega sin fecha (la persona la escribio en texto libre)
       pero su chat ya habia apartado fecha y horario, se usan esos: asi el
       horario no se pierde al reemplazar el apartado por el pedido. */
    if (chatHoldId && !fields.event_date) {
      const hold = await getBooking(chatHoldId);
      if (hold && hold.status !== 'cancelado' && hold.event_date) {
        fields.event_date = hold.event_date;
        if (!fields.event_start) fields.event_start = hold.event_start || null;
        if (!fields.event_end) fields.event_end = hold.event_end || null;
      }
    }

    const newId = 'h' + Date.now() + crypto.randomBytes(3).toString('hex');
    let row;
    if (admin === true) {
      /* La dueña puede anotar lo que quiera aunque se cruce (ella decide). */
      fields.id = newId;
      row = await insertBooking(fields);
    } else {
      /* El cliente no puede pisar otra reserva. reserveBooking revisa y
         guarda en un solo paso con candado por fecha: si dos clientes
         confirman el mismo horario a la vez, solo uno lo obtiene. */
      const r = await reserveBooking(newId, fields, chatHoldId);
      if (!r.ok && r.reason === 'clash') {
        res.status(409).json({ error: 'Esa fecha acaba de ser tomada por otra reserva. Elige otra o escríbenos por WhatsApp.' });
        return;
      }
      row = r.ok ? r.booking : null;
    }
    if (!row) { res.status(502).json({ error: 'No se pudo guardar la reserva.' }); return; }

    /* El pedido real reemplaza al "hold" que habia apartado el chat. */
    if (chatHoldId) await updateBooking(chatHoldId, { status: 'cancelado' });

    res.status(200).json({ booking: row });
    return;
  }

  if (body.action === 'chats') {
    if (admin !== true) { res.status(401).json({ error: 'Solo el panel interno puede ver los chats.' }); return; }
    const chats = await listConversations();
    if (chats === null) { res.status(502).json({ error: 'No se pudieron leer los chats.' }); return; }
    res.status(200).json({ chats: chats });
    return;
  }

  if (body.action === 'update') {
    if (admin !== true) { res.status(401).json({ error: 'Solo el panel interno puede modificar reservas.' }); return; }
    const id = str(body.id, 80);
    if (!id) { res.status(400).json({ error: 'Falta el id.' }); return; }
    const row = await updateBooking(id, cleanFields(body.fields));
    if (!row) { res.status(404).json({ error: 'No se encontró la reserva.' }); return; }
    res.status(200).json({ booking: row });
    return;
  }

  res.status(400).json({ error: 'Acción desconocida.' });
};
