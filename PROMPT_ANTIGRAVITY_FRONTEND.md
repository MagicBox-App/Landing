# Prompt maestro — Rediseño y reconstrucción de "Fiesta Feliz" (panel interno de cotizaciones)

Eres un diseñador/desarrollador senior de producto, con estándar de agencia internacional (nivel Stripe, Linear, Notion, Airbnb). Vas a diseñar y construir desde cero la interfaz de una aplicación web interna real para un negocio pequeño. La prioridad número uno es la calidad del diseño: debe verse profesional, cuidada, con jerarquía visual clara y cero sensación de "prototipo" o "plantilla genérica". La funcionalidad ya está mapeada abajo — no la reinventes, pero sí puedes proponer mejoras de flujo si simplifican la experiencia.

## 1. Contexto del negocio (no inventes nada distinto a esto)

El negocio ofrece servicios para fiestas infantiles: shows infantiles (payasos, magia, personajes), decoración temática, alquiler de local/salón, tortas, carritos de snacks (popcorn, algodón de azúcar, churros, hamburguesas, salad bar), y juegos inflables.

La dueña del negocio **no es una persona técnica**. Hoy gestiona todo manualmente por WhatsApp y Word. Esta aplicación es su herramienta interna de trabajo diario — la usa mientras está chateando en tiempo real con un cliente que le está pidiendo una cotización para una fiesta. No es una landing pública ni la usa el cliente final: la usa solo ella, desde el celular, la tablet o la laptop, muchas veces en la calle con mala señal.

## 2. Objetivo del producto

Una app donde ella pueda, mientras conversa con el cliente por WhatsApp:
1. Ir armando el pedido haciendo clic (categoría → servicio → cantidad), sin escribir casi nada.
2. Ver el total actualizarse al instante.
3. Generar y descargar una **proforma/cotización** con el detalle y el precio.
4. Generar un **contrato** pre-llenado con los mismos datos.
5. Exportar el pedido a Excel.
6. Consultar el **historial** de pedidos guardados.
7. Editar ella misma el catálogo de servicios y precios cuando cambien, sin ayuda técnica.
8. Llevar el **stock disponible** de los ítems que sí son inventario contable (no todos los servicios lo son), y que tanto ella como el asistente lo tengan en cuenta al armar un pedido.

Existe también un asistente conversacional (chat flotante) donde ella puede escribir en lenguaje natural ("quiero 50 hamburguesas") y el sistema agrega el ítem al pedido — es un canal alternativo al clic, no reemplaza la parte visual.

Además del panel interno, ahora también existe una **vista para el cliente final** donde puede ver el catálogo con imágenes y armar y enviar su propio pedido (detalle en 4.7). Esto es un cambio de dirección respecto a la primera versión: la dueña había pedido explícitamente que el cliente NO se autogestione, porque temía perder el control del proceso. Se decidió avanzar igual con el autoservicio — pero como es una reversión de un miedo real y explícito de la usuaria final, vale la pena que el propio flujo lo mitigue (ver la nota de "cola de revisión" en 4.7) en vez de ignorarlo.

## 3. Lo que más importa: el diseño

Esto es lo que más preocupa del proyecto — trátalo como el criterio de éxito principal, no como un detalle secundario:

- **Nivel profesional internacional.** Debe poder mostrarse a un inversionista o un cliente corporativo sin vergüenza. Nada de "look de curso online" ni de plantilla de Bootstrap por defecto.
- **Alta simplicidad.** La usuaria no es técnica y a veces está apurada, en la calle, con el celular. Cada pantalla debe tener una sola acción principal obvia. Botones grandes, texto mínimo, cero jerga técnica. Prioriza claridad sobre densidad de información.
- **Imágenes e iconografía reales, no emojis.** La versión actual usa emojis (🎪🎈🏛️🎂🍿🏰) como íconos de categoría — esto se ve amateur y hay que reemplazarlo por:
  - Un sistema de íconos coherente (line icons o iconos suaves tipo duotono — piensa en el estilo de Phosphor Icons, Heroicons o un set ilustrado custom), consistente en peso y estilo en toda la app.
  - Imágenes/ilustraciones reales para las categorías (una ilustración o foto representativa de "shows infantiles", "decoración", "carritos de snacks", etc.) — no clipart genérico, algo con identidad propia.
  - Una ilustración cuidada para los estados vacíos (ej. "aún no has agregado servicios", "todavía no hay pedidos guardados") — que se sienta diseñada, no un simple párrafo gris.
  - Si generas imágenes, que tengan una dirección de arte consistente (misma paleta, mismo estilo — evita mezclar fotografía realista con ilustración flat en la misma pantalla).
- **Identidad visual festiva pero seria.** El negocio es de fiestas infantiles, así que puede tener calidez y color — pero esto es una **herramienta de trabajo para una dueña de negocio**, no una app para niños. El tono correcto es "cálido y profesional", no "juguetón e infantil". Piensa en cómo Airbnb o Cred usan color e ilustración: accesible y humano, sin perder seriedad.
- **Fondo festivo con acabado premium tipo vidrio esmerilado (glassmorphism).** En vez de un fondo plano blanco/gris de dashboard genérico, usa un fondo con color y movimiento — degradados suaves o formas difuminadas (blur) en tonos festivos (magenta/ciruela, azafrán/dorado, algún acento tipo turquesa), como si hubiera luces o confetti desenfocado detrás de la interfaz. Sobre ese fondo, las superficies principales (barra superior, tarjetas, panel de pedido, modales) van con efecto de **vidrio esmerilado**: fondo semitransparente + `backdrop-filter: blur()`, borde muy sutil, sombra suave — así se ve premium y con profundidad, no plano.
  - **Límite no negociable**: el blur y la transparencia son para el fondo decorativo y los bordes de las superficies — nunca para el texto ni para el contraste de lectura. Las tarjetas y paneles deben seguir teniendo texto perfectamente legible con alto contraste (no un "cristal" tan transparente que cueste leer) — recuerda que lo usa una persona mayor. El blur decora, no debe dificultar la lectura.
  - **Vibrante, no apagado**: el fondo festivo debe sentirse animado — varias manchas de color en distintos tonos (magenta/ciruela, azafrán, un tono frío tipo turquesa, y un coral/rojizo cálido), suficiente saturación para que se note el efecto sin restarle legibilidad al contenido. Los botones principales pueden usar un degradado entre dos colores de la paleta en vez de un color plano, para reforzar esa sensación festiva.
- **Tipografía y jerarquía.** Una familia tipográfica moderna y legible, con jerarquía tipográfica clara (títulos, subtítulos, cuerpo, metadatos) — no todo el mismo tamaño con solo cambios de negrita.
- **Espaciado generoso.** Suficiente aire entre elementos; evita la sensación de formulario apretado.
- **Micro-interacciones.** Feedback visual inmediato al agregar un ítem, guardar un pedido, etc. (transiciones suaves, confirmaciones visuales breves) — sutil, no exagerado.
- **Accesibilidad.** Contraste de color adecuado (AA mínimo), estados de foco visibles, tamaños de texto legibles, objetivos de clic grandes (pensado para dedos en celular, no solo mouse).
- **Responsive real, mobile-first.** La mayoría del uso real va a ser desde el celular mientras está en la calle. Diseña primero para celular y expande a tablet/laptop, no al revés.

## 4. Funcionalidades requeridas (detalle)

### 4.1 Catálogo y armado de pedido
- Vista de categorías (grid de tarjetas), cada una con nombre, ícono/imagen representativa y cantidad de opciones.
- Al entrar a una categoría: lista de servicios con nombre, descripción corta, precio y unidad (por unidad, por evento, por persona).
- Algunos ítems permiten marcar "ilimitado" en vez de cantidad (ej. carritos de popcorn/algodón, que cobran tarifa fija por tiempo ilimitado).
- Botón "Agregar" por ítem, con confirmación visual breve.
- Panel/resumen del pedido en curso, siempre visible (sidebar en desktop, posiblemente un panel deslizable o tab en mobile): datos del cliente (nombre, teléfono, fecha del evento), lista de ítems agregados con opción de quitar cada uno, total en vivo.

### 4.2 Documentos
- Generar **proforma**: documento con datos del cliente, detalle de ítems, cantidades y total — descargable/imprimible.
- Generar **contrato**: mismo tipo de documento pero con formato de contrato de prestación de servicios, autocompletado con los mismos datos.
- **Exportar a Excel** el pedido actual.

### 4.3 Historial
- Lista de pedidos guardados anteriormente (fecha, cliente, evento, total), con opción de ver el detalle completo de cualquiera.

### 4.4 Edición del catálogo (por la dueña, sin ayuda técnica)
- Un modo de edición simple sobre la misma pantalla de catálogo (no una pantalla de administración aparte y compleja): poder agregar, editar y eliminar categorías y servicios (nombre, descripción, precio, unidad, ícono/color, si permite "ilimitado").
- **Campo de stock disponible**, opcional por ítem: para cosas que sí son inventario contable (ej. tortas ya horneadas, unidades de un castillo inflable que solo tienen una unidad física, paquetes de decoración limitados) puede poner una cantidad disponible. Para servicios que no son un inventario real (ej. "Show de Magia", que depende de agenda, no de stock físico) el campo se deja vacío/sin límite — no forzar un número donde no aplica.
- Debe sentirse como una extensión natural de la pantalla que ya usa, no como entrar a "otro sistema".

### 4.5 Asistente conversacional (chat flotante)
- Widget de chat siempre accesible (burbuja flotante), donde puede escribir pedidos en lenguaje natural y el asistente los va agregando al mismo pedido en curso, con confirmaciones y respuestas rápidas sugeridas (quick replies).
- **Conciencia de stock**: antes de confirmar que agregó algo, el asistente revisa el stock disponible del ítem (cuando ese ítem lo tiene definido). Si lo pedido supera el stock, no lo agrega en silencio — le avisa cuánto hay realmente disponible y le pregunta cómo seguir (ej. "Solo quedan 12 unidades de Torta 40 porciones, ¿la agrego con esa cantidad o prefieres otra opción?"). Esto aplica igual al futuro asistente que escuchará la conversación de WhatsApp (fase posterior, fuera de este alcance) — la lógica de chequeo de stock debe vivir en un solo lugar que ambos canales reutilicen.

### 4.7bis Asistente conversacional a pantalla completa (vista del cliente)
- Alternativa al catálogo de clic para el cliente: un botón tipo "Prefiero que me pregunten" abre un asistente a pantalla completa que va preguntando categoría por categoría (con botones de respuesta rápida, no texto libre obligatorio), pide cantidad con el mismo control de +/- que el resto de la app, y al terminar pasa directo a la revisión y pago. Comparte el mismo carrito que el modo de clic — el cliente puede alternar entre ambos sin perder lo ya agregado.

### 4.7ter Pago y boleta
- Después de revisar su pedido, el cliente elige un método de pago (Yape/Plin, tarjeta, efectivo al momento) y confirma. Esto queda registrado como "pago recibido, pendiente de confirmar" en el panel de la dueña.
- La dueña confirma el pago con un botón y ahí se genera la boleta (documento con el detalle, número de boleta y total).
- **Importante para la implementación real (no es solo diseño):**
  - El pago debe integrarse con una pasarela real — para Perú, **Culqi** es una opción común que soporta tarjeta y Yape; también existen Niubiz/Izipay. Esto requiere cuenta comercial y llaves de API, no es algo que se simule en el frontend.
  - Una **boleta de venta electrónica válida en Perú requiere integración con SUNAT** (facturación electrónica) — numeración autorizada, formato XML/PDF según norma, envío a SUNAT. Lo que se describe arriba es un documento de referencia visual para el prototipo, no una boleta fiscal real. Si el negocio necesita emitir boletas válidas, eso es un proyecto de integración aparte (hay proveedores que ofrecen esto como servicio, ej. Nubefact, Facturación Perú, etc.) — dejarlo señalado como fase futura, no bloquear el resto del producto por esto.

### 4.7 Vista para el cliente final (catálogo con imágenes + pedido propio)
- Una vista separada, pensada para que la vea el cliente final (por ejemplo, un link que la dueña le comparte por WhatsApp) — no es la misma pantalla que usa la dueña internamente, aunque comparte el mismo catálogo y las mismas imágenes.
- **El cliente nunca ve una pantalla de login.** El login (correo/contraseña) es exclusivo del panel interno de la dueña. La vista del cliente se abre directo desde un link, sin autenticarse.
- **Cómo se genera ese link**: desde su propio panel, la dueña escribe el nombre (y opcionalmente el teléfono) del cliente en el campo que ya usa para el pedido en curso, y un botón tipo "Enviarle el link a este cliente" genera una URL única para esa persona. Al abrirla, el cliente ya ve su nombre puesto (ej. "Hola Rosa, arma lo que quieras para tu fiesta") sin haber tenido que escribirlo ni loguearse — es la dueña quien lo asocia desde su lado, no el cliente desde el suyo.
- El cliente puede navegar las categorías con imágenes grandes y atractivas (más "catálogo/menú visual" que "tabla de datos"), elegir servicios y cantidades, y enviar su propio pedido.
- **Sugerencia de producto a evaluar con quien construya esto**: en vez de que el pedido del cliente se confirme solo, que llegue como una "solicitud pendiente" que la dueña revisa y aprueba con un toque antes de que cuente como pedido real — así el cliente tiene autonomía para armar lo que quiere, pero ella conserva la última palabra, que era justamente su preocupación original. No es un requisito cerrado, es la forma más simple de resolver la tensión entre darle autoservicio al cliente y no quitarle el control a la dueña.
- Debe respetar el stock disponible igual que el resto de la app: no dejar pedir más de lo que hay cuando el ítem tiene stock definido.

### 4.6 Cuenta y sincronización
- Login por **número de teléfono + código SMS** (no correo/contraseña) — es una sola usuaria, sin registro público, y así no tiene que recordar ninguna contraseña. El navegador recuerda la sesión, así que en la práctica solo ve esta pantalla la primera vez en cada dispositivo.
- Todo lo que hace (pedido en curso, catálogo, historial) debe verse igual y actualizarse en tiempo real sin importar desde qué dispositivo entre (celular, tablet, laptop).
- Debe seguir funcionando (guardando localmente) si pierde señal un momento, y sincronizar cuando vuelva la conexión.

## 5. Catálogo de ejemplo (usar como contenido de referencia/semilla)

```
Shows Infantiles
 - Show de Payasos — S/350 / servicio — 45 min de show interactivo
 - Show de Magia — S/400 / servicio — 40 min con mago profesional
 - Personajes / Princesas — S/380 / servicio — 1 hora, incluye sesión de fotos
 - Animación y Juegos — S/320 / servicio — 2 horas de dinámicas grupales

Decoración
 - Decoración Básica — S/250 / paquete — Globos y centro de mesa
 - Decoración Premium — S/550 / paquete — Tematizada, incluye backdrop
 - Temática Personalizada — S/750 / paquete — Diseño a medida según el evento

Local / Salón
 - Salón Chico (hasta 30 personas) — S/600 / evento — 4 horas de uso
 - Salón Grande (hasta 80 personas) — S/1100 / evento — 5 horas de uso

Torta
 - Torta 20 porciones — S/120
 - Torta 40 porciones — S/200
 - Torta 60 porciones — S/280

Carritos y Snacks
 - Carrito de Popcorn — S/200 / evento — ilimitado, 2 horas
 - Carrito de Algodón de Azúcar — S/200 / evento — ilimitado, 2 horas
 - Carrito de Churros — S/2 / unidad
 - Carrito de Hamburguesas — S/8 / unidad
 - Salad Bar — S/15 / persona

Juegos Inflables
 - Castillo Inflable — S/280 / evento — 4 horas
 - Tobogán Inflable — S/320 / evento — 4 horas
 - Combo 2 Juegos Inflables — S/520 / evento — 4 horas
```

## 6. Requisitos técnicos

- Backend: Firebase (Firestore para datos, Firebase Auth para el login de la única usuaria interna). Ya existe una capa de datos construida y funcional en este mismo proyecto (`js/firestore-service.js`, `js/firebase.js`, `js/auth-gate.js`, reglas en `firestore.rules`) que puedes reutilizar, adaptar o reemplazar si tu approach técnico es distinto — pero la lógica de negocio que describen (colecciones de catálogo, pedido en curso como documento único sincronizado en tiempo real, historial, reglas de seguridad por usuario autenticado) debe preservarse conceptualmente.
- El campo de stock (4.4) y su chequeo (4.5, 4.7) deben vivir en el modelo de datos del catálogo, no como un cálculo aparte — es un dato más del ítem, igual que el precio.
- La vista del cliente (4.7) necesita reglas de seguridad distintas a la interna: el cliente no está autenticado con la cuenta de la dueña, así que solo debe poder **leer** el catálogo (y sus imágenes) y **crear** una solicitud de pedido — nunca leer el historial completo, ni editar catálogo, ni ver datos de otros clientes.
- Debe funcionar en navegador, sin instalación, en celular/tablet/laptop.
- Debe tolerar conexión intermitente (guardar cambios y sincronizar cuando vuelva la señal).
- Todo el texto de la interfaz en español (Perú).

## 7. Qué NO hacer

- No uses emojis como iconografía final del producto.
- No repliques el look genérico de un dashboard admin gratuito de plantilla.
- No sacrifiques simplicidad por "verse más completo" — cada pantalla debe poder explicarse en una frase a alguien que nunca usó una app de gestión.
- No agregues funcionalidades fuera de lo descrito arriba (ej. multiusuario, roles, facturación electrónica) salvo que se pida explícitamente.

## 8. Entregable esperado

Una interfaz completa, pulida y responsive que cubra las secciones 4.1 a 4.7, con una dirección de arte definida y consistente (paleta de color, tipografía, sistema de íconos/ilustraciones, componentes reutilizables) que se sienta igual de cuidada tanto en el panel interno de la dueña como en la vista del cliente final, lista para mostrarle a la dueña del negocio como primera versión real del producto.
