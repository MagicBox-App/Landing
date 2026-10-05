/**
 * Respuestas pregrabadas para las preguntas mas repetidas (saludo,
 * direccion, pagos, "¿eres un bot?", precios de una categoria, etc.).
 * Se responden sin llamar a Gemini: son instantaneas, no gastan cuota y
 * nunca fallan. Para que no suenen a guion, cada una tiene varias
 * versiones que se eligen al azar, y la pregunta del final se arma segun
 * que dato del evento (fecha, horario, distrito, invitados) todavia falta
 * en la charla -- igual que haria el asistente con IA.
 *
 * Regla de oro: ante la duda, devolver null y dejar que responda la IA.
 * Por eso solo se activan con mensajes cortos, de UNA sola intencion y
 * sin numeros (un numero casi siempre es una fecha, hora o cantidad que
 * la IA tiene que leer y apartar en el calendario).
 */

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function maybe(p) { return Math.random() < p; }

function normalize(s) {
  return String(s || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ ]+/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

const PHONE = '956 206 360';
const ADDRESS = 'Av. de los Insurgentes 425, La Perla';

/* ---------- ¿Que dato del evento falta? (mismo checklist del prompt) ---------- */

const MONTHS = 'enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre';
const DISTRICTS = [
  'miraflores', 'surco', 'santiago de surco', 'san borja', 'la molina', 'san isidro', 'la perla', 'callao',
  'bellavista', 'la punta', 'carmen de la legua', 'ventanilla', 'san miguel', 'magdalena', 'pueblo libre',
  'jesus maria', 'lince', 'barranco', 'chorrillos', 'ate', 'vitarte', 'santa anita', 'los olivos', 'comas',
  'independencia', 'san martin de porres', 'smp', 'san juan de lurigancho', 'sjl', 'villa el salvador',
  'villa maria', 'vmt', 'san juan de miraflores', 'sjm', 'brena', 'rimac', 'cercado', 'la victoria',
  'surquillo', 'san luis', 'el agustino', 'chaclacayo', 'cieneguilla', 'pachacamac', 'lurin', 'carabayllo',
  'puente piedra', 'ancon', 'punta hermosa', 'punta negra', 'san bartolo', 'chosica', 'lurigancho',
  'en su local', 'en el local de ustedes', 'en tu local', 'su local'
];

function eventFacts(history, message) {
  const userText = normalize((Array.isArray(history) ? history : [])
    .filter(function (m) { return m && m.role === 'user'; })
    .map(function (m) { return m.text; })
    .concat([message]).join(' '));
  const padded = ' ' + userText + ' ';
  /* Los mismos detectores del modo sin IA (fechas "20/11", horas sueltas
     "a las 3 de la tarde" + "termina 6", tipeos "d ela", "perosnas"...).
     require diferido: _offline.js tambien usa este modulo. */
  const O = require('./_offline');
  const userMsgs = (Array.isArray(history) ? history : []).filter(function (m) { return m && m.role === 'user'; })
    .map(function (m) { return O.normText(m.text); }).concat([O.normText(message)]);
  const times = O.timesFromConversation(history, message);
  return {
    date: userMsgs.some(function (t) { return !!O.parseDate(t); }) ||
      new RegExp('\\b(' + MONTHS + ')\\b|\\b(este|el proximo|proximo) (sabado|domingo|viernes|lunes|martes|miercoles|jueves)\\b').test(userText),
    time: !!times.range || /\bmediodia\b/.test(userText),
    timeStartOnly: !!times.start && !times.end,
    district: DISTRICTS.some(function (d) { return padded.indexOf(' ' + d + ' ') !== -1; }) || /\b(distrito|en casa|en mi casa|en un local)\b/.test(userText),
    guests: userMsgs.some(function (t) { return !!O.parseGuests(t); })
  };
}

const ASK = {
  date: [
    '¿Para qué fecha lo estás pensando? 📅',
    '¿Ya tienes fecha en mente? Así reviso que esté libre 📅',
    'Cuéntame, ¿para cuándo sería la fiesta? 🎈',
    '¿Qué día sería el gran día? Te confirmo disponibilidad al toque 📅'
  ],
  time: [
    '¿Y en qué horario sería? Algo como "de 3pm a 8pm" me sirve perfecto ⏰',
    '¿A qué hora empezaría y a qué hora terminaría? Así te aparto ese horario ⏰',
    '¿Tienes ya el horario? Dime hora de inicio y de fin, para que no se cruce con otra fiesta 😉'
  ],
  district: [
    '¿En qué distrito sería? 📍',
    '¿Y dónde sería: en nuestro local de La Perla o en otro distrito? 📍',
    '¿La fiesta sería en casa o en un local? ¿En qué distrito? 📍'
  ],
  guests: [
    '¿Cuántos invitados más o menos vendrían? 🎉',
    '¿Estamos hablando de fiesta íntima o de esas donde no alcanza ni el local? 😄 ¿Cuántos invitados calculas?',
    '¿Para cuántas personas sería, más o menos? 🎉'
  ],
  done: [
    '¿Quieres que te arme una propuesta con lo que me contaste? 🐰',
    '¿Te ayudo a combinarlo con algo más para que la fiesta quede redonda? 🎊',
    '¿Le sumamos algo más o lo dejamos así? 😊'
  ]
};

function nextQuestion(history, message) {
  const f = eventFacts(history, message);
  if (!f.date) return pick(ASK.date);
  if (!f.time && f.timeStartOnly) return pick(['¿Y a qué hora terminaría la fiesta? ⏰', '¿Hasta qué hora sería? Así te aparto el horario completo ⏰']);
  if (!f.time) return pick(ASK.time);
  if (!f.district) return pick(ASK.district);
  if (!f.guests) return pick(ASK.guests);
  return pick(ASK.done);
}

/* ---------- Catalogo por categoria (sale del mismo CATALOG_SUMMARY del prompt) ---------- */

function parseCatalog(summary) {
  const out = {};
  let current = null;
  String(summary || '').split('\n').forEach(function (line) {
    if (line.indexOf('## ') === 0) { current = line.slice(3).trim(); out[current] = []; }
    else if (current && line.indexOf('- ') === 0) out[current].push(line.slice(2).trim());
  });
  return out;
}

/* Palabras que identifican cada categoria (sobre texto normalizado). */
const CATEGORY_KEYWORDS = {
  'Alquiler de Local': /\b(local|salon|alquiler|alquilan|atril|arco de globos)\b/,
  'Snacks Dulces': /\b(algodon(es)?|manzanas? acaramelada|churros?|frutibar|jugos?|dispensador|snacks? dulces?)\b/,
  'Snacks Salados': /\b(popcorn|canchita|panchos?|hot ?dogs?|hamburguesas?|choripan(es)?|salchipapas?|nuggets?|tequenos?|snacks? salados?)\b/,
  'Combos de Snacks': /\bcombos?\b/,
  'Torta en Maqueta': /\b(tortas?|maquetas?|queques?)\b/,
  'Dulces Temáticos': /\b(bocaditos?|cupcakes?|cake ?pops?|alfajores?|dulces tematicos)\b/,
  'Show Infantil': /\b(show infantil|shows?|animadoras?|animacion|bailarinas?|personajes?)\b/,
  'Show de Gymkanas': /\b(gymkanas?|gincanas?|yincanas?|gymkhanas?)\b/,
  'Plataforma 360°': /\b(360|plataforma)\b/,
  'Fotografía y Filmación': /\b(fotografias?|fotografos?|filmacion|filmar|camarografos?|sesion de fotos)\b/,
  'Pintura de Alcancías': /\b(alcancias?)\b/,
  'Caritas Pintadas': /\b(caritas?|pintacaritas?|maquillaje)\b/,
  'Baby Shower': /\b(baby ?shower)\b/,
  'Servicio de Mozo': /\b(mozos?|meseros?|moza)\b/,
  'Mobiliario': /\b(sillas?|lounge|mobiliario|salitas?|pista led|pista de baile|bar led|sala led|pufs?|mesas? led)\b/,
  'Sonido y Hora Loca': /\b(sonido|dj|hora loca|luces|robots?|arlequin(es)?|cabezon(es)?)\b/
};

const PRICE_WORDS = /\b(cuanto|cuantos|precio|precios|cuesta|cuestan|sale|salen|valor|costo|costos|tarifa|tarifas|cotiza|cotizacion|que incluye|que tienen|que ofrecen|opciones|paquetes|info|informacion|tienen)\b/;

const CATEGORY_INTRO = [
  '¡Claro! Esto es lo que tenemos en **{cat}**:',
  '¡Buenísimo, me encanta esa idea! 🎉 Mira las opciones de **{cat}**:',
  'Te cuento rapidito lo de **{cat}**:',
  '¡Con gusto! En **{cat}** tenemos:',
  'Ahí va todo lo de **{cat}** 👇'
];

const CATEGORY_UPSELL = {
  'Alquiler de Local': ['Muchos lo combinan con un show infantil y algún combo de snacks, y la fiesta queda completa 🎈'],
  'Show Infantil': ['Combina genial con un combo de snacks, que los peques salen con hambre después de tanto juego 😄'],
  'Snacks Dulces': ['Si quieres variedad, los combos traen dulce y salado juntos y salen más a cuenta 😉'],
  'Snacks Salados': ['Ojo que los combos traen salado + dulce juntos y salen más a cuenta 😉'],
  'Torta en Maqueta': ['Queda lindísima con una mesa de bocaditos temáticos al lado 🧁'],
  'Plataforma 360°': ['Es de lo que más se comparte en redes después de la fiesta 📸'],
  'Fotografía y Filmación': ['Los paquetes de foto + video salen más a cuenta que contratar las dos cosas por separado 😉'],
  'Sonido y Hora Loca': ['La hora loca con robot LED es la que más emociona a los grandes también 🤖'],
  'Baby Shower': ['Si quieres, le sumamos snacks o bocaditos temáticos para los invitados 🍼']
};

/* "Algodón dulce (máquina) — Con personal... (50u: S/180, ...)" ->
   "• **Algodón dulce (máquina)**: Con personal... (50u: S/180, ...)" */
function formatItem(line, bold) {
  const sep = line.indexOf(' — ');
  if (sep === -1) return '• ' + line;
  const name = line.slice(0, sep);
  return '• ' + bold(name) + ': ' + line.slice(sep + 3);
}

function categoryReply(cat, items, ctx) {
  const bold = ctx.channel === 'whatsapp'
    ? function (s) { return '*' + s + '*'; }
    : function (s) { return '**' + s + '**'; };
  const intro = pick(CATEGORY_INTRO).replace('{cat}', cat);
  const introFixed = ctx.channel === 'whatsapp' ? intro.replace(/\*\*/g, '*') : intro;
  const parts = [introFixed, items.map(function (i) { return formatItem(i, bold); }).join('\n')];
  if (CATEGORY_UPSELL[cat] && maybe(0.6)) parts.push(pick(CATEGORY_UPSELL[cat]));
  if (maybe(0.35)) {
    parts.push(ctx.channel === 'whatsapp'
      ? 'Si alguno te gusta, escríbeme su nombre y lo voy anotando.'
      : 'Si alguno te gusta, tócalo en el catálogo y se agrega a tu pedido.');
  }
  parts.push(nextQuestion(ctx.history, ctx.message));
  return parts.join('\n\n');
}

/* ---------- Intenciones simples ---------- */

const INTENTS = [
  {
    name: 'modelo_ia',
    test: /\b(chat ?gpt|gpt|gemini|openai|bard|copilot|que (ia|inteligencia artificial|modelo) (eres|usas)|quien te (hizo|creo|programo|entreno)|con que (ia|modelo))\b/,
    replies: [
      'Soy el asistente virtual de Magic Box, hecho a medida para ayudarte con tu evento 🐰 ¿Qué estás celebrando?',
      'Soy el asistente virtual de Magic Box, nada más y nada menos 🐰 Lo mío es armar fiestas: ¿qué tienes en mente?',
      'Solo te puedo decir que soy el asistente virtual de Magic Box 🐰 ¡Mejor cuéntame de tu fiesta! ¿Qué celebramos?'
    ]
  },
  {
    name: 'es_ia',
    test: /\b(eres|sos) (una |un )?(ia|robot|bot|maquina|persona|humano|humana|real|inteligencia artificial)\b|\bhablo con (una |un )?(persona|humano|humana|maquina|bot|robot|ia)\b|\bes un bot\b|\bes automatico\b/,
    replies: [
      'Sí, soy un asistente virtual con IA 🐰 Pero conozco Magic Box al detalle, así que pregúntame lo que quieras. Y si prefieres hablar con alguien del equipo, escríbeles al {phone}.',
      '¡Sí! Soy un asistente virtual con inteligencia artificial 🤖🐰 Te ayudo con precios y opciones; para algo más puntual, el equipo te atiende en el {phone}.',
      'Así es, soy una IA: el asistente virtual de Magic Box 🐰 ¿En qué te ayudo con tu fiesta?'
    ]
  },
  {
    name: 'humano',
    test: /\b(asesor|asesora|humano|persona real|alguien del equipo|hablar con alguien|operador|operadora|encargad[oa]|duena|dueno|numero de contacto|llamarlos|llamar)\b/,
    replies: {
      web: [
        '¡Claro! Toca el botón **"Hablar con un asesor"** arriba del chat, o escríbeles directo al WhatsApp {phone} 📲 Te atienden encantados.',
        'Por supuesto 😊 El equipo te atiende por WhatsApp al {phone}, o con el botón **"Hablar con un asesor"** de arriba.',
        'Sin problema, te paso con el equipo: WhatsApp {phone} 📲 (o el botón **"Hablar con un asesor"** arriba del chat).'
      ],
      whatsapp: [
        '¡Claro! Escríbele directo al equipo al {phone} y te atienden encantados 📲',
        'Por supuesto 😊 El equipo de Magic Box te atiende al {phone}.',
        'Sin problema: el equipo te responde al {phone} 📲'
      ]
    }
  },
  {
    name: 'pagos',
    test: /\b(como (se )?pag[ao]|forma(s)? de pago|metodos? de pago|medios? de pago|yape|plin|transferencia|cuenta bancaria|numero de cuenta|deposito|adelanto|abono|separar (la )?fecha|tarjeta|pago)\b/,
    replies: [
      'Los pagos los coordina el equipo de Magic Box directo por WhatsApp ({phone}) 😊 Para separar tu fecha se abona el 20% (si alquilas el local, la separación es de S/300), y tienes 3 días para completar o coordinar los detalles; si no, la fecha se libera para otros clientes.',
      'Eso lo ve el equipo directamente por WhatsApp al {phone} 💬 Te cuento eso sí: la fecha se separa con el 20% del pedido (o S/300 si incluye el local), y desde ahí tienes 3 días para completar o cerrar detalles.',
      'El pago se coordina con el equipo por WhatsApp ({phone}) 📲 Para apartar la fecha va el 20% (el local se separa con S/300), con 3 días para completar; pasado ese plazo la fecha se libera.'
    ],
    askAfter: true
  },
  {
    name: 'ubicacion',
    test: /\b(donde (queda|quedan|estan|se ubica|se ubican|es el local|esta el local)|direccion|ubicacion|ubicados|como llego|en que distrito estan)\b/,
    replies: [
      'Estamos en {address} 📍 Ahí está nuestro local, y también llevamos los servicios a tu casa o al local que elijas.',
      '¡Nuestro local queda en {address}! 📍 Y si la fiesta es en otro lado, también vamos hasta allá.',
      'Nos encuentras en {address} 📍 Igual llevamos shows, snacks y demás a donde sea tu fiesta.'
    ],
    askAfter: true
  },
  {
    name: 'horario_atencion',
    test: /\b(horario de atencion|a que hora (atienden|abren|cierran)|atienden (hoy|los|el)|estan abiertos|hasta que hora (atienden|estan)|que dias atienden)\b/,
    replies: [
      'El equipo atiende de 9am a 9pm, y viernes y sábado hasta las 11pm 🕘 Yo sí estoy disponible a cualquier hora 🐰',
      'Atendemos de 9am a 9pm (viernes y sábado hasta las 11pm) 🕘 Pero yo te respondo 24/7, así que dime nomás.',
      'De 9am a 9pm, y los viernes y sábados hasta las 11pm 🕘 ¡Y este conejito no duerme! 🐰'
    ],
    askAfter: true
  },
  /* ---- Preguntas frecuentes sobre el LOCAL (siempre empujan a reservarlo) ---- */
  {
    name: 'aforo_local',
    test: /\b(aforo|capacidad|cuantas personas (entran|caben|alcanzan)|cuantos (entran|caben)|es grande|que tan grande|que ambientes|como es el local|que tiene el local|que incluye el local)\b/,
    replies: [
      'Nuestro local entra hasta **100 personas** (contando niños y proveedores) 🎉 Tiene salón, patio interior con grass sintético, cocina, cochera y servicios higiénicos. El **Paquete Happy** (5 horas) sale S/800, y de lunes a jueves el local está desde S/550.',
      '¡Es amplio y muy cómodo! 😍 Hasta **100 personas**, con salón, patio con grass sintético, cocina con microondas y refri, cochera y baños. Desde S/800 el **Paquete Happy** (5 horas), o S/550 de lunes a jueves.',
      'El local tiene aforo para **100 personas**: salón, patio con grass, cocina, cochera y servicios higiénicos 🏠 Si lo quieres ya decorado, el **Paquete Full** (S/1250) trae decoración temática, sonido y 70 sillas.'
    ],
    askAfter: true
  },
  {
    name: 'estacionamiento',
    test: /\b(estacionamiento|cochera|parqueo|donde estaciono|hay donde estacionar|parking)\b/,
    replies: [
      '¡Sí! El local tiene cochera exterior 🚗 Así tus invitados llegan tranquilos.',
      'Sí tenemos cochera en el local 🚗 Una preocupación menos para el día de la fiesta.'
    ],
    askAfter: true
  },
  {
    name: 'comida_propia',
    test: /\b(puedo llevar|se puede llevar|llevo mi|llevar mi|llevar (la |mi )?(comida|torta|bocaditos|bebidas)|traer (mi |la )?(comida|torta|bocaditos)|se puede cocinar|puedo cocinar|usar la cocina|hay cocina)\b/,
    replies: [
      '¡Claro! Puedes llevar tu comida, torta y bocaditos 🎂 La cocina tiene microondas y refrigeradora para guardar y calentar; eso sí, adentro no se puede cocinar. Y si quieres olvidarte de eso, nuestros combos de snacks vienen con personal uniformado 😉',
      'Sí puedes llevar tus cosas 😊 La cocina es para colocar y conservar la comida (hay microondas y refri), pero no se cocina dentro del local. Si te animas, te armo un combo de snacks para que no tengas que preocuparte por nada.'
    ],
    askAfter: true
  },
  {
    name: 'alcohol',
    test: /\b(cerveza|chelas?|alcohol|tragos?|licor|barra libre|servicio de bar|bebidas alcoholicas)\b/,
    replies: [
      'Sí se permite 🍻 Solo te pedimos avisar antes, y la cerveza únicamente en lata (no en cajas de botellas). Todo con consumo responsable.',
      'Se puede, avisándonos antes 😊 La cerveza solo en lata y con consumo responsable. ¿Quieres que te sume algo de snacks para acompañar?'
    ],
    askAfter: true
  },
  {
    name: 'musica_horario',
    test: /\b(hasta que hora (es|puede|pueden|se puede|hay)|hasta que hora la (musica|fiesta)|horario (maximo|limite)|musica hasta|volumen|parlante propio|llevar (mi )?parlante|puedo llevar dj)\b/,
    replies: [
      'La música puede ir hasta las **11pm los viernes y sábados**, y hasta las **9pm de domingo a jueves** 🎶 Se permite un parlante a volumen moderado. Si quieres el sonido resuelto, el equipo con USB y Bluetooth sale S/70.',
      'Viernes y sábado la fiesta con música va hasta las **11pm**; domingo a jueves hasta las **9pm** 🎵 Un solo parlante y volumen moderado, para cuidar a los vecinos.'
    ],
    askAfter: true
  },
  {
    name: 'garantia_limpieza',
    test: /\b(garantia|deposito de garantia|limpieza|cobran (algo )?extra|costos? extra|cargos? (extra|adicional)|algo mas que pagar)\b/,
    replies: [
      'Aparte del alquiler hay dos conceptos: **limpieza S/50** (incluye bolsas, papel higiénico, papel toalla, jabón y lavavajillas) y un **depósito de garantía de S/150**, que se te devuelve al terminar si todo está en orden 😊',
      'Además del local se paga la **limpieza (S/50)** y una **garantía de S/150** que se devuelve después del evento si no hay daños. ¡Sin sorpresas! 😉'
    ],
    askAfter: true
  },
  {
    name: 'reglas_decoracion',
    test: /\b(confeti|pica pica|picapica|velas|bengalas|fuegos artificiales|tecnopor|se puede decorar|puedo decorar|pegar en (la |las )?pared(es)?|clavar)\b/,
    replies: [
      'Para cuidar el local no se permite confeti, pica pica, tecnopor, velas encendidas ni fuegos artificiales 🙏 Para decorar paredes solo masking tape. ¡Pero serpentinas y papel crepé sí! Y si quieres el local ya decorado, el **Paquete Full** trae decoración temática incluida 🎈',
      'Se puede decorar usando masking tape 😊 Lo que no está permitido es confeti, pica pica, tecnopor, velas o fuegos artificiales. Si prefieres no preocuparte, el **Paquete Full** viene con decoración temática de 3 paneles.'
    ]
  },
  {
    name: 'visita_local',
    test: /\b(puedo (ir a )?(ver|conocer|visitar) el local|visitar el local|conocer el local|ver el local|fotos del local|como es por dentro|ir a verlo)\b/,
    replies: [
      '¡Claro que sí! 😍 El local está en {address}. Escríbele al equipo al {phone} para coordinar tu visita; te va a encantar. ¿Ya tienes fecha en mente para revisar si está libre?',
      'Con gusto te lo mostramos 🏠 Estamos en {address}; coordina tu visita por WhatsApp al {phone}. Mientras, ¿para qué fecha sería? Así te confirmo disponibilidad.'
    ]
  },
  {
    name: 'descuentos',
    test: /\b(descuento|descuentos|promocion|promociones|promo|oferta|ofertas|mas barato|economico|economica|rebaja|algo mas a cuenta)\b/,
    replies: [
      '¡Tenemos opciones para cuidar el bolsillo! 💸 El **local de lunes a jueves** sale solo S/550 (5 horas), y los **combos de snacks** salen más a cuenta que pedir todo suelto (desde S/380). ¿Qué día estás pensando?',
      'La mejor promo: celebrar de **lunes a jueves**, el local sale S/550 en vez de S/800 🎉 Y si sumas un combo de snacks (desde S/380), ahorras frente a pedir todo por separado.'
    ]
  },
  {
    name: 'recomendacion',
    test: /\b(que me recomiendas|que recomiendas|que me sugieres|no se que elegir|no se por donde empezar|ayudame a elegir|que paquetes tienen|que tienen para una fiesta|arma(me)? (una|un) (fiesta|paquete|propuesta)|que ofrecen)\b/,
    replies: [
      '¡Me encanta esta parte! 🐰 Mira estas ideas, todas en nuestro local:\n• **Básico** (desde S/1120): Paquete Happy + animadora temática\n• **Con snacks** (desde S/1500): lo anterior + combo de algodón y popcorn ilimitado\n• **Medio** (desde S/2360): Paquete Full decorado + animadora y bailarina + combo de snacks\nTodo se ajusta a tu evento. ¿Cuántos invitados calculas?',
      'Te propongo empezar por lo que más se pide 🎉\n• **Paquete Happy** (local 5h) + **animadora temática**: desde S/1120\n• Súmale un **combo de snacks** y queda en S/1500\n• Si lo quieres decorado, el **Paquete Full** con show y snacks va desde S/2360\n¿Para qué fecha sería? Así reviso que el local esté libre.'
    ]
  },
  {
    name: 'gracias',
    whole: /^(ok |okey |oki |listo |perfecto |genial |super |buenisimo |chevere |ya |vale )*(muchas |mil )?(gracias|grax|thanks|chau|chao|adios|hasta luego|nos vemos|bye)( (a ti|a usted|por todo|por la info|por la informacion|igualmente|bendiciones|saludos))*$/,
    replies: [
      '¡Gracias a ti! 🐰 Aquí estoy para lo que necesites. ¡Que sea una fiesta inolvidable! 🎉',
      '¡De nada! 😊 Cuando quieras seguimos armando tu fiesta. Si quieres cerrar algo, el equipo te atiende al {phone}.',
      '¡Un gusto ayudarte! 🎈 Cualquier duda, me escribes nomás.',
      '¡Con mucho gusto! 🐰 Si se te ocurre algo más, aquí sigo.'
    ]
  },
  {
    name: 'saludo',
    whole: /^(hola+|holi+s?|holaa+|buenas|buenos dias|buen dia|buenas tardes|buenas noches|hey|que tal|alo|hi|hello)( (hola|que tal|como estas|como esta|como va|buenas|buenos dias|buenas tardes|buenas noches|conejito|magic box))*$/,
    replies: [
      '¡Hola! 🐰 Qué gusto. Soy el asistente virtual de Magic Box. ¿Qué estamos celebrando?',
      '¡Holaaa! 🎉 Aquí el conejito de Magic Box (asistente virtual con IA). Cuéntame, ¿es cumpleaños, baby shower u otra cosa?',
      '¡Hola, hola! 🐰 ¿Qué fiesta estamos planeando? Cuéntame y te ayudo a armarla.',
      '¡Buenas! 😊 Soy el asistente virtual de Magic Box. ¿Para qué evento te ayudo?'
    ]
  }
];

function fill(text) { return text.replace(/\{phone\}/g, PHONE).replace(/\{address\}/g, ADDRESS); }

/* Elige una variante distinta a la ultima respuesta del bot, para que si
   la persona repite la pregunta no reciba exactamente el mismo texto. */
function pickFresh(arr, history) {
  const last = (Array.isArray(history) ? history : []).filter(function (m) { return m && m.role === 'model'; }).slice(-1)[0];
  const lastText = last ? String(last.text) : '';
  const options = arr.filter(function (t) { return lastText.indexOf(fill(t).slice(0, 40)) === -1; });
  return pick(options.length ? options : arr);
}

/**
 * Devuelve el texto de la respuesta, o null si la pregunta no es lo
 * bastante simple (entonces responde la IA).
 * ctx: { channel: 'web' | 'whatsapp', catalogSummary }
 */
function cannedReply(message, history, ctx) {
  ctx = ctx || {};
  const text = normalize(message);
  if (!text || text.length > 120) return null;
  const words = text.split(' ');
  if (words.length > 14) return null;
  /* Numeros = fechas, horas o cantidades que la IA tiene que procesar.
     (Excepcion: "360" de la plataforma de fotos.) */
  if (/\d/.test(text.replace(/\b360\b/g, ''))) return null;

  /* Precio/opciones de UNA categoria. */
  if (PRICE_WORDS.test(text)) {
    const cats = Object.keys(CATEGORY_KEYWORDS).filter(function (c) { return CATEGORY_KEYWORDS[c].test(text); });
    if (cats.length === 1) {
      const catalog = parseCatalog(ctx.catalogSummary);
      const items = catalog[cats[0]];
      if (items && items.length) {
        return categoryReply(cats[0], items, { channel: ctx.channel, history: history, message: message });
      }
    }
  }

  /* Una sola intencion simple; si el mensaje toca dos temas, va a la IA. */
  const matched = INTENTS.filter(function (it) {
    return it.whole ? it.whole.test(text) : it.test.test(text);
  });
  if (matched.length !== 1) return null;
  const intent = matched[0];
  /* "¿qué me recomiendas para un baby shower?": la recomendacion generica
     es de cumpleaños; si nombran otro tipo de evento responde el modo sin
     IA, que tiene una propuesta especifica para cada uno. */
  if (intent.name === 'recomendacion' && /\b(baby|shower|bautiz\w*|comunion|quince|promo\w*|graduacion|aniversario|boda|matrimonio|reunion)\b/.test(text)) return null;
  const pool = Array.isArray(intent.replies) ? intent.replies : (intent.replies[ctx.channel] || intent.replies.web);
  let reply = fill(pickFresh(pool, history));
  if (intent.askAfter && maybe(0.7)) reply += '\n\n' + nextQuestion(history, message);
  if (ctx.channel === 'whatsapp') reply = reply.replace(/\*\*/g, '*');
  return reply;
}

module.exports = {
  cannedReply, normalize, pick, maybe, fill, nextQuestion, eventFacts, parseCatalog,
  CATEGORY_KEYWORDS, PRICE_WORDS, PHONE, ADDRESS, DISTRICTS, MONTHS
};
