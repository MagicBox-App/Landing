/**
 * Catálogo real de Magic Box (La Perla / San Miguel, Lima). Se usa como
 * siembra inicial de Firestore (ver firestore-service.seedCatalogIfEmpty);
 * después de la primera siembra, la fuente de verdad es Firestore y la
 * dueña lo edita desde el modo edición del catálogo (js/admin.js).
 * Fuente: catalogo-magic-box.md (extraído del PDF de diseño del negocio).
 */
const SEED_CATALOG = [
  {
    id: 'local',
    name: 'Alquiler de Local',
    icon: 'local',
    color: '#0891B2',
    items: [
      { id: 'local-happy', name: 'Paquete Happy', desc: 'Local 5h, aforo 100p, cocina, estacionamiento, atril de bienvenida', price: 800, unit: 'evento', keywords: ['happy', 'local happy'] },
      { id: 'local-full', name: 'Paquete Full', desc: 'Local 5h, decoración 3 paneles 3.5m, sonido USB/BT/mic, 70 sillas', price: 1250, unit: 'evento', keywords: ['full', 'local full'] },
      { id: 'local-premium', name: 'Paquete Premium', desc: 'Local 6h, decoración 3-4 paneles 5m, entrada con globos, sonido, 70 sillas', price: 1500, unit: 'evento', keywords: ['premium', 'local premium'] },
      { id: 'local-hora-extra', name: 'Hora adicional de local', desc: 'Extensión del horario base', price: 120, unit: 'hora', keywords: ['hora extra', 'hora adicional'] }
    ]
  },
  {
    id: 'snacks-dulces',
    name: 'Carrito de Snacks Dulces',
    icon: 'carritos',
    color: '#DB2777',
    items: [
      { id: 'algodon-maquina-50', name: 'Algodón dulce (máquina) 50u', desc: 'Con personal uniformado, servicio 3h', price: 180, unit: 'paquete', keywords: ['algodon', 'algodón'] },
      { id: 'algodon-maquina-75', name: 'Algodón dulce (máquina) 75u', desc: 'Con personal uniformado, servicio 3h', price: 225, unit: 'paquete', keywords: ['algodon', 'algodón'] },
      { id: 'algodon-maquina-100', name: 'Algodón dulce (máquina) 100u', desc: 'Con personal uniformado, servicio 3h', price: 280, unit: 'paquete', keywords: ['algodon', 'algodón'] },
      { id: 'algodon-domo-50', name: 'Algodón dulce (en domo) 50u', desc: 'Con personal uniformado, servicio 3h', price: 160, unit: 'paquete', keywords: ['algodon domo'] },
      { id: 'algodon-domo-75', name: 'Algodón dulce (en domo) 75u', desc: 'Con personal uniformado, servicio 3h', price: 215, unit: 'paquete', keywords: ['algodon domo'] },
      { id: 'algodon-domo-100', name: 'Algodón dulce (en domo) 100u', desc: 'Con personal uniformado, servicio 3h', price: 260, unit: 'paquete', keywords: ['algodon domo'] },
      { id: 'manzana-50', name: 'Manzana acaramelada en escalera 50u', desc: 'Con personal uniformado, servicio 3h', price: 190, unit: 'paquete', keywords: ['manzana', 'manzana acaramelada'] },
      { id: 'manzana-75', name: 'Manzana acaramelada en escalera 75u', desc: 'Con personal uniformado, servicio 3h', price: 260, unit: 'paquete', keywords: ['manzana', 'manzana acaramelada'] },
      { id: 'manzana-100', name: 'Manzana acaramelada en escalera 100u', desc: 'Con personal uniformado, servicio 3h', price: 290, unit: 'paquete', keywords: ['manzana', 'manzana acaramelada'] },
      { id: 'frutibar-50', name: 'Frutibar 50u', desc: 'Frutas, snacks, 3 complementos, 3 salsas', price: 410, unit: 'paquete', keywords: ['frutibar'] },
      { id: 'frutibar-75', name: 'Frutibar 75u', desc: 'Frutas, snacks, 3 complementos, 3 salsas', price: 525, unit: 'paquete', keywords: ['frutibar'] },
      { id: 'frutibar-100', name: 'Frutibar 100u', desc: 'Frutas, snacks, 3 complementos, 3 salsas', price: 680, unit: 'paquete', keywords: ['frutibar'] },
      { id: 'churros-manjar-50', name: 'Churros rellenos de manjar 50u', desc: 'Con personal uniformado, servicio 3h', price: 160, unit: 'paquete', keywords: ['churros', 'churros manjar'] },
      { id: 'churros-manjar-75', name: 'Churros rellenos de manjar 75u', desc: 'Con personal uniformado, servicio 3h', price: 225, unit: 'paquete', keywords: ['churros', 'churros manjar'] },
      { id: 'churros-manjar-100', name: 'Churros rellenos de manjar 100u', desc: 'Con personal uniformado, servicio 3h', price: 280, unit: 'paquete', keywords: ['churros', 'churros manjar'] },
      { id: 'churros-chocolate-50', name: 'Churros rellenos de chocolate 50u', desc: 'Con personal uniformado, servicio 3h', price: 180, unit: 'paquete', keywords: ['churros', 'churros chocolate'] },
      { id: 'churros-chocolate-75', name: 'Churros rellenos de chocolate 75u', desc: 'Con personal uniformado, servicio 3h', price: 247, unit: 'paquete', keywords: ['churros', 'churros chocolate'] },
      { id: 'churros-chocolate-100', name: 'Churros rellenos de chocolate 100u', desc: 'Con personal uniformado, servicio 3h', price: 300, unit: 'paquete', keywords: ['churros', 'churros chocolate'] },
      { id: 'jugos-14l', name: 'Dispensador de jugos 14L', desc: 'Chicha morada + maracuyá caseros (7L + 7L)', price: 180, unit: 'paquete', keywords: ['jugos', 'chicha morada', 'maracuya'] },
      { id: 'jugos-30l', name: 'Dispensador de jugos 30L', desc: 'Chicha morada + maracuyá caseros (15L + 15L)', price: 320, unit: 'paquete', keywords: ['jugos', 'chicha morada', 'maracuya'] }
    ]
  },
  {
    id: 'snacks-salados',
    name: 'Carrito de Snacks Salados',
    icon: 'carritos',
    color: '#16A34A',
    items: [
      { id: 'popcorn-50', name: 'Popcorn en cajita 50u', desc: 'Con personal uniformado, servicio 3h', price: 180, unit: 'paquete', keywords: ['popcorn', 'canchita'] },
      { id: 'popcorn-75', name: 'Popcorn en cajita 75u', desc: 'Con personal uniformado, servicio 3h', price: 225, unit: 'paquete', keywords: ['popcorn', 'canchita'] },
      { id: 'popcorn-100', name: 'Popcorn en cajita 100u', desc: 'Con personal uniformado, servicio 3h', price: 280, unit: 'paquete', keywords: ['popcorn', 'canchita'] },
      { id: 'pancho-50', name: 'Pancho 50u', desc: 'Frankfurter en brocheta y cremas', price: 240, unit: 'paquete', keywords: ['pancho'] },
      { id: 'pancho-75', name: 'Pancho 75u', desc: 'Frankfurter en brocheta y cremas', price: 315, unit: 'paquete', keywords: ['pancho'] },
      { id: 'pancho-100', name: 'Pancho 100u', desc: 'Frankfurter en brocheta y cremas', price: 380, unit: 'paquete', keywords: ['pancho'] },
      { id: 'panhotdog-50', name: 'Pan con hot dog 50u', desc: 'Frankfurter, papitas al hilo, cremas', price: 320, unit: 'paquete', keywords: ['hot dog', 'pan con hot dog'] },
      { id: 'panhotdog-75', name: 'Pan con hot dog 75u', desc: 'Frankfurter, papitas al hilo, cremas', price: 457, unit: 'paquete', keywords: ['hot dog', 'pan con hot dog'] },
      { id: 'panhotdog-100', name: 'Pan con hot dog 100u', desc: 'Frankfurter, papitas al hilo, cremas', price: 580, unit: 'paquete', keywords: ['hot dog', 'pan con hot dog'] },
      { id: 'hamburguesa-50', name: 'Hamburguesas artesanales 50u', desc: 'Lechuga, tomate, queso cheddar, cremas', price: 350, unit: 'paquete', keywords: ['hamburguesa', 'hamburguesas'] },
      { id: 'hamburguesa-75', name: 'Hamburguesas artesanales 75u', desc: 'Lechuga, tomate, queso cheddar, cremas', price: 442, unit: 'paquete', keywords: ['hamburguesa', 'hamburguesas'] },
      { id: 'hamburguesa-100', name: 'Hamburguesas artesanales 100u', desc: 'Lechuga, tomate, queso cheddar, cremas', price: 640, unit: 'paquete', keywords: ['hamburguesa', 'hamburguesas'] },
      { id: 'choripan-50', name: 'Choripán 50u', desc: 'Papas al hilo y cremas', price: 420, unit: 'paquete', keywords: ['choripan', 'choripán'] },
      { id: 'choripan-75', name: 'Choripán 75u', desc: 'Papas al hilo y cremas', price: 607, unit: 'paquete', keywords: ['choripan', 'choripán'] },
      { id: 'choripan-100', name: 'Choripán 100u', desc: 'Papas al hilo y cremas', price: 790, unit: 'paquete', keywords: ['choripan', 'choripán'] },
      { id: 'salchipapas-50', name: 'Salchipapas 50u', desc: 'Frankfurter', price: 370, unit: 'paquete', keywords: ['salchipapas'] },
      { id: 'salchipapas-75', name: 'Salchipapas 75u', desc: 'Frankfurter', price: 525, unit: 'paquete', keywords: ['salchipapas'] },
      { id: 'salchipapas-100', name: 'Salchipapas 100u', desc: 'Frankfurter', price: 660, unit: 'paquete', keywords: ['salchipapas'] },
      { id: 'salchinuggets-50', name: 'Salchi nuggets 50u', desc: 'Servicio 3h con personal uniformado', price: 400, unit: 'paquete', keywords: ['salchi nuggets', 'nuggets'] },
      { id: 'salchinuggets-75', name: 'Salchi nuggets 75u', desc: 'Servicio 3h con personal uniformado', price: 570, unit: 'paquete', keywords: ['salchi nuggets', 'nuggets'] },
      { id: 'salchinuggets-100', name: 'Salchi nuggets 100u', desc: 'Servicio 3h con personal uniformado', price: 690, unit: 'paquete', keywords: ['salchi nuggets', 'nuggets'] },
      { id: 'tequenos-50', name: 'Tequeños con queso 50u', desc: '4u por porción, con salsa guacamole', price: 260, unit: 'paquete', keywords: ['tequenos', 'tequeños'] },
      { id: 'tequenos-75', name: 'Tequeños con queso 75u', desc: '4u por porción, con salsa guacamole', price: 340, unit: 'paquete', keywords: ['tequenos', 'tequeños'] },
      { id: 'tequenos-100', name: 'Tequeños con queso 100u', desc: '4u por porción, con salsa guacamole', price: 400, unit: 'paquete', keywords: ['tequenos', 'tequeños'] }
    ]
  },
  {
    id: 'combos',
    name: 'Combos de Snacks',
    icon: 'carritos',
    color: '#EA580C',
    items: [
      { id: 'combo-1', name: 'Combo 1', desc: 'Algodón dulce + popcorn ilimitado', price: 380, unit: 'evento', allowUnlimited: true, keywords: ['combo 1'] },
      { id: 'combo-2', name: 'Combo 2', desc: '50 popcorn + 50 algodones + 50 panchos', price: 460, unit: 'evento', keywords: ['combo 2'] },
      { id: 'combo-3', name: 'Combo 3', desc: '50 panchos + 50 salchipapas + algodón/popcorn ilimitado', price: 700, unit: 'evento', keywords: ['combo 3'] },
      { id: 'combo-4', name: 'Combo 4', desc: '50 salchipapas + 50 hamburguesas + popcorn/algodón ilimitado', price: 790, unit: 'evento', keywords: ['combo 4'] },
      { id: 'combo-5', name: 'Combo 5', desc: '50 churros + 50 salchipapas + algodón/popcorn ilimitado', price: 630, unit: 'evento', keywords: ['combo 5'] },
      { id: 'combo-6', name: 'Combo 6', desc: '50 salchipapas + 50 manzanas acarameladas + popcorn/algodón ilimitado', price: 740, unit: 'evento', keywords: ['combo 6'] }
    ]
  },
  {
    id: 'torta',
    name: 'Torta en Maqueta',
    icon: 'torta',
    color: '#D97706',
    items: [
      { id: 'torta-maqueta', name: 'Alquiler de maqueta de torta (3 pisos)', desc: 'También se cotiza en 1 o 2 pisos, personalizada', price: 200, unit: 'evento', keywords: ['maqueta', 'torta maqueta'] },
      { id: 'torta-cajita', name: 'Torta en cajita temática', desc: 'Queque vainilla c/chispas de chocolate, relleno manjar/fudge, buttercream', price: 6, unit: 'unidad', keywords: ['torta cajita'] },
      { id: 'torta-promo-50', name: 'Promo maqueta + 50 tortas en cajita', desc: 'Incluye alquiler de maqueta 3 pisos', price: 475, unit: 'evento', keywords: ['promo torta'] },
      { id: 'torta-promo-75', name: 'Promo maqueta + 75 tortas en cajita', desc: 'Incluye alquiler de maqueta 3 pisos', price: 620, unit: 'evento', keywords: ['promo torta'] },
      { id: 'torta-promo-100', name: 'Promo maqueta + 100 tortas en cajita', desc: 'Incluye alquiler de maqueta 3 pisos', price: 760, unit: 'evento', keywords: ['promo torta'] }
    ]
  },
  {
    id: 'dulces',
    name: 'Dulces Temáticos',
    icon: 'torta',
    color: '#DB2777',
    items: [
      { id: 'bocaditos-16', name: '16 Bocaditos temáticos', desc: '4 cupcakes, 4 cake pops, 4 manzanas, 4 alfajores', price: 140, unit: 'paquete', keywords: ['bocaditos'] },
      { id: 'bocaditos-24', name: '24 Bocaditos temáticos', desc: '6 cupcakes, 6 cake pops, 6 manzanas, 6 alfajores', price: 190, unit: 'paquete', keywords: ['bocaditos'] },
      { id: 'bocaditos-30', name: '30 Bocaditos temáticos', desc: '6 cupcakes, 6 galletas decoradas, 6 alfajores grandes, 6 paletas, 6 cake pops', price: 260, unit: 'paquete', keywords: ['bocaditos'] },
      { id: 'bocaditos-42', name: '42 Bocaditos temáticos', desc: '6 cupcakes, 6 galletas, 6 alfajores, 6 paletas, 6 cake pops, 6 manzanas, 6 brownies en paleta', price: 320, unit: 'paquete', keywords: ['bocaditos'] }
    ]
  },
  {
    id: 'shows',
    name: 'Show Infantil',
    icon: 'shows',
    color: '#7C3AED',
    items: [
      { id: 'show-1', name: 'Animadora temática', desc: '90 min de show, asistente, sonido, mic, juegos, piñata, happy birthday', price: 320, unit: 'evento', keywords: ['animadora'] },
      { id: 'show-2', name: 'Animadora + bailarina', desc: '90 min de show, doble energía y coreografías', price: 410, unit: 'evento', keywords: ['bailarina'] },
      { id: 'show-3', name: 'Animadora + personaje', desc: '90 min de show lleno de alegría y fantasía', price: 460, unit: 'evento', keywords: ['personaje'] },
      { id: 'show-4', name: 'Animadora + bailarina + personaje', desc: '90 min, combinación de ritmo y magia', price: 540, unit: 'evento', keywords: ['personaje', 'bailarina'] },
      { id: 'show-5', name: 'Animadora + bailarina + 2 personajes', desc: '90 min, más personajes, más diversión', price: 640, unit: 'evento', keywords: ['personajes'] },
      { id: 'show-6', name: 'Animadora + bailarina + 4 personajes', desc: '90 min, el show más completo y espectacular', price: 850, unit: 'evento', keywords: ['personajes'] }
    ]
  },
  {
    id: 'gymkanas',
    name: 'Show de Gymkanas',
    icon: 'party',
    color: '#2563EB',
    items: [
      { id: 'gymkana-estandar', name: 'Paquete Estándar', desc: '60 min, animadora, sonido, mic inalámbrico, luces LED, elige 5 juegos', price: 480, unit: 'evento', keywords: ['gymkana', 'gymkana estandar'] },
      { id: 'gymkana-gold', name: 'Paquete Gold', desc: '90 min, + monitor motivador, chalecos para niños, elige 8 juegos', price: 580, unit: 'evento', keywords: ['gymkana', 'gymkana gold'] }
    ]
  },
  {
    id: 'foto360',
    name: 'Fotos Plataforma 360°',
    icon: 'party',
    color: '#0891B2',
    items: [
      { id: 'foto360-2h', name: 'Plataforma 360° - 2 horas', desc: 'Videos ilimitados, accesorios, alfombra, luces LED, operador técnico', price: 600, unit: 'evento', allowUnlimited: true, keywords: ['360', 'plataforma 360'] },
      { id: 'foto360-3h', name: 'Plataforma 360° - 3 horas', desc: 'Videos ilimitados, accesorios, alfombra, luces LED, operador técnico', price: 750, unit: 'evento', allowUnlimited: true, keywords: ['360', 'plataforma 360'] },
      { id: 'foto360-4h', name: 'Plataforma 360° - 4 horas', desc: 'Videos ilimitados, accesorios, alfombra, luces LED, operador técnico', price: 950, unit: 'evento', allowUnlimited: true, keywords: ['360', 'plataforma 360'] }
    ]
  },
  {
    id: 'alcancias',
    name: 'Pintura de Alcancías',
    icon: 'decoracion',
    color: '#D97706',
    items: [
      { id: 'alcancia-paquete', name: 'Paquete completo (20 alcancías)', desc: '2h, mesa + 20 sillas, mandiles, pinturas acrílicas, presentación con lazo', price: 330, unit: 'evento', keywords: ['alcancia', 'alcancías'] },
      { id: 'alcancia-adicional', name: 'Alcancía adicional', desc: 'Precio por unidad extra', price: 10, unit: 'unidad', keywords: ['alcancia adicional'] }
    ]
  },
  {
    id: 'caritas',
    name: 'Caritas Pintadas',
    icon: 'decoracion',
    color: '#DB2777',
    items: [
      { id: 'caritas-1h', name: 'Caritas pintadas - 1 hora', desc: 'Glitter, pinturas antialérgicas, pedrería, álbum de diseños', price: 120, unit: 'evento', keywords: ['caritas pintadas'] },
      { id: 'caritas-1h30', name: 'Caritas pintadas - 1h30', desc: 'Glitter, pinturas antialérgicas, pedrería, álbum de diseños', price: 165, unit: 'evento', keywords: ['caritas pintadas'] },
      { id: 'caritas-2h', name: 'Caritas pintadas - 2 horas', desc: 'Glitter, pinturas antialérgicas, pedrería, álbum de diseños', price: 190, unit: 'evento', keywords: ['caritas pintadas'] }
    ]
  },
  {
    id: 'babyshower',
    name: 'Animación Baby Shower',
    icon: 'party',
    color: '#7C3AED',
    items: [
      { id: 'babyshower-1', name: 'Paquete 1 - Oh Baby!!', desc: '1 clown, 6 juegos + 2 dinámicas, 2h show, mini hora loca, video reel', price: 360, unit: 'evento', keywords: ['baby shower'] },
      { id: 'babyshower-2', name: 'Paquete 2 - Oh Baby!!', desc: '2 clowns (embarazada y doctor), mismo contenido + globos pencil + silbatos', price: 460, unit: 'evento', keywords: ['baby shower'] }
    ]
  },
  {
    id: 'mozo',
    name: 'Servicio de Mozo',
    icon: 'local',
    color: '#16A34A',
    items: [
      { id: 'mozo-5h', name: 'Servicio de mozo - 5 horas', desc: 'Personal joven, uniformado, con experiencia y atención profesional', price: 150, unit: 'evento', keywords: ['mozo'] }
    ]
  },
  {
    id: 'mobiliario',
    name: 'Mobiliario / Salitas Lounge',
    icon: 'local',
    color: '#0891B2',
    items: [
      { id: 'lounge-1', name: 'Salita lounge - 1 juego', desc: 'Para 8 personas, con respaldar', price: 120, unit: 'evento', keywords: ['lounge', 'salita lounge'] },
      { id: 'lounge-2', name: 'Salita lounge - 2 juegos', desc: 'Para 8 personas, con respaldar', price: 230, unit: 'evento', keywords: ['lounge', 'salita lounge'] },
      { id: 'lounge-3', name: 'Salita lounge - 3 juegos', desc: 'Para 8 personas, con respaldar', price: 340, unit: 'evento', keywords: ['lounge', 'salita lounge'] },
      { id: 'silla-plastico', name: 'Silla blanca de plástico', desc: 'Precio por unidad', price: 1.5, unit: 'unidad', keywords: ['silla', 'sillas'] },
      { id: 'silla-lazo', name: 'Silla vestida con lazo', desc: 'Precio por unidad', price: 3, unit: 'unidad', keywords: ['silla', 'sillas'] },
      { id: 'silla-chiavari', name: 'Silla de metal dorada (Chiavari)', desc: 'Precio por unidad', price: 5.5, unit: 'unidad', keywords: ['silla', 'chiavari'] },
      { id: 'mesa-8', name: 'Mesa redonda vestida (8 personas)', desc: 'Precio por unidad', price: 30, unit: 'unidad', keywords: ['mesa'] },
      { id: 'mesa-10', name: 'Mesa redonda vestida (10 personas)', desc: 'Precio por unidad', price: 40, unit: 'unidad', keywords: ['mesa'] }
    ]
  }
];

const CONTRACT_TEMPLATE = `CONTRATO DE PRESTACIÓN DE SERVICIOS PARA EVENTO INFANTIL

Entre {{empresa}}, en adelante "EL PROVEEDOR", y {{clientName}}, en adelante "EL CLIENTE", identificado con teléfono {{clientPhone}}, se acuerda lo siguiente:

Fecha del evento: {{eventDate}}
Fecha de emisión del contrato: {{issueDate}}

EL PROVEEDOR se compromete a brindar los siguientes servicios:
{{itemsList}}

MONTO TOTAL ACORDADO: S/ {{total}}

Ambas partes aceptan los términos y condiciones del presente contrato.

_______________________                    _______________________
EL PROVEEDOR                                 EL CLIENTE
`;
