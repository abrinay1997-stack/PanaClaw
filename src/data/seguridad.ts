/**
 * Seguridad web — ciberseguridad para un sitio que ya existe.
 *
 * Es el tercer producto del catálogo que no es «hacerte una web», y por eso vive
 * en su propio archivo: no se entrega en días de diseño, no lleva rondas de
 * revisión y dos de sus tres planes se cobran cada mes.
 *
 * DÓNDE EMPIEZA Y DÓNDE TERMINA — las tres fronteras, decididas el 2026-08-11 y
 * escritas aquí porque son lo único que impide que el cliente lea tres veces el
 * mismo producto:
 *
 *  1. **Seguridad no es Care.** Care mantiene la infraestructura: dominio,
 *     alojamiento, copias, actualizaciones, uptime y los cambios del mes. Esto
 *     es ciberseguridad: quién entra, por dónde, y qué se hace para impedirlo.
 *     Por eso ningún plan de aquí ofrece actualizaciones ni copias — cuando esa
 *     línea se cruzó, los dos productos dejaron de entenderse.
 *  2. **Seguridad no es el Diagnóstico.** El Diagnóstico de $49 mira el negocio:
 *     por qué el sitio no vende y cómo convertir más. La Revisión mira la
 *     seguridad: cómo está montado, si funciona como debe y por dónde podrían
 *     entrar. Se parecen en la forma —los dos son «te revisamos el sitio»— y no
 *     se parecen en nada en el fondo.
 *  3. **La Revisión no va incluida en ningún plan mensual, y es obligatoria.**
 *     Se paga siempre y aparte. No es una decisión cosmética: regalarla dentro
 *     del mensual significa revisar gratis a quien luego no contrata, y proteger
 *     sin haber revisado es proteger a ciegas.
 *
 * A QUIÉN LE SIRVE: al que ya tiene un sitio —casi siempre WordPress— y no sabe
 * si está abierto de par en par. Lo que construimos nosotros no lleva
 * complementos que actualizar ni panel público por el que entrar (es el pilar 02
 * de `services.ts`), así que a un cliente nuestro media lista no le hace falta;
 * eso se le dice, no se le cobra.
 *
 * REGLA DE ESCRITURA (la de `services.ts` y `ebot.ts`): el dolor antes que la
 * herramienta. Aquí es más difícil que en ninguna otra página —la seguridad
 * viene con su propio diccionario— así que ni WAF, ni OWASP, ni hardening, ni
 * cabeceras HTTP. Lo que se hace se dice en lo que le cambia al cliente.
 *
 * REGLA DE PRECIOS: los importes de aquí son la única fuente. Los usan esta
 * página, el desplegable de `/contacto`, el cotizador (`quote.ts`) y la base
 * del chat (`kb.json.ts`), que además los mete en su lista blanca para que el
 * bot no pueda inventarse una cifra.
 *
 * ORIGEN: los planes vienen del documento «Planes de Servicios: Web y
 * Ciberseguridad». Tres cosas cambiaron al publicarlos: los precios estaban en
 * euros y aquí se cobra en dólares (mismas cifras, que son números de venta y no
 * una conversión contable); la referencia al RGPD europeo pasa a la ley panameña
 * de datos personales; y el plan «Completo» del documento incluía mantenimiento
 * web, que aquí se saca entero porque eso es Care.
 */
import { routes } from './links';

export const seguridad = {
  slug: 'seguridad',
  name: 'Seguridad web',
  tagline: 'Que no te lo hackeen.',
  /**
   * La frase de una línea. Se usa en el `<title>`, en la tarjeta social y en lo
   * que responde el chat: si cambia, cambia en los tres a la vez.
   */
  summary:
    'Revisamos cómo está montado tu sitio y por dónde podrían entrar, te lo entregamos por escrito y lo cerramos. La revisión cuesta desde $80 y se paga una vez; si además quieres que quede protegido mes a mes, desde $30 al mes.',
  /** Lo que dispara la venta: no es el precio, es la historia de al lado. */
  gancho:
    'Un negocio monta su web, pasan unos meses y un día aparece caída, redirigiendo a una página de pastillas o pidiendo un rescate. Casi siempre es lo mismo: un complemento sin actualizar y una contraseña que nunca cambió.',
  /**
   * Las dos fronteras, en una línea cada una. Se publican en la página, en
   * `/servicios` y en el chat con exactamente estas palabras: cuando cada sitio
   * las contaba a su manera, el cliente leía tres productos parecidos y no tres
   * productos distintos.
   */
  fronteras: {
    care: 'Care mantiene la infraestructura —dominio, copias, actualizaciones y los cambios del mes—. Esto es ciberseguridad: quién entra, por dónde y qué se hace para impedirlo.',
    diagnostico:
      'El Diagnóstico mira tu negocio: por qué tu sitio no vende y cómo hacer que convierta. La Revisión mira tu seguridad. Se parecen en la forma y en nada más.',
  },
} as const;

/* ------------------------------------------------------------------ *
 * Los tres planes
 * ------------------------------------------------------------------ */

export interface SecurityPlan {
  slug: string;
  name: string;
  /** Rango de precio. Lo parsea el cotizador, así que va con el mismo formato que `plans.ts`. */
  price: string;
  /** '' en el de pago único, '/mes' en los recurrentes. Decide en qué total suma. */
  suffix: string;
  /** Cómo se cobra y cuándo se entrega. Va junto al precio, nunca en una nota al pie. */
  kicker: string;
  /**
   * Lo que hay que contratar ANTES que esto. Va debajo del precio y no en la
   * letra pequeña: enterarse de un requisito después de decidir es la clase de
   * sorpresa que el resto del sitio promete no dar.
   */
  requisito?: string;
  desc: string;
  features: string[];
  featured?: boolean;
}

/**
 * Orden de venta: la revisión primero, y no por estética.
 *
 * Es lo contrario del anclaje de `/planes` (donde Corporate va primero) porque
 * aquí lo que hay que vencer no es el precio, es que nadie se suscribe a
 * proteger algo que todavía no sabe si está roto. Además es el orden real de
 * compra: sin revisión no hay plan mensual.
 */
export const securityPlans: SecurityPlan[] = [
  {
    slug: 'revision',
    name: 'Revisión de Seguridad',
    price: '$80–$150',
    suffix: '',
    kicker: 'Pago único · Informe en 5 días',
    desc: 'El punto de partida, y no se salta: miramos cómo está montado tu sitio, si funciona como debe y por dónde podrían entrar. Se paga una vez y el informe es tuyo, contrates después lo que contrates.',
    features: [
      'Cómo está montado y dónde vive: alojamiento, dominio y certificados',
      'Si funciona como debe: cifrado, formularios, accesos y páginas de error',
      'Por dónde podrían entrar: los diez fallos por los que más se entra en una web',
      'Te dejamos la entrada con verificación en dos pasos y las contraseñas cambiadas',
      'Informe en español, con lo urgente arriba y el resto por orden',
      'El informe es tuyo aunque no contrates ningún plan después',
    ],
  },
  {
    slug: 'protegida',
    name: 'Web Protegida',
    price: '$30–$60',
    suffix: '/mes',
    kicker: 'Al mes · Sin permanencia',
    requisito: 'Empieza con la Revisión de Seguridad',
    featured: true,
    desc: 'La protección del día a día, una vez sabemos cómo estás: un filtro delante, las puertas cerradas y alguien mirando cada mes. Para el sitio que trabaja — si te entra clientela por ahí, un mes caído cuesta más que un año de esto.',
    features: [
      'Un filtro delante que bloquea los ataques antes de que lleguen a tu sitio',
      'Cerramos las puertas que tu gestor de contenidos deja abiertas de fábrica',
      'Volvemos a revisarlo entero cada tres meses, no solo el primer día',
      'Cada mes miramos quién tiene acceso y con qué permisos',
      'Aviso de cookies y datos personales en regla con la ley panameña',
      'Informe mensual de qué pasó y qué se paró',
    ],
  },
  {
    slug: 'blindada',
    name: 'Web Blindada',
    price: '$70–$120',
    suffix: '/mes',
    kicker: 'Al mes · Respuesta en 24–48 h',
    requisito: 'Empieza con la Revisión de Seguridad',
    desc: 'Lo mismo, pero sin esperar a que pase algo: revisamos el sitio entero cada mes, vigilamos si alguien mete o cambia cosas, y si hay un incidente entramos nosotros a contenerlo.',
    features: [
      'Todo lo de Web Protegida',
      'Revisión completa cada mes en vez de cada tres',
      'Vigilamos si alguien cambia o mete algo en tu sitio, y te avisamos',
      'Si hay un incidente, respondemos en 24–48 horas y entramos a contenerlo',
      'Informe de cada cambio de acceso, no solo del mes',
    ],
  },
];

const bySlug = (slug: string) => securityPlans.find((p) => p.slug === slug)!;

/** Los tres, por nombre, para componer textos sin escribirlos a mano. */
export const revision = bySlug('revision');
export const protegida = bySlug('protegida');
export const blindada = bySlug('blindada');

/** '$30–$60' + '/mes' → '$30–$60/mes'. Un solo sitio donde se pega el sufijo. */
export const precioCompleto = (plan: SecurityPlan) => `${plan.price}${plan.suffix}`;

/**
 * Por qué el precio es un rango, en una frase.
 *
 * Va JUNTO a los precios y no en la FAQ: el precio se ve en el segundo tres y
 * la explicación estaba en el minuto cuatro, o sea después de decidir.
 */
export const porQueRango =
  'No cuesta lo mismo revisar una página de cinco secciones que una tienda con cuentas, pagos y tres años de complementos encima. La cifra exacta va por escrito antes de empezar.';

/* ------------------------------------------------------------------ *
 * La comparativa
 * ------------------------------------------------------------------ */

export interface SecurityRow {
  /** Qué se lleva el cliente, no cómo se hace. */
  label: string;
  /** Un valor por plan, en el orden de `securityPlans`. `false` = no entra. */
  values: (boolean | string)[];
  /**
   * Fila que existe para enseñar dónde TERMINA este producto. Se dibuja
   * distinta: no es algo que se compare entre planes, es algo que no está en
   * ninguno.
   */
  frontera?: boolean;
}

/**
 * La tabla es el corazón de esta página, y no un adorno.
 *
 * Tres planes que se solapan no se entienden leyendo tres listas sueltas: hay
 * que subir la vista, comparar y acordarse. La última fila no compara nada — dice
 * lo que no está aquí — y es la que más preguntas ahorra, porque el solape con
 * Care es la confusión más cara del catálogo.
 */
export const securityRows: SecurityRow[] = [
  {
    label: 'Revisión completa: cómo está montado y por dónde se entra',
    values: ['Una vez', 'Cada 3 meses', 'Cada mes'],
  },
  { label: 'Cifrado y certificados revisados', values: [true, true, true] },
  { label: 'Verificación en dos pasos configurada', values: [true, true, true] },
  {
    label: 'Quién tiene acceso y con qué permisos',
    values: ['Se deja en orden', 'Se revisa cada mes', 'Se revisa cada mes'],
  },
  { label: 'Informe de lo que encontramos', values: ['Una vez', 'Mensual', 'Mensual'] },
  { label: 'Filtro que bloquea ataques antes de llegar', values: [false, true, true] },
  { label: 'Puertas del gestor de contenidos cerradas', values: [false, true, true] },
  { label: 'Cookies y datos personales en regla', values: [false, true, true] },
  { label: 'Vigilamos si alguien cambia o mete algo', values: [false, false, true] },
  { label: 'Respuesta si hay un incidente', values: [false, false, '24–48 h'] },
  {
    label: 'Mantenimiento, copias y actualizaciones',
    values: ['Eso es Care', 'Eso es Care', 'Eso es Care'],
    frontera: true,
  },
];

/* ------------------------------------------------------------------ *
 * Cómo se hace
 * ------------------------------------------------------------------ */

export interface SecurityPaso {
  num: string;
  title: string;
  desc: string;
}

/**
 * Los cuatro pasos de la revisión.
 *
 * Van publicados porque en seguridad la objeción no es el precio, es «¿y qué me
 * vas a hacer exactamente?». Un servicio que no cuenta su procedimiento se
 * parece demasiado a quien te llama para decirte que tu computadora tiene un
 * virus.
 */
export const securityPasos: SecurityPaso[] = [
  {
    num: '01',
    title: 'Nos das permiso, por escrito',
    desc: 'Nada se toca sin que lo autorices tú y sin que sepamos que el sitio es tuyo. Se firma qué vamos a revisar y qué no, y ahí se acaba el alcance.',
  },
  {
    num: '02',
    title: 'Miramos cómo está montado',
    desc: 'Dónde vive, con qué está hecho, quién tiene llaves y si todo eso funciona como debe. Es la parte que nadie mira hasta que algo falla.',
  },
  {
    num: '03',
    title: 'Buscamos por dónde se entra',
    desc: 'Con las mismas herramientas que usa quien ataca, pero sin romper nada: se prueba la puerta, no se tira abajo. Corre fuera de tu hora punta.',
  },
  {
    num: '04',
    title: 'Te lo contamos y lo cerramos',
    desc: 'Un informe con lo urgente arriba, cada cosa explicada en lo que te puede pasar y no en su nombre técnico. Aplicamos lo que se pueda aplicar y te decimos qué queda fuera de nuestras manos. Al terminar volvemos a mirar: lo que se arregló tiene que salir arreglado.',
  },
];

/* ------------------------------------------------------------------ *
 * Qué sí y qué no
 * ------------------------------------------------------------------ */

/**
 * El alcance de la revisión, y punto.
 *
 * Antes esta lista contaba una cosa y la ficha del plan otra —una decía que solo
 * miramos, la otra que además cerramos— y «¿arreglan o solo me dicen qué está
 * mal?» es LA pregunta de un producto de auditoría. Ahora las dos salen de aquí:
 * la ficha lista lo que se mira, y esto lo que se entrega.
 */
export const seguridadIncluye: string[] = [
  'El escaneo entero y el informe, aunque no contrates ningún plan después',
  'Cerrar lo que se pueda cerrar sin rehacer el sitio, dentro de la misma revisión',
  'Dejarte la entrada con verificación en dos pasos y las contraseñas cambiadas',
  'Una llamada para explicarte lo que no se entienda del informe',
];

/**
 * Lo que no. Va publicado, y en seguridad importa el doble: es el único
 * servicio del catálogo donde prometer de más no se paga con una discusión,
 * sino con un cliente hackeado que creía estar cubierto.
 */
export const seguridadNoIncluye: string[] = [
  'La promesa de que no te van a hackear nunca — eso no lo puede firmar nadie, y quien lo firme te está mintiendo',
  'El mantenimiento del sitio: actualizaciones, copias y vigilancia de caídas son Care, no esto',
  'Recuperar un sitio que ya está hackeado: eso es otro trabajo y se cotiza aparte',
  'Rehacer tu sitio si lo que encontramos es que está mal construido de raíz',
  'Lo que cobren terceros si tu caso pide un plan de pago en el filtro o en tu alojamiento',
  'Auditar sistemas que no sean tu sitio web: redes internas, computadoras o correo',
];

/* ------------------------------------------------------------------ *
 * Preguntas
 * ------------------------------------------------------------------ */

export interface SecurityFaq {
  q: string;
  a: string;
}

/** Las que frenan la compra, no las que se preguntan primero. */
export const seguridadFaq: SecurityFaq[] = [
  {
    q: '¿Por qué tengo que pagar la revisión si voy a contratar el plan mensual?',
    a: 'Porque son dos trabajos distintos y el segundo no se puede hacer bien sin el primero. La revisión es mirar tu sitio entero una vez —cómo está montado, quién tiene llaves, por dónde se entra— y eso lleva horas que no se repiten cada mes. El plan mensual es lo que viene después: el filtro, las puertas cerradas y alguien mirando. Proteger sin haber revisado es proteger a ciegas, y no lo hacemos.',
  },
  {
    q: 'Mi sitio es pequeño, ¿quién va a querer atacarlo?',
    a: 'Nadie te eligió a ti. Los ataques que tumban sitios pequeños son automáticos: un programa recorre internet probando la misma puerta en millones de webs y entra en las que la tienen abierta. No mira si vendes mucho o poco, mira si el complemento que usas tiene un fallo conocido. Por eso es tan barato protegerse y tan caro no hacerlo.',
  },
  {
    q: '¿En qué se diferencia esto de Care?',
    a: `${seguridad.fronteras.care} Un sitio puede tener Care y no tener seguridad, o al revés. Si ya tienes Care, escríbenos antes de contratar nada: te decimos qué te falta de verdad y qué estarías pagando dos veces.`,
  },
  {
    q: '¿Y del Diagnóstico de $49?',
    a: `${seguridad.fronteras.diagnostico} Si lo que te preocupa es que tu sitio no te trae clientes, empieza por el Diagnóstico. Si lo que te preocupa es que te lo tumben o te lo roben, empieza por la Revisión.`,
  },
  {
    q: '¿Van a romper mi sitio revisándolo?',
    a: 'No. El escaneo prueba las puertas, no las tira abajo: es el mismo tipo de prueba que hace un buscador cuando recorre tu web, con más paciencia. Lo corremos fuera de tu hora de más visitas y, si tu sitio es delicado, sobre una copia. Antes de tocar nada para arreglarlo, hacemos copia de seguridad.',
  },
  {
    q: 'Si el sitio me lo hicieron ustedes, ¿también lo necesito?',
    a: 'La mitad de esta lista no, y te lo vamos a decir: lo que construimos no lleva complementos que actualizar ni panel público por el que entrar, que es por donde se cuelan casi todos. Lo que sí suma en cualquier sitio es la revisión de cómo está montado, la verificación en dos pasos, el filtro delante y el aviso de cookies y datos personales.',
  },
  {
    q: 'Ya me hackearon. ¿Esto me sirve?',
    a: 'Limpiar un sitio infectado es otro trabajo: hay que sacar lo que dejaron dentro, comprobar que no vuelva y avisar a quien haya que avisar si se filtraron datos de clientes. Escríbenos y lo cotizamos aparte. Después de limpiarlo, sí: lo que evita la segunda vez es lo que hay en esta página.',
  },
  {
    q: '¿Puedo cancelar el plan mensual cuando quiera?',
    a: 'Cuando quieras, sin permanencia y sin llamada de retención. Lo que se queda es tuyo: los informes, las contraseñas y la configuración. Lo único que se para es la vigilancia y el filtro, y te lo decimos claro el día que lo canceles para que no creas que sigues cubierto.',
  },
];

/* ------------------------------------------------------------------ *
 * Lo que usa el cotizador
 * ------------------------------------------------------------------ */

/**
 * La capacidad «Que no te lo hackeen» del paso 3, compuesta aquí y no escrita
 * en `quote.ts`.
 *
 * Son dos cifras y no una porque son dos compromisos: la revisión se paga una
 * vez y la protección cada mes. El cotizador las suma en dos totales distintos
 * —nunca en el mismo— y por eso cada parte trae su nota: un total que mezclara
 * «$375» de sitio con «$45 al mes» de vigilancia sería exactamente la cifra
 * inventada que el resto del cotizador evita.
 *
 * Las dos van juntas y no se pueden separar aquí porque el mensual **exige** la
 * revisión: ofrecer en el cotizador la mitad barata sería vender algo que luego
 * no se puede contratar.
 */
export const seguridadCotizador = {
  setupName: revision.name,
  setupPrice: revision.price,
  setupNote: 'Pago único, al entregar el sitio. Es el punto de partida y no se salta.',
  monthlyName: protegida.name,
  monthlyPrice: protegida.price,
  monthlyNote: 'Al mes, mientras lo quieras. Filtro, puertas cerradas e informe.',
} as const;

/** Enlace al formulario con el plan ya elegido en el desplegable. */
export const seguridadContactHref = (slug = protegida.slug) =>
  `${routes.contacto}?plan=seguridad-${slug}`;
