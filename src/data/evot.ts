/**
 * eVot — el bot multicanal con panel, montado en la cuenta del cliente.
 *
 * Es el único producto del catálogo que NO es un sitio web, y por eso vive en su
 * propio archivo en vez de colarse en `plans.ts` o en `modules.ts`: no se entrega
 * en días de diseño, no lleva rondas de revisión y su precio no se compone como
 * el de una web. Mezclarlo con los planes obligaría a poner asteriscos en los
 * cuatro.
 *
 * REGLA DE ESCRITURA (la misma que `services.ts`): el dolor antes que la
 * herramienta. Aquí hay dos nombres técnicos que NO se pueden evitar —Cloudflare
 * y la llave de IA— porque el cliente los va a pagar de su bolsillo y tiene
 * derecho a saber a quién. Los dos se explican en la misma frase donde aparecen,
 * y ninguno se usa como argumento de venta.
 *
 * REGLA DE PRECIOS: los importes de aquí son la única fuente. Los usan esta
 * página, el `<select>` de /contacto y la base del chat (`kb.json.ts`), que
 * además los mete en su lista blanca para no dejar que el bot invente cifras.
 */
import { routes } from './links';

export const evot = {
  /** Nombre de producto. Se escribe así en todas partes: minúscula y V alta. */
  name: 'eVot',
  slug: 'evot',
  tagline: 'Todos tus mensajes, en un solo lugar.',
  /**
   * Qué se paga a PanaClaw. Es pago único: no hay mensualidad nuestra, y esa es
   * justamente la diferencia contra el software de mensajería que se alquila.
   */
  price: '$70',
  priceKicker: 'Pago único · Entrega en 48 horas',
  /**
   * La frase de una línea. Se usa en el `<title>`, en la tarjeta social y en lo
   * que el chat responde: si cambia, cambia en los tres a la vez.
   */
  summary:
    'Un asistente que contesta por WhatsApp, Instagram, Messenger y Telegram las 24 horas, con un panel donde ves cada conversación y cada cliente nuevo. Lo montamos por $70 y queda en tu cuenta, no en la nuestra.',
} as const;

/* ------------------------------------------------------------------ *
 * Canales
 * ------------------------------------------------------------------ */

export interface EvotCanal {
  name: string;
  /** Qué cambia para el cliente al conectarlo, no cómo se conecta. */
  desc: string;
  /**
   * Trámite que NO depende de nosotros. Se publica porque es la única sorpresa
   * posible en la entrega: quien conecta Telegram lo tiene en minutos y quien
   * quiere WhatsApp oficial pasa antes por Meta. Callarlo convertiría un trámite
   * normal en una promesa incumplida.
   */
  nota?: string;
}

export const evotCanales: EvotCanal[] = [
  {
    name: 'WhatsApp',
    desc: 'Donde de verdad te escriben. El bot contesta con tu número de siempre.',
    nota: 'Meta pide verificar tu negocio antes de dar el número oficial. El trámite es tuyo; te acompañamos.',
  },
  {
    name: 'Instagram',
    desc: 'Los mensajes directos dejan de acumularse sin respuesta el fin de semana.',
  },
  {
    name: 'Messenger',
    desc: 'Lo que llega por tu página de Facebook entra a la misma bandeja.',
  },
  {
    name: 'Telegram',
    desc: 'El más rápido de conectar: queda funcionando el mismo día, sin trámites.',
  },
];

/* ------------------------------------------------------------------ *
 * Qué hace
 * ------------------------------------------------------------------ */

export interface EvotCapacidad {
  title: string;
  desc: string;
}

export const evotCapacidades: EvotCapacidad[] = [
  {
    title: 'Contesta a cualquier hora',
    desc: 'A las once de la noche y en domingo. La mayoría de los mensajes de un negocio son las mismas cinco preguntas —precio, horario, dónde están, si hay disponibilidad, cómo se paga— y esas ya no te despiertan.',
  },
  {
    title: 'Responde con lo tuyo, no con lo que se imagina',
    desc: 'Le cargamos tus precios, tus horarios, tus políticas y tus preguntas frecuentes. Busca ahí antes de contestar, así que dice lo que tu negocio dice, no lo que suena bien.',
  },
  {
    title: 'Entiende las notas de voz',
    desc: 'El audio que te mandan lo escucha y lo entiende igual que un mensaje escrito. No se queda esperándote.',
  },
  {
    title: 'Te pasa la conversación cuando toca',
    desc: 'Si el cliente se molesta, pide hablar con una persona o pregunta algo delicado, deja de contestar y te avisa a ti. Prefiere callarse antes que inventar.',
  },
  {
    title: 'Apunta a quien pregunta',
    desc: 'Cada persona que escribe queda con su nombre, su canal y lo que buscaba. Dejas de perder clientes entre conversaciones viejas.',
  },
  {
    title: 'Agenda citas solo',
    desc: 'Si tu negocio trabaja con cita, la propone, la confirma y la deja anotada sin que tú entres.',
  },
  {
    title: 'Se aparta cuando entras tú',
    desc: 'En cuanto respondes en una conversación, el bot se calla en esa y no te pisa. Vuelve cuando tú lo dices.',
  },
];

/* ------------------------------------------------------------------ *
 * El panel
 * ------------------------------------------------------------------ */

export interface EvotPanelGroup {
  title: string;
  /** Los nombres son los mismos que se leen dentro del panel. */
  items: { name: string; desc: string }[];
}

/**
 * Las tres zonas del panel, en el mismo orden en que aparecen dentro.
 *
 * Se publican con el nombre real de cada pantalla a propósito: es lo que la
 * persona va a ver el día que entre, y una lista de nombres inventados para la
 * página de ventas convierte la primera sesión en una búsqueda del tesoro.
 */
export const evotPanel: EvotPanelGroup[] = [
  {
    title: 'Tu bandeja',
    items: [
      { name: 'Conversaciones', desc: 'Todo lo que se habló, por canal y en vivo.' },
      { name: 'Leads', desc: 'Quién preguntó, qué quería y por dónde entró.' },
      { name: 'Tickets', desc: 'Lo que quedó pendiente de que tú lo resuelvas.' },
      { name: 'Campañas', desc: 'Escribirle de vuelta a quien ya te escribió.' },
    ],
  },
  {
    title: 'Tu agente',
    items: [
      { name: 'Flujo', desc: 'Qué contesta, con qué tono y qué no toca.' },
      { name: 'Conocimiento', desc: 'Tus documentos: precios, políticas, preguntas frecuentes.' },
      { name: 'Mejoras', desc: 'Lo que no supo responder, para que se lo enseñes.' },
      { name: 'Conexiones', desc: 'Tus canales: conectarlos, probarlos y apagarlos.' },
      { name: 'Configuración', desc: 'Horarios, avisos y cuándo te pasa la conversación.' },
    ],
  },
  {
    title: 'Tus números',
    items: [
      { name: 'Resumen', desc: 'Cómo va el día de un vistazo, nada más entrar.' },
      { name: 'Insights', desc: 'Qué te preguntan más y qué se te está escapando.' },
      { name: 'Estadísticas', desc: 'Cuántos mensajes, de qué canal y a qué hora.' },
      { name: 'Costos', desc: 'Cuánto llevas gastado de tu llave este mes, al centavo.' },
    ],
  },
];

/* ------------------------------------------------------------------ *
 * Qué se paga, y a quién
 * ------------------------------------------------------------------ */

export interface EvotCosto {
  concepto: string;
  price: string;
  /** A quién se le paga. Es el dato que evita la sorpresa, no el importe. */
  aQuien: string;
  desc: string;
}

/**
 * Los dos gastos que NO son nuestros.
 *
 * Van publicados con el mismo tamaño que el precio de la implementación porque
 * son parte del precio real. Un producto que anuncia $70 y calla dos cuentas
 * mensuales es exactamente la letra chica que el resto del sitio dice no tener.
 */
export const evotCostos: EvotCosto[] = [
  {
    concepto: 'La nube donde vive',
    price: '$5 al mes',
    aQuien: 'Se paga a Cloudflare',
    desc: 'Cloudflare es la empresa donde corre el bot. La cuenta se abre a tu nombre, con tu tarjeta, y ese plan da de sobra para un negocio.',
  },
  {
    concepto: 'El cerebro que piensa',
    price: '$1–2 al mes',
    aQuien: 'Se paga a la empresa de IA que elijas',
    // Sin repetir aquí lo del gasto al día: ya lo dice la entradilla de la
    // sección, tres centímetros más arriba y en la misma pantalla.
    desc: 'Es tu propia llave de inteligencia artificial: pagas solo lo que el bot piensa, y solo mientras piensa. Un negocio normal ronda esa cifra; un mes flojo cuesta menos.',
  },
];

/** Lo que sí hacemos por los $70. */
export const evotIncluye: string[] = [
  'Lo montamos en tu cuenta y te entregamos tu panel con tu contraseña',
  'Conectamos los canales que uses de los cuatro',
  'Le cargamos lo que tu negocio sabe: precios, horarios, políticas y preguntas frecuentes',
  'Le damos la voz de tu negocio y le decimos cuándo callarse y avisarte',
  'Lo probamos contigo en vivo, con un mensaje real desde tu teléfono, antes de entregarlo',
];

/**
 * Lo que no. Va publicado y no en la propuesta privada por la misma razón que
 * los planes publican su lista de exclusiones: lo que sale caro no es cobrar
 * aparte, es que el cliente se entere después.
 */
export const evotNoIncluye: string[] = [
  'Las dos cuentas de arriba: se pagan a Cloudflare y a la empresa de IA, no a nosotros',
  'Escribir desde cero los documentos de tu negocio, si todavía no existen',
  'Atender las conversaciones a diario por ti — eso sigue siendo tuyo',
  'El trámite de verificación de WhatsApp con Meta, que solo tú puedes firmar',
  'Una página web: eVot atiende tus mensajes, no reemplaza tu sitio',
];

/* ------------------------------------------------------------------ *
 * Propiedad
 * ------------------------------------------------------------------ */

export interface EvotHecho {
  k: string;
  desc: string;
}

/**
 * El argumento entero del producto, y el mismo del resto del sitio: lo que
 * pagas queda a tu nombre. Cambiar cualquiera de estas tres frases es cambiar
 * lo que se está vendiendo, no la redacción.
 */
export const evotPropiedad: EvotHecho[] = [
  {
    k: 'Vive en tu cuenta',
    desc: 'El bot y el panel corren en tu propia cuenta de Cloudflare, con tu llave. Nosotros no tenemos que estar en medio para que funcione, y el día que quieras seguir solo, sigues solo.',
  },
  {
    k: 'Las conversaciones son tuyas',
    desc: 'Lo que hablan tus clientes se guarda en tu base de datos y no se envía a nadie más. Los mensajes se borran solos a los 90 días; los clientes y lo pendiente se quedan hasta que tú los borres.',
  },
  {
    k: 'Sin mensualidad nuestra',
    desc: 'Pagas los $70 una vez. No hay cuota de plataforma, ni límite de mensajes, ni un precio que suba el año que viene porque a nosotros nos convenga.',
  },
];

/* ------------------------------------------------------------------ *
 * Preguntas
 * ------------------------------------------------------------------ */

export interface EvotFaq {
  q: string;
  a: string;
}

/**
 * Las seis que frenan la compra. No son las que la gente pregunta primero: son
 * las que se callan y por las que no vuelve a escribir.
 */
export const evotFaq: EvotFaq[] = [
  {
    q: '¿Por qué $70 si esto en otro lado cuesta una mensualidad?',
    a: 'Porque no te lo alquilamos. El programa es abierto y ya está hecho; los $70 son el trabajo de montarlo en tu cuenta, conectar tus canales y enseñarle lo que tu negocio sabe. Lo que sigue pagando cada mes no lo cobramos nosotros: son los $5 de la nube y el gasto de tu llave de IA, que van directo a esas dos empresas.',
  },
  {
    q: '¿El bot va a engañar a mis clientes?',
    a: 'No, y no se puede configurar para eso. Si le preguntan si es un bot, lo admite. Cuando no está seguro de algo, prefiere avisarte a ti antes que inventar una respuesta. Un cliente al que le mienten a la cara es un cliente perdido, y eso cuesta más caro que cualquier mensaje sin contestar.',
  },
  {
    q: '¿Y si contesta una barbaridad?',
    a: 'Entras al panel y lo corriges: cada conversación queda guardada, y la pantalla de Mejoras te muestra justo lo que no supo responder para que se lo enseñes. También puedes apagarlo entero desde ahí en un clic, sin llamarnos.',
  },
  {
    q: '¿Cuánto tardo en tenerlo funcionando?',
    a: '48 horas desde que nos das acceso a tus cuentas y el material de tu negocio. Telegram queda listo el mismo día; WhatsApp depende de que Meta apruebe tu número, y ese trámite tiene sus tiempos, que no dependen de nosotros.',
  },
  {
    q: 'No tengo mis precios ni mis políticas escritos. ¿Sirve igual?',
    a: 'Sirve, pero rinde la mitad. El bot es tan bueno como lo que le des de comer: sin material contesta lo básico y te pasa a ti todo lo demás. Con una hoja de precios y las diez preguntas de siempre ya cambia por completo. Si no lo tienes escrito, te ayudamos a ordenarlo en la conversación; escribirlo entero por ti es un trabajo aparte.',
  },
  {
    q: '¿Tengo que darles mis claves?',
    a: 'No las de tu banco ni las de tus redes personales. Necesitamos entrar a la cuenta de la nube que se abre a tu nombre para este bot y a las conexiones de los canales que quieras usar. La llave de la IA no la vemos: se guarda cifrada dentro de tu propia cuenta. Cuando terminamos, cambias la contraseña del panel y listo.',
  },
];

/** Enlace al formulario con eVot ya elegido en el desplegable. */
export const evotContactHref = `${routes.contacto}?plan=${evot.slug}`;
