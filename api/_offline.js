/**
 * "Cerebro sin IA": responde y vende aunque Gemini no este disponible
 * (keys agotadas, Google caido, etc.), y tambien se usa ANTES de la IA
 * cuando el mensaje es simple, para ahorrar tokens.
 *
 * Entiende lo que mas se repite en una conversacion de venta:
 *   - fecha  ("el 20 de noviembre", "20/11", "este sabado", "el sabado 15")
 *   - horario ("de 3 a 8", "3pm a 8pm", "15:00 a 20:00", "de 4 a 9 de la noche")
 *   - invitados ("50 niños", "somos 80 personas")
 *   - presupuesto ("tengo 1500", "presupuesto de S/2000")
 *   - tipo de evento (cumpleaños, baby shower, bautizo, comunion...)
 *   - interes en una categoria del catalogo
 * Con eso revisa disponibilidad en el calendario real, devuelve fecha y
 * horario para que se aparten (igual que la IA) y siempre empuja el local
 * de Magic Box. Cierra con la pregunta del dato que falte (mismo checklist
 * del prompt: fecha, horario, distrito, invitados).
 *
 * offlineReply() SIEMPRE devuelve una respuesta. confident=false significa
 * "no entendi nada concreto": la IA lo haria mejor si esta disponible.
 */

const C = require('./_canned');

/* Como C.normalize pero conserva "/", ":", "." y "-": hacen falta para
   leer "20/11", "15:00" o "S/ 2.500". */
function normText(s) {
  return String(s || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ\/:.,\- ]+/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

/* ---------------- Fechas y horas (hora de Lima, UTC-5) ---------------- */

const MONTH_NUM = { enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12 };
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const WEEKDAY_LABEL = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTH_LABEL = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function limaToday() {
  const d = new Date(Date.now() - 5 * 3600 * 1000);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function iso(d) { return d.toISOString().slice(0, 10); }
function makeDate(y, m, day) {
  const d = new Date(Date.UTC(y, m - 1, day));
  return (d.getUTCMonth() === m - 1 && d.getUTCDate() === day) ? d : null;
}
/* Dia/mes sin año -> la proxima vez que ocurra (si ya paso este año, el siguiente). */
function nextOccurrence(month, day, today) {
  let d = makeDate(today.getUTCFullYear(), month, day);
  if (d && d < today) d = makeDate(today.getUTCFullYear() + 1, month, day);
  return d;
}

function parseDate(text) {
  const today = limaToday();
  let m;
  // "20 de noviembre (de 2026)"
  m = new RegExp('\\b(\\d{1,2})\\s*(?:de\\s*)?(' + Object.keys(MONTH_NUM).join('|') + ')(?:\\s*(?:de|del)?\\s*(20\\d\\d))?\\b').exec(text);
  if (m) {
    const day = +m[1], month = MONTH_NUM[m[2]];
    const d = m[3] ? makeDate(+m[3], month, day) : nextOccurrence(month, day, today);
    if (d && d >= today) return d;
  }
  // "20/11", "20/11/2026", "20-11"
  m = /\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/.exec(text);
  if (m && +m[2] >= 1 && +m[2] <= 12) {
    let y = m[3] ? +m[3] : null;
    if (y && y < 100) y += 2000;
    const d = y ? makeDate(y, +m[2], +m[1]) : nextOccurrence(+m[2], +m[1], today);
    if (d && d >= today) return d;
  }
  // "el sabado 15" -> dia 15 (proximo mes que lo tenga), "este sabado", "el proximo domingo"
  m = new RegExp('\\b(este|esta|el proximo|la proxima|proximo|el|para el)?\\s*(' + WEEKDAYS.join('|') + ')(?:\\s+(\\d{1,2}))?\\b').exec(text);
  if (m) {
    const wd = WEEKDAYS.indexOf(m[2]);
    if (m[3]) {
      const day = +m[3];
      for (let k = 0; k < 13; k++) {
        const base = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + k, 1));
        const d = makeDate(base.getUTCFullYear(), base.getUTCMonth() + 1, day);
        if (d && d >= today && d.getUTCDay() === wd) return d;
      }
    } else if (m[1]) {
      let diff = (wd - today.getUTCDay() + 7) % 7;
      if (diff === 0) diff = 7;
      if (/proxim/.test(m[1]) && diff < 7) diff += 0; /* "el proximo sabado" = el sabado que viene */
      return new Date(today.getTime() + diff * 86400000);
    }
  }
  if (/\bpasado manana\b/.test(text)) return new Date(today.getTime() + 2 * 86400000);
  if (/(^|[^a-z])manana\b/.test(text) && !/de la manana/.test(text)) return new Date(today.getTime() + 86400000);
  if (/\bhoy\b/.test(text)) return today;
  return null;
}

function pad(n) { return String(n).padStart(2, '0'); }

/* Devuelve { start: 'HH:MM', end: 'HH:MM' } solo si el horario es claro. */
function parseTimeRange(text) {
  const re = /(?:\b(de|desde)\s+)?(?:las\s+)?(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm|a\s?m|p\s?m|hrs?|horas)?\s*(?:a|hasta|al|-)\s*(?:las\s+)?(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm|a\s?m|p\s?m|hrs?|horas)?(\s*de la (?:tarde|noche|manana))?/g;
  let m;
  while ((m = re.exec(text))) {
    const after = text.slice(re.lastIndex, re.lastIndex + 14);
    if (/^\s*(de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|sept|setiembre|octubre|noviembre|diciembre|personas|invitados|ninos|soles)/.test(after)) continue;
    let h1 = +m[2], h2 = +m[5];
    const mm1 = m[3] ? +m[3] : 0, mm2 = m[6] ? +m[6] : 0;
    if (h1 > 24 || h2 > 24 || mm1 > 59 || mm2 > 59) continue;
    const before = text.slice(Math.max(0, m.index - 16), m.index);
    const ap1 = (m[4] || '').replace(/\s/g, ''), ap2 = (m[7] || '').replace(/\s/g, '');
    const tail = m[8] || '';
    const hasMarker = ap1 || ap2 || m[3] || m[6] || tail || /\blas\b/.test(m[0]) || /(horario|hora|desde|de)\s*$/.test(before) || m[1];
    if (!hasMarker) continue;
    const pmAll = ap2 === 'pm' || /tarde|noche/.test(tail);
    const amAll = ap2 === 'am' || /manana/.test(tail);
    // inicio
    if (ap1 === 'pm' || (!ap1 && pmAll && h1 < 12 && h1 + 12 <= (h2 < 12 ? h2 + 12 : h2))) h1 = h1 < 12 ? h1 + 12 : h1;
    else if (!ap1 && !amAll && h1 >= 1 && h1 <= 8) h1 += 12;           /* "de 3 a 8": fiesta de tarde */
    // fin
    if (ap2 === 'pm' || /tarde|noche/.test(tail)) { if (h2 < 12) h2 += 12; }
    else if (!ap2 && h2 < 12 && h2 * 60 + mm2 <= h1 * 60 + mm1) h2 += 12;
    if (h2 === 24) h2 = 23, m[6] = '59';
    const s = h1 * 60 + mm1, e = h2 * 60 + (m[6] ? +m[6] : mm2);
    if (e <= s || e - s > 12 * 60 || e - s < 60) continue;
    return { start: pad(h1) + ':' + pad(mm1), end: pad(h2) + ':' + pad(m[6] ? +m[6] : mm2) };
  }
  return null;
}

function parseGuests(text) {
  let m = /\b(\d{2,3})\s*(invitados|personas|ninos|ninas|nenes|chicos|chicas|adultos|pax|peques|criaturas|amiguitos)\b/.exec(text);
  if (!m) m = /\b(?:somos|seremos|vendran|vienen|para)\s+(?:unos?\s+|como\s+|aprox(?:imadamente)?\s+)?(\d{2,3})\b(?!\s*(?:soles|am|pm|hrs|horas|:|de (?:la|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)))/.exec(text);
  if (!m) return null;
  const n = +m[1];
  return n >= 5 && n <= 500 ? n : null;
}

function parseBudget(text) {
  let m = /\b(?:presupuesto|tengo|cuento con|gastar|invertir|hasta|maximo|max)\D{0,14}?(?:s\s?\/?\.?\s*)?(\d{1,2}[.,]?\d{3}|\d{3,5})\b/.exec(text);
  if (!m) m = /\bs\s?\/\.?\s*(\d{1,2}[.,]?\d{3}|\d{3,5})\b/.exec(text);
  if (!m) m = /\b(\d{1,2}[.,]?\d{3}|\d{3,5})\s*(soles|lucas)\b/.exec(text);
  if (!m) return null;
  const n = +m[1].replace(/[.,]/g, '');
  return n >= 300 && n <= 50000 ? n : null;
}

const EVENT_TYPES = [
  ['babyshower', /\b(baby ?shower|babyshower|revelacion de genero|gender reveal)\b/],
  ['bautizo', /\b(bautizo|bautismo)\b/],
  ['comunion', /\b(primera comunion|comunion|confirmacion)\b/],
  ['quince', /\b(quince anos|quinceanero|quinceanera|15 anos|xv)\b/],
  ['cumple', /\b(cumpleanos|cumple|cumpleano|birthday|fiesta infantil|fiestita)\b/],
  ['promo', /\b(graduacion|promocion de (colegio|nido|inicial)|fiesta de promo)\b/],
  ['adultos', /\b(aniversario|reunion familiar|reunion|despedida|fiesta de empresa|corporativo|matrimonio|boda)\b/]
];
function parseEventType(text) {
  for (const [k, re] of EVENT_TYPES) if (re.test(text)) return k;
  return null;
}

/* ---------------- Catalogo y paquetes (sacados del mismo CATALOG_SUMMARY) ---------------- */

function catalogIndex(summary) {
  const cats = C.parseCatalog(summary);
  const items = {};
  Object.keys(cats).forEach(function (cat) {
    cats[cat].forEach(function (line) {
      const sep = line.indexOf(' — ');
      const name = sep === -1 ? line : line.slice(0, sep);
      const pm = /S\/(\d+(?:\.\d+)?)/.exec(line);
      items[name] = { name: name, cat: cat, price: pm ? +pm[1] : null, line: line };
    });
  });
  return { cats: cats, items: items };
}
function price(idx, name) { return (idx.items[name] && idx.items[name].price) || 0; }

function packages(idx) {
  const p = function (n) { return price(idx, n); };
  return [
    { key: 'basico', label: 'Básico', parts: ['Paquete Happy', 'Animadora temática'], desc: 'local 5h + animadora temática (show de 90 min)' },
    { key: 'snacks', label: 'Con snacks', parts: ['Paquete Happy', 'Animadora temática', 'Combo 1'], desc: 'local 5h + animadora + algodón y popcorn ilimitado' },
    { key: 'medio', label: 'Medio', parts: ['Paquete Full', 'Animadora + bailarina', 'Combo 3'], desc: 'local decorado + animadora y bailarina + panchos, salchipapas y algodón o popcorn ilimitado' },
    { key: 'premium', label: 'Premium', parts: ['Paquete Full', 'Animadora + bailarina + personaje', 'Combo 4', 'Maqueta (diseño a elegir) + tortas en cajita', 'Fotografía'], desc: 'local decorado + show con personaje + combo de hamburguesas y salchipapas + maqueta con 50 tortas + fotografía' }
  ].map(function (pk) {
    pk.total = pk.parts.reduce(function (s, n) { return s + p(n); }, 0);
    return pk;
  });
}

/* ---------------- Utilidades de texto ---------------- */

function money(n) { return 'S/' + (Number.isInteger(n) ? n : n.toFixed(2)); }
function dateLabel(d) {
  return WEEKDAY_LABEL[d.getUTCDay()] + ' ' + d.getUTCDate() + ' de ' + MONTH_LABEL[d.getUTCMonth() + 1];
}
function hourLabel(hhmm) {
  const h = +hhmm.slice(0, 2), mm = hhmm.slice(3);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return h12 + (mm !== '00' ? ':' + mm : '') + (h < 12 ? 'am' : 'pm');
}
function toMins(t) { const p = String(t).split(':'); return (+p[0]) * 60 + (+(p[1] || 0)); }

/* Cruza fecha/horario contra las reservas activas (mismo criterio que el prompt). */
function availability(dateIso, range, bookedDates) {
  const same = (bookedDates || []).filter(function (b) { return b.date === dateIso; });
  if (!same.length) return { free: true };
  const fullDay = same.find(function (b) { return !b.hours; });
  if (fullDay) return { free: false, fullDay: true };
  const ranges = same.map(function (b) { const h = b.hours.split(' a '); return [toMins(h[0]), toMins(h[1]), b.hours]; });
  if (!range) return { free: null, partial: ranges.map(function (r) { return r[2]; }) };
  const s = toMins(range.start), e = toMins(range.end);
  const clash = ranges.find(function (r) { return s < r[1] && r[0] < e; });
  return clash ? { free: false, clash: clash[2], partial: ranges.map(function (r) { return r[2]; }) } : { free: true };
}

/* Ultimo valor que la persona dio en la charla (mensaje actual primero). */
function lastFromHistory(history, message, parser) {
  const v = parser(normText(message));
  if (v) return { value: v, now: true };
  const users = (Array.isArray(history) ? history : []).filter(function (m) { return m && m.role === 'user'; });
  for (let i = users.length - 1; i >= 0; i--) {
    const pv = parser(normText(users[i].text));
    if (pv) return { value: pv, now: false };
  }
  return null;
}

function alreadySaid(history, needle) {
  return (Array.isArray(history) ? history : []).some(function (m) { return m && m.role === 'model' && String(m.text).indexOf(needle) !== -1; });
}

/* ---------------- Respuesta ---------------- */

function offlineReply(message, history, bookedDates, ctx) {
  ctx = ctx || {};
  const idx = catalogIndex(ctx.catalogSummary);
  const text = normText(message);
  const plain = C.normalize(message);
  const B = ctx.channel === 'whatsapp' ? function (s) { return '*' + s + '*'; } : function (s) { return '**' + s + '**'; };
  const parts = [];
  let confident = false;
  let pitchedVenue = alreadySaid(history, 'nuestro local') || alreadySaid(history, 'Paquete Happy');

  const dateHit = lastFromHistory(history, message, parseDate);
  const timeHit = lastFromHistory(history, message, parseTimeRange);
  const guests = parseGuests(text);
  const budget = parseBudget(text);
  const eventType = parseEventType(text);
  const date = dateHit && dateHit.value;
  const range = timeHit && timeHit.value;
  let result = { eventDateIso: null, eventStart: null, eventEnd: null };

  // 1) Fecha / horario: disponibilidad real
  if (date && (dateHit.now || (timeHit && timeHit.now))) {
    confident = true;
    const dIso = iso(date);
    const av = availability(dIso, range, bookedDates);
    const when = B(dateLabel(date)) + (range ? ' de ' + hourLabel(range.start) + ' a ' + hourLabel(range.end) : '');
    if (av.free === false) {
      parts.push(av.fullDay
        ? C.pick(['Uy, el ' + when + ' ya está tomado 😕', 'Ese día (' + when + ') ya tenemos el local reservado 😕']) +
          ' ¿Te sirve otra fecha cercana? Dime cuál y te la reviso al toque.'
        : C.pick(['Uy, ese horario se cruza con otra fiesta (ocupado de ' + av.clash + ') 😕', 'Ese horario ya está tomado: hay un evento de ' + av.clash + ' 😕']) +
          ' Ese mismo día podemos antes o después de ese rango, o si prefieres revisamos otra fecha.');
    } else if (av.free === null) {
      parts.push('El ' + when + ' hay un evento de ' + av.partial.join(' y de ') + ', así que quedan horarios libres fuera de ese rango 😊 ¿En qué horario lo pensabas?');
    } else {
      parts.push(C.pick(['¡Buenísimo! El ' + when + ' está libre 🎉', '¡Tengo buenas noticias! El ' + when + ' está disponible 🥳', '¡Perfecto! El ' + when + ' lo tenemos libre ✨']));
      if (range) {
        result = { eventDateIso: dIso, eventStart: range.start, eventEnd: range.end };
        parts.push(C.pick(['Ya te lo dejo apartado por 3 días para que nadie te lo gane.', 'Te lo separo por 3 días mientras decides, así nadie más lo toma 😉']));
      }
      const wd = date.getUTCDay();
      if (wd >= 1 && wd <= 4 && price(idx, 'Local de lunes a jueves')) {
        parts.push('Y como es ' + WEEKDAY_LABEL[wd] + ', te sale más a cuenta: el ' + B('local de lunes a jueves') + ' es solo ' + money(price(idx, 'Local de lunes a jueves')) + ' por 5 horas (hasta las 9pm) 💸');
        pitchedVenue = true;
      } else if (!pitchedVenue) {
        parts.push('Nuestro local en La Perla es ideal para eso: el ' + B('Paquete Happy') + ' (5 horas, hasta 100 personas) sale ' + money(price(idx, 'Paquete Happy')) + ', y el ' + B('Paquete Full') + ' ya decorado con sonido y 70 sillas, ' + money(price(idx, 'Paquete Full')) + '.');
        pitchedVenue = true;
      }
    }
  }

  // 2) Invitados
  if (guests) {
    confident = true;
    if (guests > 100) {
      parts.push('Para ' + guests + ' personas ojo: nuestro local tiene aforo máximo de 100 (contando niños y proveedores). Si pueden ajustar la lista, ¡entran perfecto! Y si la fiesta es en otro lugar, igual llevamos shows, snacks y todo lo demás 🎉');
    } else {
      parts.push(C.pick([guests + ' invitados, ¡qué lindo! 🎉', 'Para ' + guests + ' personas queda genial 😊', '¡' + guests + ' invitados, fiesta asegurada! 🎈']) +
        (pitchedVenue ? '' : ' Entran cómodos en nuestro local (hasta 100 personas).'));
      if (guests >= 30 && !alreadySaid(history, 'Combo')) {
        parts.push('Para esa cantidad, los ' + B('combos de snacks') + ' rinden muy bien: por ejemplo el Combo 3 (50 panchos + 50 salchipapas + algodón o popcorn ilimitado) a ' + money(price(idx, 'Combo 3')) + '.');
      }
    }
  }

  // 3) Presupuesto -> paquete que calza
  if (budget) {
    confident = true;
    const pks = packages(idx).filter(function (p) { return p.total > 0; });
    const fit = pks.filter(function (p) { return p.total <= budget; }).pop();
    if (fit) {
      parts.push('Con ' + money(budget) + ' te alcanza muy bien para el paquete ' + B(fit.label) + ' (desde ' + money(fit.total) + '): ' + fit.desc + '. Se puede ajustar a tu gusto 😉');
    } else {
      const lw = price(idx, 'Local de lunes a jueves');
      parts.push('Con ' + money(budget) + ' podemos armar algo bonito 😊 ' +
        (lw ? 'Por ejemplo, el ' + B('local de lunes a jueves') + ' sale ' + money(lw) + ', y le sumas un show o un combo de snacks según lo que alcance.' : 'Te propongo empezar por un combo de snacks o un show y lo vamos ajustando.'));
    }
  }

  // 4) Tipo de evento -> propuesta
  if (eventType && !budget) {
    confident = true;
    const happy = price(idx, 'Paquete Happy');
    const intros = {
      cumple: '¡Un cumple! 🎂 Lo que más se pide: nuestro local + show + snacks. Por ejemplo ' + B('Paquete Happy') + ' + ' + B('animadora temática') + ' desde ' + money(happy + price(idx, 'Animadora temática')) + ', y si le sumas el Combo 1 (algodón + popcorn ilimitado) queda en ' + money(happy + price(idx, 'Animadora temática') + price(idx, 'Combo 1')) + '.',
      babyshower: '¡Qué emoción, un baby shower! 🍼 Nuestro local + el ' + B('show de baby shower') + ' (desde ' + money(price(idx, 'Paquete 1')) + ') + bocaditos temáticos quedan precioso. Y la ' + B('fotografía') + ' (' + money(price(idx, 'Fotografía')) + ') para guardar el recuerdo.',
      bautizo: '¡Un bautizo! 🕊️ Nuestro local queda hermoso para eso: ' + B('Paquete Full') + ' ya decorado (' + money(price(idx, 'Paquete Full')) + '), con mesa de bocaditos temáticos y el foam personalizado para el atril de bienvenida (' + money(price(idx, 'Foam personalizado para atril de bienvenida')) + ').',
      comunion: '¡Felicidades por la comunión! ✨ Te recomiendo nuestro local con el ' + B('Paquete Full') + ' decorado (' + money(price(idx, 'Paquete Full')) + '), bocaditos temáticos y la torta en maqueta.',
      quince: '¡Unos quince! 💃 Nuestro local con ' + B('DJ') + ', luces LED y una ' + B('hora loca') + ' con robot LED es la combinación ganadora; la pista LED sale ' + money(price(idx, 'Pista LED')) + ' por m².',
      promo: '¡Una promo! 🎓 En nuestro local armamos fiesta con DJ, hora loca y snacks; el ' + B('Paquete Full') + ' sale ' + money(price(idx, 'Paquete Full')) + '.',
      adultos: '¡Claro que también hacemos reuniones de grandes! 🥂 Nuestro local entra hasta 100 personas: ' + B('Paquete Happy') + ' ' + money(happy) + ' o el ' + B('Paquete Full') + ' ya decorado ' + money(price(idx, 'Paquete Full')) + '.'
    };
    if (!pitchedVenue || !dateHit || !dateHit.now) parts.push(intros[eventType]);
    pitchedVenue = true;
  }

  // 5) Categoria mencionada (aunque el mensaje traiga numeros)
  if (!confident) {
    const cats = Object.keys(C.CATEGORY_KEYWORDS).filter(function (c) { return C.CATEGORY_KEYWORDS[c].test(plain); });
    if (cats.length === 1 && idx.cats[cats[0]]) {
      confident = true;
      const lines = idx.cats[cats[0]].slice(0, 4).map(function (l) {
        const sep = l.indexOf(' — ');
        const pr = /\(([^()]*S\/[^()]*)\)\s*$/.exec(l);
        return '• ' + B(sep === -1 ? l : l.slice(0, sep)) + (pr ? ': ' + pr[1] : '');
      });
      parts.push('Te cuento lo de ' + B(cats[0]) + ':\n' + lines.join('\n') + (idx.cats[cats[0]].length > 4 ? '\n…y más opciones en el catálogo.' : ''));
    }
  }

  // 6) No entendi nada concreto: respuesta de venta generica (nunca "no disponible")
  if (!parts.length) {
    parts.push(C.pick([
      '¡Te ayudo con eso! 🐰 Para darte el dato exacto déjame armarte una propuesta: nuestro local en La Perla con show incluido sale desde ' + money(price(idx, 'Paquete Happy') + price(idx, 'Animadora temática')) + '.',
      '¡Claro! 😊 Cuéntame un poquito más de tu fiesta y te armo algo a la medida. Para que tengas una idea, el ' + B('Paquete Happy') + ' (local 5 horas, hasta 100 personas) sale ' + money(price(idx, 'Paquete Happy')) + '.',
      '¡Buena pregunta! 🐰 Para eso lo mejor es que lo veas con el equipo al ' + C.PHONE + ', pero mientras tanto te ayudo a armar tu fiesta: el local con show y snacks va desde ' + money(price(idx, 'Paquete Happy') + price(idx, 'Animadora temática') + price(idx, 'Combo 1')) + '.'
    ]));
  }

  parts.push(C.nextQuestion(history, message));
  let reply = parts.join('\n\n');
  if (ctx.channel === 'whatsapp') reply = reply.replace(/\*\*/g, '*');
  return Object.assign({ reply: reply, confident: confident }, result);
}

module.exports = { offlineReply, normText, parseDate, parseTimeRange, parseGuests, parseBudget, parseEventType };
