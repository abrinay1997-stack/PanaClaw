/**
 * Seguridad web — proteger un sitio que YA existe.
 *
 * Es el segundo producto del catálogo que no es «hacerte una web» (el primero
 * fue eBot), y por eso vive en su propio archivo: no se entrega en días de
 * diseño, no lleva rondas de revisión y dos de sus tres planes se cobran cada
 * mes, no una vez. Meterlo en `plans.ts` habría obligado a poner asteriscos en
 * los cuatro planes de sitio.
 *
 * A QUIÉN LE SIRVE, y conviene no difuminarlo: al que ya tiene un sitio —casi
 * siempre WordPress— y no sabe si está abierto de par en par. Lo que
 * construimos nosotros no lleva complementos que actualizar ni panel público
 * por el que entrar (es el pilar 02 de `services.ts`), así que a un cliente
 * nuestro media lista de aquí no le hace falta; eso se le dice, no se le cobra.
 * Lo que sí suma en cualquier sitio, también en los nuestros, es el escaneo, el
 * repaso del cifrado, la verificación en dos pasos, el filtro contra ataques y
 * el aviso de cookies y datos personales.
 *
 * DÓNDE TERMINA ESTO Y EMPIEZA CARE: Care mantiene el sitio que hicimos
 * nosotros —cambios, actualizaciones, uptime, copias—. Esto lo protege, sea de
 * quien sea. El tercer plan se pisa con Care Pro a propósito, porque quien
 * llega con un WordPress ajeno necesita las dos cosas y no le vamos a vender
 * dos suscripciones; está anotado en `docs/ESTADO.md` como decisión pendiente.
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
 * ORIGEN: los tres planes y las 14 filas de la comparativa vienen del documento
 * «Planes de Servicios: Web y Ciberseguridad». Dos cosas se adaptaron al
 * publicarlos: los precios estaban en euros y aquí se cobra en dólares (mismas
 * cifras, que son números de venta y no una conversión contable), y la
 * referencia al RGPD europeo pasa a la ley panameña de datos personales, que es
 * la que aplica a un negocio de aquí.
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
    'Revisamos tu sitio actual, te decimos por dónde podrían entrar y lo cerramos. Desde $80 la revisión, una sola vez; desde $30 al mes si además quieres que siga vigilado.',
  /** Lo que dispara la venta: no es el precio, es la historia de al lado. */
  gancho:
    'Un negocio monta su web, pasan unos meses y un día aparece caída, redirigiendo a una página de pastillas o pidiendo un rescate. Casi siempre es lo mismo: un complemento sin actualizar y una contraseña que nunca cambió.',
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
  desc: string;
  features: string[];
  featured?: boolean;
}

/**
 * Orden de venta: la revisión primero.
 *
 * Es lo contrario del anclaje de `/planes` (donde Corporate va primero) y es
 * deliberado: aquí lo que hay que vencer no es el precio, es que nadie se
 * suscribe a proteger algo que todavía no sabe si está roto. La revisión de
 * pago único es el paso barato que convierte esa duda en una lista de fallos
 * con nombre — y quien la lee entiende solo por qué existen los otros dos.
 */
export const securityPlans: SecurityPlan[] = [
  {
    slug: 'revision',
    name: 'Revisión de Seguridad',
    price: '$80–$150',
    suffix: '',
    kicker: 'Pago único · Informe en 5 días',
    desc: 'Una foto de cómo está tu sitio hoy: por dónde podrían entrar, qué tan grave es cada cosa y qué hacer primero. Se paga una vez y no te ata a nada.',
    features: [
      'Buscamos por dónde podrían entrar, con las mismas herramientas que usa quien ataca',
      'Comprobamos que tu sitio abra cifrado y bien configurado, sin avisos en el navegador',
      'Repasamos los diez fallos por los que más se entra en una web',
      'Te dejamos la entrada con verificación en dos pasos',
      'Informe en español, con lo urgente arriba y el resto por orden',
    ],
  },
  {
    slug: 'protegida',
    name: 'Web Protegida',
    price: '$30–$60',
    suffix: '/mes',
    kicker: 'Al mes · Sin permanencia',
    featured: true,
    desc: 'La revisión, pero cada mes y con las puertas ya cerradas. Para el sitio que trabaja: si te entra clientela por ahí, un mes caído cuesta más que un año de esto.',
    features: [
      'Todo lo de la Revisión, repetido cada mes',
      'Un filtro delante que bloquea los ataques antes de que lleguen a tu sitio',
      'Cerramos las puertas que tu gestor de contenidos deja abiertas de fábrica',
      'Copia de seguridad automática, y comprobamos que de verdad se pueda restaurar',
      'Aviso de cookies y datos personales en regla con la ley panameña',
      'Informe mensual de qué pasó y qué se paró',
    ],
  },
  {
    slug: 'total',
    name: 'Web Protegida Total',
    price: '$70–$120',
    suffix: '/mes',
    kicker: 'Al mes · Respuesta en 24–48 h',
    desc: 'Lo anterior más el mantenimiento: nosotros actualizamos, nosotros vigilamos y nosotros te avisamos. Tú no vuelves a entrar al panel salvo que quieras.',
    features: [
      'Todo lo de Web Protegida',
      'Actualizaciones, complementos y arreglos cada mes, hechos por nosotros',
      'Vigilado día y noche por si se cae: nos enteramos antes que tú',
      'Volvemos a escanearlo entero cada tres meses',
      'Te contestamos en 24–48 horas, por delante de la cola',
      'Repaso de accesibilidad una vez al año',
    ],
  },
];

const bySlug = (slug: string) => securityPlans.find((p) => p.slug === slug)!;

/** Los tres, por nombre, para componer textos sin escribirlos a mano. */
export const revision = bySlug('revision');
export const protegida = bySlug('protegida');
export const protegidaTotal = bySlug('total');

/** '$30–$60' + '/mes' → '$30–$60/mes'. Un solo sitio donde se pega el sufijo. */
export const precioCompleto = (plan: SecurityPlan) => `${plan.price}${plan.suffix}`;

/* ------------------------------------------------------------------ *
 * La comparativa
 * ------------------------------------------------------------------ */

export interface SecurityRow {
  /** Qué se lleva el cliente, no cómo se hace. */
  label: string;
  /** Un valor por plan, en el orden de `securityPlans`. `false` = no entra. */
  values: (boolean | string)[];
}

/**
 * La tabla es el corazón de esta página, y no un adorno.
 *
 * Tres planes que se solapan no se entienden leyendo tres listas sueltas: hay
 * que subir la vista, comparar y acordarse. Es justo lo que el punto 10 de
 * `docs/ESTADO.md` reclama para `/planes`, y aquí se hace desde el principio
 * porque la diferencia entre el segundo y el tercero es de cuatro filas.
 */
export const securityRows: SecurityRow[] = [
  { label: 'Buscamos por dónde podrían entrar', values: [true, true, true] },
  { label: 'Cifrado y configuración del navegador revisados', values: [true, true, true] },
  { label: 'Los diez fallos más comunes, repasados uno a uno', values: [true, true, true] },
  { label: 'Verificación en dos pasos configurada', values: [true, true, true] },
  { label: 'Informe de lo que encontramos', values: ['Una vez', 'Mensual', 'Mensual'] },
  { label: 'Filtro que bloquea ataques antes de llegar', values: [false, true, true] },
  { label: 'Puertas del gestor de contenidos cerradas', values: [false, true, true] },
  { label: 'Copias de seguridad comprobadas', values: [false, true, true] },
  { label: 'Cookies y datos personales en regla', values: [false, true, true] },
  { label: 'Actualizaciones y arreglos del sitio', values: [false, false, 'Mensual'] },
  { label: 'Vigilado por si se cae', values: [false, false, 'Día y noche'] },
  { label: 'Escaneo nuevo cada trimestre', values: [false, false, true] },
  { label: 'Te contestamos por delante de la cola', values: [false, false, '24–48 h'] },
  { label: 'Repaso de accesibilidad', values: [false, false, 'Anual'] },
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
    title: 'Buscamos por dónde se entra',
    desc: 'Con las mismas herramientas que usa quien ataca, pero sin romper nada: se prueba la puerta, no se tira abajo. Corre fuera de tu hora punta.',
  },
  {
    num: '03',
    title: 'Te lo contamos en español',
    desc: 'Un informe con lo urgente arriba, cada cosa explicada en lo que te puede pasar y no en su nombre técnico, y qué hacer con cada una. Es tuyo, aunque no nos contrates después.',
  },
  {
    num: '04',
    title: 'Lo cerramos',
    desc: 'Aplicamos lo que se pueda aplicar y te decimos qué queda fuera de nuestras manos. Al terminar volvemos a escanear: lo que se arregló tiene que salir arreglado.',
  },
];

/* ------------------------------------------------------------------ *
 * Qué sí y qué no
 * ------------------------------------------------------------------ */

export const seguridadIncluye: string[] = [
  'El escaneo entero y el informe, aunque no contrates nada después',
  'Cerrar lo que se pueda cerrar sin rehacer el sitio',
  'Dejarte la entrada con verificación en dos pasos y las contraseñas cambiadas',
  'Explicarte en una llamada lo que no se entienda del informe',
];

/**
 * Lo que no. Va publicado, y en seguridad importa el doble: es el único
 * servicio del catálogo donde prometer de más no se paga con una discusión,
 * sino con un cliente hackeado que creía estar cubierto.
 */
export const seguridadNoIncluye: string[] = [
  'La promesa de que no te van a hackear nunca — eso no lo puede firmar nadie, y quien lo firme te está mintiendo',
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
    q: 'Mi sitio es pequeño, ¿quién va a querer atacarlo?',
    a: 'Nadie te eligió a ti. Los ataques que tumban sitios pequeños son automáticos: un programa recorre internet probando la misma puerta en millones de webs y entra en las que la tienen abierta. No mira si vendes mucho o poco, mira si el complemento que usas tiene un fallo conocido. Por eso es tan barato protegerse y tan caro no hacerlo.',
  },
  {
    q: '¿Van a romper mi sitio revisándolo?',
    a: 'No. El escaneo prueba las puertas, no las tira abajo: es el mismo tipo de prueba que hace un buscador cuando recorre tu web, con más paciencia. Lo corremos fuera de tu hora de más visitas y, si tu sitio es delicado, sobre una copia. Antes de tocar nada para arreglarlo, hacemos copia de seguridad.',
  },
  {
    q: 'Si el sitio me lo hicieron ustedes, ¿también lo necesito?',
    a: 'La mitad de esta lista no, y te lo vamos a decir: lo que construimos no lleva complementos que actualizar ni panel público por el que entrar, que es por donde se cuelan casi todos. Lo que sí suma en cualquier sitio es el escaneo, la verificación en dos pasos, el filtro delante y el aviso de cookies y datos personales. Si ya tienes un plan Care, escríbenos antes de contratar nada: te decimos qué te falta de verdad y qué estarías pagando dos veces.',
  },
  {
    q: '¿Por qué el precio es un rango y no un número?',
    a: 'Porque no cuesta lo mismo revisar una página de cinco secciones que una tienda con cuentas de usuario, pasarela de pago y tres años de complementos encima. Te decimos la cifra exacta antes de empezar y por escrito, como todo lo demás del sitio: el rango es lo que hay antes de mirar, nunca lo que aparece en la factura.',
  },
  {
    q: 'Ya me hackearon. ¿Esto me sirve?',
    a: 'Limpiar un sitio infectado es otro trabajo: hay que sacar lo que dejaron dentro, comprobar que no vuelva y avisar a quien haya que avisar si se filtraron datos de clientes. Escríbenos y lo cotizamos aparte. Después de limpiarlo, sí: lo que evita la segunda vez es lo que hay en esta página.',
  },
  {
    q: '¿Puedo cancelar el plan mensual cuando quiera?',
    a: 'Cuando quieras, sin permanencia y sin llamada de retención. Lo que se quedan es tuyo: los informes, las contraseñas y la configuración. Lo único que se para es la vigilancia y el filtro, y te lo decimos claro el día que lo canceles para que no creas que sigues cubierto.',
  },
];

/* ------------------------------------------------------------------ *
 * Lo que usa el cotizador
 * ------------------------------------------------------------------ */

/**
 * La capacidad «Que no te lo hackeen» del paso 3, compuesta aquí y no escrita
 * en `quote.ts`.
 *
 * Son dos cifras y no una, porque el servicio son dos cosas: la revisión se
 * paga una vez al entregar y la protección se paga cada mes. El cotizador las
 * suma en dos totales distintos —nunca en el mismo— y por eso cada parte trae
 * su nota: un total que mezclara «$375» de sitio con «$45 al mes» de vigilancia
 * sería exactamente la cifra inventada que el resto del cotizador evita.
 */
export const seguridadCotizador = {
  setupName: revision.name,
  setupPrice: revision.price,
  setupNote: 'Pago único, al entregar el sitio. Escaneo, cierre e informe.',
  monthlyName: protegida.name,
  monthlyPrice: protegida.price,
  monthlyNote: 'Al mes, mientras lo quieras. Filtro, copias comprobadas e informe.',
} as const;

/** Enlace al formulario con el plan ya elegido en el desplegable. */
export const seguridadContactHref = (slug = protegida.slug) =>
  `${routes.contacto}?plan=seguridad-${slug}`;
