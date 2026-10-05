/**
 * Base de datos en la nube: Firebase Firestore (via firebase-admin, solo en
 * el servidor). Es la UNICA fuente de verdad del calendario y del historial
 * de WhatsApp. La usan el chat web (api/chat.js), el bot de WhatsApp
 * (api/whatsapp.js) y el panel interno (api/bookings.js).
 *
 * Colecciones:
 *   event_bookings/{id}           reservas, pedidos, bloqueos y "holds" del chat
 *   booking_locks/{AAAA-MM-DD}    candado por fecha (ver reserveBooking)
 *   whatsapp_conversations/{tel}  historial del bot de WhatsApp
 *
 * Credenciales (Vercel + .env), una de estas dos formas:
 *   FIREBASE_SERVICE_ACCOUNT = el JSON de la cuenta de servicio (tal cual o en base64)
 *   o FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
 * Nunca deben llegar al navegador. Las reglas de Firestore (firestore.rules)
 * niegan todo acceso directo desde fuera; firebase-admin no pasa por ellas.
 */

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const BOOKINGS = 'event_bookings';
const LOCKS = 'booking_locks';
const CONVERSATIONS = 'whatsapp_conversations';

/* Estados que ocupan la fecha para siempre (hasta que la dueña los libere).
   Cualquier otro estado distinto de 'cancelado' es un "hold" temporal que
   vence a las HOLD_HOURS de su ultima actualizacion -- mismo criterio de
   3 dias que usa el negocio para "pendiente de pago". */
const PERMANENT_STATUSES = ['confirmado', 'bloqueado_manual'];
const HOLD_HOURS = 72;

let db = null;
let initFailed = false;

function serviceAccount() {
  const raw = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();
  if (raw) {
    const json = raw.charAt(0) === '{' ? raw : Buffer.from(raw, 'base64').toString('utf8');
    return JSON.parse(json);
  }
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return {
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    };
  }
  return null;
}

/* null = Firebase no configurado (o credenciales invalidas): quien llama
   decide que hacer (el chat sigue vendiendo, el panel usa su copia local). */
function getClient() {
  if (db) return db;
  if (initFailed) return null;
  try {
    const sa = serviceAccount();
    if (!sa) return null;
    const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(sa) });
    db = getFirestore(app);
    db.settings({ ignoreUndefinedProperties: true });
    return db;
  } catch (err) {
    initFailed = true;
    console.error('Firebase: credenciales invalidas --', err.message);
    return null;
  }
}

/* Fecha de hoy en Lima (UTC-5, sin horario de verano). */
function todayLima() {
  return new Date(Date.now() - 5 * 3600 * 1000).toISOString().slice(0, 10);
}
function nowIso() { return new Date().toISOString(); }
function hhmm(t) { return t ? String(t).slice(0, 5) : null; }
function toMins(t) {
  if (!t) return 0;
  const parts = String(t).split(':');
  return (parseInt(parts[0], 10) * 60) + parseInt(parts[1] || 0, 10);
}
function rowOf(doc) { return Object.assign({ id: doc.id }, doc.data()); }

function isActive(row, now) {
  if (!row || row.status === 'cancelado') return false;
  if (PERMANENT_STATUSES.indexOf(row.status) !== -1) return true;
  const ts = Date.parse(row.updated_at || row.created_at || '');
  if (!ts) return true; /* sin fecha de alta: mejor ocupar que cruzar dos fiestas */
  return (now - ts) < HOLD_HOURS * 3600 * 1000;
}

/* ¿La reserva b choca con el horario pedido? Sin horas (de cualquiera de
   los dos lados) se asume dia completo. */
function overlaps(b, start, end) {
  if (!start || !end || !b.event_start || !b.event_end) return true;
  return toMins(start) < toMins(b.event_end) && toMins(b.event_start) < toMins(end);
}

/* Reservas que HOY ocupan el calendario (no canceladas y no vencidas).
   excludeId: la reserva del propio cliente que esta chateando -- para que
   el bot no le diga "esa fecha ya esta ocupada" por su propio apartado.
   Devuelve null si Firebase no esta configurado o falla. */
async function getActiveBookings(opts) {
  const fs = getClient();
  if (!fs) return null;
  opts = opts || {};
  try {
    let q = fs.collection(BOOKINGS);
    if (opts.date) q = q.where('event_date', '==', opts.date);
    else if (opts.fromDate) q = q.where('event_date', '>=', opts.fromDate);
    const snap = await q.limit(500).get();
    const now = Date.now();
    return snap.docs.map(rowOf).filter(function (r) { return r.id !== opts.excludeId && isActive(r, now); });
  } catch (err) {
    console.error('Firestore getActiveBookings error', err.message);
    return null;
  }
}

/* Resumen corto para el prompt de la IA (sin datos personales). Solo
   fechas de hoy en adelante: lo pasado no sirve y gasta tokens. */
async function getBookedDates(excludeId) {
  const rows = await getActiveBookings({ fromDate: todayLima(), excludeId: excludeId });
  if (rows === null) return null;
  return rows.map(function (r) {
    const start = hhmm(r.event_start), end = hhmm(r.event_end);
    return {
      date: r.event_date,
      hours: (start && end) ? (start + ' a ' + end) : null,
      status: PERMANENT_STATUSES.indexOf(r.status) !== -1 ? 'confirmado' : 'reservado_pendiente_pago'
    };
  });
}

/* Reserva ATOMICA: revisa que el horario este libre y guarda, en una sola
   transaccion. Todas las reservas de un mismo dia leen y escriben el
   documento booking_locks/{fecha}; si dos clientes (dos links, dos
   celulares) piden ese dia al mismo tiempo, Firestore hace que una espere
   y reintente, y al reintentar ya ve la reserva de la otra -> 'clash'.
   Devuelve { ok, reason?, booking? }:
     reason 'clash' = ese horario ya lo tiene otra reserva
     reason 'no_db' / 'error' = no se pudo guardar (no se aparta nada).
   excludeId: la reserva que NO cuenta como cruce (p. ej. el hold del chat
   de la misma persona que ahora confirma su pedido). La propia reserva
   (mismo id) tampoco cuenta: asi el cliente puede mover su horario. */
async function reserveBooking(id, fields, excludeId) {
  const fs = getClient();
  if (!fs) return { ok: false, reason: 'no_db' };
  const date = fields.event_date || null;
  const ref = fs.collection(BOOKINGS).doc(id);
  try {
    return await fs.runTransaction(async function (tx) {
      // --- lecturas (en una transaccion van todas antes de cualquier escritura) ---
      const lockRef = date ? fs.collection(LOCKS).doc(date) : null;
      if (lockRef) await tx.get(lockRef);
      const sameDay = date ? (await tx.get(fs.collection(BOOKINGS).where('event_date', '==', date))).docs.map(rowOf) : [];
      const existing = await tx.get(ref);

      const now = Date.now();
      const clash = sameDay.find(function (b) {
        return b.id !== id && b.id !== excludeId && isActive(b, now) && overlaps(b, fields.event_start, fields.event_end);
      });
      if (clash) return { ok: false, reason: 'clash' };

      // --- escrituras ---
      const stamp = nowIso();
      const prev = existing.exists ? existing.data() : null;
      const row = {
        client_name: fields.client_name || (prev && prev.client_name) || null,
        phone: fields.phone || (prev && prev.phone) || null,
        event_date: date,
        event_start: fields.event_start || null,
        event_end: fields.event_end || null,
        status: fields.status || 'chat_ia',
        source: fields.source || (prev && prev.source) || null,
        total: 'total' in fields ? (Number(fields.total) || 0) : (prev ? prev.total || 0 : 0),
        items: 'items' in fields ? (fields.items || []) : (prev ? prev.items || [] : []),
        deposit_amount: 'deposit_amount' in fields ? fields.deposit_amount : (prev ? prev.deposit_amount : undefined),
        deposit_method: 'deposit_method' in fields ? fields.deposit_method : (prev ? prev.deposit_method : undefined),
        boleta_num: 'boleta_num' in fields ? fields.boleta_num : (prev ? prev.boleta_num : undefined),
        created_at: (prev && prev.created_at) || stamp,
        updated_at: stamp
      };
      tx.set(ref, row);
      if (lockRef) tx.set(lockRef, { updated_at: stamp, n: FieldValue.increment(1) }, { merge: true });
      return { ok: true, booking: Object.assign({ id: id }, row) };
    });
  } catch (err) {
    console.error('Firestore reserveBooking error', err.message);
    return { ok: false, reason: 'error' };
  }
}

/* Texto que se suma a la respuesta del bot cuando el apartado no se pudo
   guardar, para no prometer algo que no quedo en el calendario. */
function holdFailureNote(reason) {
  if (reason === 'clash') {
    return '⚠️ Ojo: justo en este momento otra persona separó ese horario. ¿Te reviso otro horario u otra fecha?';
  }
  return 'Para dejarlo 100% separado, confírmalo con el equipo por WhatsApp al 956 206 360 😉';
}

/* ---- Panel interno (api/bookings.js) ---- */

async function listBookings(isAdmin) {
  const fs = getClient();
  if (!fs) return null;
  if (!isAdmin) {
    /* Publico (vista cliente): solo lo necesario para saber que fechas
       estan tomadas -- sin nombres, telefonos ni montos. */
    const rows = await getActiveBookings({ fromDate: todayLima() });
    return rows === null ? null : rows.map(function (r) {
      return { id: r.id, event_date: r.event_date, event_start: hhmm(r.event_start), event_end: hhmm(r.event_end), status: r.status, updated_at: r.updated_at || r.created_at };
    });
  }
  try {
    const snap = await fs.collection(BOOKINGS).orderBy('event_date', 'desc').limit(1000).get();
    return snap.docs.map(rowOf);
  } catch (err) {
    console.error('Firestore listBookings error', err.message);
    return null;
  }
}

/* Alta directa (solo la dueña, que puede anotar aunque se cruce). */
async function insertBooking(row) {
  const fs = getClient();
  if (!fs) return null;
  const stamp = nowIso();
  const data = Object.assign({}, row, { created_at: stamp, updated_at: stamp });
  delete data.id;
  try {
    await fs.collection(BOOKINGS).doc(row.id).create(data);
    return Object.assign({ id: row.id }, data);
  } catch (err) {
    console.error('Firestore insertBooking error', err.message);
    return null;
  }
}

async function updateBooking(id, fields) {
  const fs = getClient();
  if (!fs) return null;
  const ref = fs.collection(BOOKINGS).doc(id);
  try {
    const snap = await ref.get();
    if (!snap.exists) return null;
    const changes = Object.assign({}, fields, { updated_at: nowIso() });
    await ref.update(changes);
    return Object.assign({ id: id }, snap.data(), changes);
  } catch (err) {
    console.error('Firestore updateBooking error', err.message);
    return null;
  }
}

/* ---- Historial de WhatsApp ---- */

async function getConversation(phone) {
  const fs = getClient();
  if (!fs) return [];
  try {
    const snap = await fs.collection(CONVERSATIONS).doc(phone).get();
    const data = snap.exists ? snap.data() : null;
    return (data && Array.isArray(data.history)) ? data.history : [];
  } catch (err) {
    console.error('Firestore getConversation error', err.message);
    return [];
  }
}

async function saveConversation(phone, history) {
  const fs = getClient();
  if (!fs) return;
  try {
    await fs.collection(CONVERSATIONS).doc(phone).set({ history: history, updated_at: nowIso() });
  } catch (err) {
    console.error('Firestore saveConversation error', err.message);
  }
}

module.exports = {
  getClient, getConversation, saveConversation,
  getBookedDates, reserveBooking, holdFailureNote,
  listBookings, insertBooking, updateBooking
};
