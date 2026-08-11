/**
 * Motor del cotizador.
 *
 * Todo lo que hay aquí se deriva de `plans.ts`, `modules.ts`, `ebot.ts` y
 * `seguridad.ts`: este archivo NO inventa precios, los compone. Si cambia el
 * precio de un plan o de una capacidad, el cotizador se actualiza solo.
 *
 * Hay DOS totales y nunca se funden en uno: lo que se paga de una vez y lo que
 * se paga cada mes. Lo trajo el servicio de seguridad, que es las dos cosas a
 * la vez, y es la única forma de decir la verdad — proyectar una mensualidad a
 * doce meses para poder enseñar un solo número sería anunciar un compromiso que
 * nadie ha firmado.
 *
 * Es lógica pura y sin dependencias del DOM para que la pueda usar tanto el
 * render de Astro como el script del navegador, con exactamente el mismo
 * resultado. Un cotizador que dice un número distinto al de /planes destruye
 * justo la confianza que el sitio vende.
 *
 * DOS RAMAS. La primera pregunta no solo fija el plan: elige qué se está
 * cotizando. «Estrenar sitio» lleva por los pasos de siempre (tamaño y
 * capacidades) y «Revisar el que ya tengo» lleva a la Auditoría de Seguridad,
 * que no es una web y por eso no puede compartir las preguntas. Antes ese
 * cliente —el que YA tiene sitio y solo quiere saber si está abierto de par en
 * par— no tenía ningún camino aquí: se le mandaba a cotizar una web que no
 * quería, o se iba.
 *
 * LO QUE NO SE PUEDE MARCAR SE APAGA, Y DICE POR QUÉ. Es la regla que gobierna
 * los tres pasos con opciones incompatibles, y no es cosmética:
 *
 *  · Paso 2 — se podía elegir «Vender en línea» y luego «Una sola página, desde
 *    $295», y cobrar $1,200. El motor siempre se quedó con el plan más alto (lo
 *    correcto), pero la etiqueta anunciaba un precio que en ese contexto era
 *    imposible. Una etiqueta que miente es exactamente lo que el resto del
 *    cotizador está construido para evitar.
 *  · Paso 4 — se podía pedir «Ya, esta semana» sobre un plan de 8–12 días y lo
 *    único que pasaba era una nota al pie. Prometer una fecha que no se puede
 *    cumplir cuesta más caro que perder la venta.
 */
import { plans, diagnostico, type Plan } from './plans';
import { modules } from './modules';
import { ebot, ebotCostos } from './ebot';
import {
  seguridadCotizador,
  revision,
  protegida,
  blindada,
  revisionTramos,
  revisionEntrega,
} from './seguridad';

/* ------------------------------------------------------------------ *
 * Precios: de texto a número
 * ------------------------------------------------------------------ */

export interface Money {
  min: number;
  max: number;
}

/** '$1,200' → {min:1200,max:1200} · '$250–$900' → {min:250,max:900} */
export function parsePrice(price: string): Money {
  const nums = price.replace(/,/g, '').match(/\d+(\.\d+)?/g)?.map(Number) ?? [0];
  return { min: nums[0]!, max: nums[nums.length - 1]! };
}

export function formatMoney({ min, max }: Money): string {
  const f = (n: number) => `$${n.toLocaleString('en-US')}`;
  return min === max ? f(min) : `${f(min)} – ${f(max)}`;
}

/**
 * Una cifra mensual. El sufijo se decide aquí y en ningún otro sitio: es lo que
 * distingue «$45» de «$45 cada mes hasta que lo pares», y escribirlo a mano en
 * cada plantilla es cómo se acaba enseñando una mensualidad sin decir que lo es.
 * Mismo formato que usa Care en `/servicios`.
 */
export const formatMensual = (money: Money): string => `${formatMoney(money)}/mes`;

/** Una cantidad que no suma nada: sirve para saber si hay parte mensual. */
export const isZero = ({ min, max }: Money): boolean => min === 0 && max === 0;

const dinero = (n: number): Money => ({ min: n, max: n });

/* ------------------------------------------------------------------ *
 * Pasos
 * ------------------------------------------------------------------ */

/** Qué se está cotizando. Lo decide la primera respuesta. */
export type Rama = 'web' | 'auditoria';

export interface QuoteOption {
  value: string;
  label: string;
  hint: string;
  /** Plan mínimo que exige esta respuesta. */
  requiresPlan?: PlanSlug;
  /** Solo en el paso 1: a qué rama lleva esta respuesta. Sin esto, 'web'. */
  rama?: Rama;
  /**
   * Otras opciones del mismo paso que esta apaga al marcarse. Hoy solo la usan
   * los dos planes mensuales de seguridad: Blindada ya lleva dentro todo lo de
   * Protegida, así que marcar las dos sería pagar dos veces por lo mismo.
   */
  excluye?: string[];
}

export interface QuoteStep {
  id: string;
  /** La pregunta, en segunda persona. */
  question: string;
  help: string;
  multiple: boolean;
  options: QuoteOption[];
  /** Paso que solo existe en una rama. Sin esto, el paso es de las dos. */
  rama?: Rama;
}

export type PlanSlug = 'start' | 'launch' | 'corporate' | 'commerce';

/** De menor a mayor. El plan recomendado es el mayor que exija alguna respuesta. */
const PLAN_ORDER: PlanSlug[] = ['start', 'launch', 'corporate', 'commerce'];

export const steps: QuoteStep[] = [
  {
    id: 'objetivo',
    question: '¿Qué necesitas hacer?',
    help: 'Elige lo que más se parezca. Nada de esto es definitivo.',
    multiple: false,
    options: [
      { value: 'nuevo', label: 'Estrenar sitio', hint: 'Aún no tienes nada en línea.', requiresPlan: 'start' },
      { value: 'rehacer', label: 'Rehacer el que tengo', hint: 'Existe, pero va lento o da vergüenza.', requiresPlan: 'launch' },
      { value: 'vender', label: 'Vender en línea', hint: 'Catálogo, carrito y cobros.', requiresPlan: 'commerce' },
      { value: 'sistema', label: 'Un sistema a medida', hint: 'Reservas, portal de clientes, panel interno.', requiresPlan: 'corporate' },
      /*
       * La quinta respuesta no cotiza una web: cotiza mirar la que ya existe.
       * Va la última porque las cuatro de arriba son el negocio principal, y no
       * fuera de la lista porque quien llega con esta necesidad —«creo que me
       * pueden entrar»— no tiene ningún otro sitio donde ponerla; antes se iba
       * del cotizador sin cotizar nada.
       */
      {
        value: 'auditar',
        label: 'Revisar el que ya tengo',
        hint: 'Está en línea y quieres saber por dónde te pueden entrar.',
        rama: 'auditoria',
      },
    ],
  },

  /* ---------------- Rama web ---------------- */
  {
    id: 'alcance',
    rama: 'web',
    question: '¿De qué tamaño?',
    help: 'Si dudas entre dos, elige el más pequeño: ampliar después cuesta lo mismo.',
    multiple: false,
    options: [
      { value: 'una', label: 'Una sola página', hint: '4–5 secciones. Para un evento o una campaña.', requiresPlan: 'start' },
      { value: 'landing', label: 'Una página, a medida', hint: '7 secciones diseñadas desde cero. Para pauta.', requiresPlan: 'launch' },
      { value: 'multi', label: 'Varias páginas', hint: 'Hasta 10. Servicios, nosotros, contacto, blog.', requiresPlan: 'corporate' },
      { value: 'catalogo', label: 'Catálogo completo', hint: 'Productos, inventario y checkout.', requiresPlan: 'commerce' },
    ],
  },
  {
    id: 'capacidades',
    rama: 'web',
    question: '¿Qué tiene que hacer, además de existir?',
    help: 'Marca todas las que apliquen. Las que ya vengan en tu plan salen sin coste.',
    multiple: true,
    options: [
      { value: 'form', label: 'Recibir mensajes por WhatsApp', hint: 'Quien te escriba te llega al teléfono.' },
      { value: 'blog', label: 'Salir en Google', hint: 'Blog y todo lo que hace falta para posicionar.', requiresPlan: 'corporate' },
      { value: 'cms', label: 'Editarlo tú mismo', hint: 'Cambiar textos e imágenes sin llamar a nadie.', requiresPlan: 'corporate' },
      { value: 'reservas', label: 'Reservas y citas', hint: 'Tus clientes reservan solos, sin llamarte.' },
      { value: 'cobros', label: 'Cobrar en línea', hint: 'Yappy, tarjeta y PayPal.', requiresPlan: 'commerce' },
      { value: 'login', label: 'Cuentas de usuario', hint: 'Cada persona entra con su clave.' },
      { value: 'panel', label: 'Panel de control', hint: 'Tus números y tu gestión en una pantalla.' },
      { value: 'portal', label: 'Portal de clientes', hint: 'Cada cliente consulta lo suyo sin escribirte.' },
      { value: 'api', label: 'Conectar con otro sistema', hint: 'Que tu web y tu programa dejen de ir por separado.' },
      /*
       * Esta opción era «Respuestas automáticas» y cotizaba el módulo de
       * $250–$900. Hoy la cubre eBot por $70, así que cotizar aquí lo caro sería
       * cobrar de más por lo mismo. El nombre del producto va en la ayuda y no
       * en la etiqueta: quien está en el paso 3 no sabe todavía qué es «eBot»,
       * sabe qué le duele.
       */
      { value: 'ebot', label: 'Contestar tus mensajes solo', hint: `${ebot.name}: WhatsApp, Instagram, Messenger y Telegram, a cualquier hora.` },
      { value: 'inventario', label: 'Control de inventario', hint: 'Dejar de vender lo que no tienes.' },
      /*
       * La única opción del cotizador con una parte mensual. Va la última a
       * propósito: es lo que se decide después de tener el sitio en la cabeza,
       * y ponerla entre las capacidades del sitio la haría competir con ellas
       * en vez de sumarse.
       */
      { value: 'seguridad', label: 'Que no te lo hackeen', hint: 'Lo revisamos al entregar y lo dejamos vigilado mes a mes.' },
    ],
  },

  /* ---------------- Rama auditoría ---------------- */
  {
    id: 'sitio',
    rama: 'auditoria',
    question: '¿Cómo es el sitio que ya tienes?',
    help: 'De esto depende el precio: no cuesta lo mismo revisar una página que una tienda con años encima.',
    multiple: false,
    options: revisionTramos.map((t) => ({ value: t.slug, label: t.label, hint: t.hint })),
  },
  {
    id: 'refuerzos',
    rama: 'auditoria',
    question: '¿Y después de la auditoría?',
    help: 'La auditoría se paga una vez y el informe es tuyo. Esto decide cómo queda el sitio después.',
    multiple: true,
    options: [
      {
        value: 'protegida',
        label: 'Que quede protegido cada mes',
        hint: `${protegida.name}: un filtro delante, las puertas cerradas y alguien mirando.`,
        excluye: ['blindada'],
      },
      {
        value: 'blindada',
        label: 'Protegido y vigilado, con respuesta si pasa algo',
        hint: `${blindada.name}: todo lo anterior, revisión cada mes y respuesta en 24–48 h.`,
        excluye: ['protegida'],
      },
      /*
       * El único producto del cotizador que no mira la seguridad. Está aquí y
       * no en la rama web porque solo tiene sentido sobre un sitio que ya
       * existe —es justo a quien se le pregunta en este camino— y porque quien
       * viene preocupado por que le entren muchas veces también sospecha que no
       * le está vendiendo. Los dos nombres dicen qué mira cada uno, así que
       * ofrecerlos juntos ya no confunde.
       */
      {
        value: 'diagnostico',
        label: 'Saber por qué no te trae clientes',
        hint: `${diagnostico.name}: las 3 razones concretas y qué hacer con cada una.`,
      },
    ],
  },

  /* ---------------- Las dos ramas ---------------- */
  {
    id: 'urgencia',
    question: '¿Para cuándo lo necesitas?',
    help: 'Esto no cambia el precio. Cambia cómo ordenamos la cola.',
    multiple: false,
    options: [
      { value: 'ya', label: 'Ya', hint: 'Esta semana, si se puede.' },
      { value: 'mes', label: 'Este mes', hint: 'Hay fecha, pero no es hoy.' },
      { value: 'flexible', label: 'Sin prisa', hint: 'Quiero saber cuánto cuesta y planificar.' },
    ],
  },
];

/* ------------------------------------------------------------------ *
 * Ramas
 * ------------------------------------------------------------------ */

export type Answers = Record<string, string[]>;

const stepById = (id: string) => steps.find((s) => s.id === id)!;
const optionOf = (stepId: string, value: string) =>
  stepById(stepId).options.find((o) => o.value === value);

/** La rama que abre la primera respuesta. Sin respuesta todavía, la de siempre. */
export function ramaDe(answers: Answers): Rama {
  const objetivo = answers.objetivo?.[0];
  return (objetivo && optionOf('objetivo', objetivo)?.rama) || 'web';
}

/**
 * Los pasos que se recorren de verdad, en orden.
 *
 * La plantilla dibuja los seis; esto decide cuáles se enseñan y en qué orden se
 * pasa de uno al siguiente. El contador («Paso 2 de 4») también sale de aquí:
 * las dos ramas tienen cuatro preguntas, y si algún día dejan de tenerlas el
 * número se ajusta solo en vez de mentir.
 */
export const pasosActivos = (answers: Answers): QuoteStep[] => {
  const rama = ramaDe(answers);
  return steps.filter((s) => !s.rama || s.rama === rama);
};

/* ------------------------------------------------------------------ *
 * Capacidades → qué las cubre
 * ------------------------------------------------------------------ */

/**
 * Cada capacidad se resuelve de una de dos formas:
 *  - `includedFrom`: a partir de ese plan viene incluida y no suma nada.
 *  - `moduleName`: se cobra aparte, con el precio literal de `modules.ts`.
 * Una capacidad puede tener ambas: incluida en planes altos, módulo en bajos.
 */
export interface CapabilityRule {
  includedFrom?: PlanSlug;
  moduleName?: string;
  /**
   * Producto propio con precio cerrado que NO vive en `modules.ts` — hoy solo
   * eBot. No es un módulo: no se construye dentro del sitio, se monta aparte en
   * la cuenta del cliente, y por eso arrastra una nota que los módulos no
   * necesitan (los gastos mensuales que el cotizador no puede sumar porque no
   * los cobramos nosotros).
   */
  product?: { name: string; price: string; note: string };
  /**
   * Servicio que se cobra en dos tiempos: algo al entregar y algo cada mes.
   * Hoy solo Seguridad.
   *
   * Es la única regla que produce DOS líneas de desglose y que suma en dos
   * totales distintos. Las dos cifras no se pueden fundir en una: «$375 y $45
   * al mes» no es ningún número, y un cotizador que se inventara la suma —doce
   * meses por delante, pongamos— estaría anunciando un compromiso que nadie ha
   * firmado. Se enseñan separadas o no se enseñan.
   */
  servicio?: {
    setupName: string;
    setupPrice: string;
    setupNote: string;
    monthlyName: string;
    monthlyPrice: string;
    monthlyNote: string;
  };
}

/**
 * La nota de eBot en el desglose. Se compone de `ebot.ts`, como todo lo demás:
 * el cotizador suma los $70 y solo los $70 — decir «total» sin mencionar las
 * dos cuentas mensuales sería el mismo engaño que la página de eBot evita
 * publicándolas en grande.
 */
const ebotNota =
  `Pago único. Aparte pagas por tu cuenta ` +
  ebotCostos.map((c) => `${c.price.replace(' al mes', '')}/mes de ${c.corto}`).join(' y ') +
  '.';

export const CAPABILITIES: Record<string, CapabilityRule> = {
  form: { includedFrom: 'start' }, // los cuatro planes lo traen
  blog: { includedFrom: 'corporate' },
  cms: { includedFrom: 'corporate' },
  cobros: { includedFrom: 'commerce' },
  inventario: { includedFrom: 'commerce', moduleName: 'Control de inventario' },
  reservas: { moduleName: 'Reservas y citas' },
  login: { moduleName: 'Cuentas de usuario' },
  panel: { moduleName: 'Panel de control' },
  portal: { moduleName: 'Portal de clientes' },
  api: { moduleName: 'Conexión con otro sistema' },
  ebot: { product: { name: ebot.name, price: ebot.price, note: ebotNota } },
  seguridad: { servicio: seguridadCotizador },
};

/* ------------------------------------------------------------------ *
 * Resolución del plan
 * ------------------------------------------------------------------ */

const rank = (slug: PlanSlug) => PLAN_ORDER.indexOf(slug);

/** El paso donde se marcan capacidades. Lo demás fija el plan. */
const CAPABILITY_STEP = 'capacidades';

const planBySlug = (slug: PlanSlug) => plans.find((p) => p.slug === slug)!;

/** 'PanaClaw Corporate' → 'Corporate'. Dentro del cotizador la marca sobra. */
const planCorto = (plan: Plan) => plan.name.replace('PanaClaw ', '');

/**
 * El plan es el mayor que exija cualquiera de las respuestas: recomendar por
 * debajo de lo que la persona pidió sería cotizar algo que no le sirve.
 *
 * `excepto` deja fuera una capacidad concreta del cálculo, que es como se
 * averigua qué aporta ella sola. Sin eso no se puede distinguir «esto ya lo
 * tienes» de «esto es lo que te lo está dando».
 */
function resolverPlan(
  answers: Answers,
  opciones: { soloPasosDePlan?: boolean; excepto?: string } = {}
): { slug: PlanSlug; driver: string } {
  let slug: PlanSlug = 'start';
  let driver = '';
  for (const step of steps) {
    if (opciones.soloPasosDePlan && step.id === CAPABILITY_STEP) continue;
    const picked = answers[step.id] ?? [];
    for (const opt of step.options) {
      if (step.id === CAPABILITY_STEP && opt.value === opciones.excepto) continue;
      if (picked.includes(opt.value) && opt.requiresPlan && rank(opt.requiresPlan) > rank(slug)) {
        slug = opt.requiresPlan;
        driver = opt.label.toLowerCase();
      }
    }
  }
  return { slug, driver };
}

/**
 * El plan que fijan los pasos 1 y 2, sin mirar las capacidades.
 *
 * Es la vara con la que se decide qué opciones se bloquean, y tiene que ser
 * esta y no el plan final: si una capacidad se bloqueara por el plan al que
 * ella misma sube, quedaría marcada y sin poder desmarcarse — encerrando a la
 * persona en el plan caro. Con dos capacidades que se justifican mutuamente
 * (blog y CMS piden las dos Corporate) el enredo es peor. Mirando solo los
 * pasos anteriores, lo que se bloquea nunca depende de algo que se pueda tocar
 * en esa misma pantalla, y desmarcarlo es siempre seguro.
 */
export const basePlanSlug = (answers: Answers): PlanSlug =>
  resolverPlan(answers, { soloPasosDePlan: true }).slug;

/**
 * El suelo que pone la PRIMERA respuesta, y solo ella.
 *
 * Es lo que apaga las opciones del paso 2 que no alcanzan. Mira únicamente el
 * paso 1 por el mismo motivo que `basePlanSlug` ignora las capacidades: lo que
 * se bloquea no puede depender de algo que se toca en esa misma pantalla, o la
 * opción marcada se quedaría sin poder desmarcarse.
 */
function pisoDelObjetivo(answers: Answers): { slug: PlanSlug; label: string } {
  const objetivo = answers.objetivo?.[0];
  const opt = objetivo ? optionOf('objetivo', objetivo) : undefined;
  return { slug: opt?.requiresPlan ?? 'start', label: opt?.label ?? '' };
}

/* ------------------------------------------------------------------ *
 * Plazos y fechas
 * ------------------------------------------------------------------ */

/**
 * Los días que anuncia un plazo escrito: 'Entrega 8–12 días' → {min:8,max:12},
 * 'Entrega 72 h' → {min:3,max:3}. Se lee del propio texto para que cambiar un
 * plazo en `plans.ts` no obligue a tocar nada más.
 */
export function plazoDias(delivery: string): Money {
  const nums = delivery.match(/\d+/g)?.map(Number) ?? [];
  if (!nums.length) return { min: 0, max: 0 };
  const enHoras = /\bh\b|hora/i.test(delivery);
  const f = (n: number) => (enHoras ? Math.ceil(n / 24) : n);
  return { min: f(Math.min(...nums)), max: f(Math.max(...nums)) };
}

/** Suma días hábiles saltándose sábados y domingos. */
function sumarHabiles(desde: Date, dias: number): Date {
  const d = new Date(desde.getTime());
  let quedan = dias;
  while (quedan > 0) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) quedan--;
  }
  return d;
}

const mesDe = (d: Date) => new Intl.DateTimeFormat('es-PA', { month: 'long' }).format(d);

/**
 * El plazo, en fechas de calendario: 'del 14 al 18 de agosto'.
 *
 * Un plazo escrito en días obliga a hacer la cuenta —y a hacerla mal, porque
 * nadie descuenta los fines de semana de cabeza—. La fecha es la única forma de
 * que «8–12 días» signifique algo antes de firmar.
 *
 * `hoy` se pasa siempre desde fuera y nunca se toma por defecto en el render de
 * Astro: una fecha calculada en el build se quedaría congelada en el HTML y el
 * sitio prometería, semanas después, una entrega ya vencida. Esto solo lo llama
 * el navegador.
 */
export function fechaDeEntrega(delivery: string, hoy: Date): string {
  const { min, max } = plazoDias(delivery);
  if (!max) return '';
  const a = sumarHabiles(hoy, min);
  const b = sumarHabiles(hoy, max);
  if (min === max) return `el ${a.getDate()} de ${mesDe(a)}`;
  return mesDe(a) === mesDe(b)
    ? `del ${a.getDate()} al ${b.getDate()} de ${mesDe(b)}`
    : `del ${a.getDate()} de ${mesDe(a)} al ${b.getDate()} de ${mesDe(b)}`;
}

/** Lo que se entrega en la rama de cada quien, para poder hablar de plazos. */
export function plazoDe(answers: Answers): string {
  if (ramaDe(answers) === 'auditoria') return answers.sitio?.[0] ? revisionEntrega : '';
  if (!answers.objetivo?.[0] || !answers.alcance?.[0]) return '';
  return planBySlug(resolverPlan(answers).slug).delivery;
}

/** Cuántos días hábiles caben en «esta semana» y en «este mes». */
const TOPE_URGENCIA: Record<string, number> = { ya: 7, mes: 30 };

/* ------------------------------------------------------------------ *
 * Estado de cada opción
 * ------------------------------------------------------------------ */

/**
 * Las respuestas posibles a la única pregunta que le importa a quien está
 * eligiendo: ¿qué me cuesta a mí esto, ahora mismo? — y, cuando la respuesta es
 * «no puedes», por qué no.
 */
export type OptionState =
  /** El plan base ya la trae. Marcarla no decide nada: se bloquea. */
  | { kind: 'bloqueada' }
  /** Sale gratis por otra capacidad marcada, que sí se puede desmarcar. */
  | { kind: 'gratis' }
  /** Se cobra aparte. */
  | { kind: 'modulo'; delta: Money }
  /** Se cobra aparte, y además deja una mensualidad detrás. */
  | { kind: 'servicio'; delta: Money; mensual: Money }
  /** Solo deja mensualidad: no mueve el total de una vez. */
  | { kind: 'mensual'; mensual: Money }
  /** Marcarla cambia de plan: el precio es la diferencia, no el del plan nuevo. */
  | { kind: 'sube-plan'; delta: Money; to: Plan }
  /** Un precio de arranque, sin nada que comparar. */
  | { kind: 'desde'; precio: Money }
  /** Precio cerrado (los tramos de la auditoría). */
  | { kind: 'fijo'; precio: Money }
  /**
   * Se queda por debajo de lo que pidió el paso 1. No lleva motivo propio: el
   * porqué es el mismo para todas las que se apagan, y repetido opción por
   * opción se convierte en un muro de texto naranja. Lo dice `stepNotice` una
   * sola vez, debajo de la pregunta.
   */
  | { kind: 'no-alcanza' }
  /** El plazo del trabajo no cabe en ese cuándo. */
  | { kind: 'no-da-tiempo'; motivo: string };

/** Lo que no se puede marcar. Una sola definición para la lógica y la interfaz. */
export const estaBloqueada = (state: OptionState): boolean =>
  state.kind === 'bloqueada' || state.kind === 'no-alcanza' || state.kind === 'no-da-tiempo';

const restar = (a: Money, b: Money): Money => ({ min: a.min - b.min, max: a.max - b.max });

/** El arranque de la auditoría: lo que se anuncia como «desde» en el paso 1. */
const minTramo = () => Math.min(...revisionTramos.map((t) => t.price));

function capabilityState(cap: string, answers: Answers): OptionState | null {
  const rule = CAPABILITIES[cap];
  const opt = optionOf(CAPABILITY_STEP, cap);
  if (!rule || !opt) return null;

  if (rule.includedFrom && rank(basePlanSlug(answers)) >= rank(rule.includedFrom)) {
    return { kind: 'bloqueada' };
  }

  // El plan que habría sin ESTA capacidad: lo que de verdad mide su aporte.
  const sinEsta = resolverPlan(answers, { excepto: cap }).slug;

  if (rule.includedFrom && rank(sinEsta) >= rank(rule.includedFrom)) return { kind: 'gratis' };

  if (opt.requiresPlan && rank(opt.requiresPlan) > rank(sinEsta)) {
    const destino = planBySlug(opt.requiresPlan);
    return {
      kind: 'sube-plan',
      delta: restar(parsePrice(destino.price), parsePrice(planBySlug(sinEsta).price)),
      to: destino,
    };
  }

  if (rule.moduleName) {
    const mod = modules.find((m) => m.name === rule.moduleName);
    if (mod) return { kind: 'modulo', delta: parsePrice(mod.price) };
  }
  // Un producto con precio cerrado se comporta igual que un módulo de cara a la
  // etiqueta: se suma tal cual y no depende del plan. No hace falta un estado
  // nuevo, y añadirlo obligaría a tocar la interfaz para no enseñar nada
  // distinto.
  if (rule.product) return { kind: 'modulo', delta: parsePrice(rule.product.price) };
  if (rule.servicio) {
    return {
      kind: 'servicio',
      delta: parsePrice(rule.servicio.setupPrice),
      mensual: parsePrice(rule.servicio.monthlyPrice),
    };
  }
  return null;
}

/**
 * El estado de CUALQUIER opción del cotizador, sea del paso que sea.
 *
 * Antes solo las capacidades sabían lo que costaban en su contexto; los otros
 * pasos enseñaban un precio fijo escrito en el render y ahí se quedaba. Por eso
 * «Una sola página · Desde $295» seguía diciendo $295 después de elegir «Vender
 * en línea», que la deja en $1,200. Un solo sitio decide, para los cuatro
 * pasos, qué cuesta cada opción y si se puede marcar.
 */
export function optionState(stepId: string, value: string, answers: Answers): OptionState | null {
  const opt = optionOf(stepId, value);
  if (!opt) return null;

  if (stepId === CAPABILITY_STEP) return capabilityState(value, answers);

  if (stepId === 'objetivo') {
    if (opt.rama === 'auditoria') return { kind: 'desde', precio: dinero(minTramo()) };
    return opt.requiresPlan
      ? { kind: 'desde', precio: parsePrice(planBySlug(opt.requiresPlan).price) }
      : null;
  }

  if (stepId === 'alcance') {
    const piso = pisoDelObjetivo(answers);
    if (opt.requiresPlan && rank(opt.requiresPlan) < rank(piso.slug)) {
      return { kind: 'no-alcanza' };
    }
    return opt.requiresPlan
      ? { kind: 'desde', precio: parsePrice(planBySlug(opt.requiresPlan).price) }
      : null;
  }

  if (stepId === 'sitio') {
    const tramo = revisionTramos.find((t) => t.slug === value);
    return tramo ? { kind: 'fijo', precio: dinero(tramo.price) } : null;
  }

  if (stepId === 'refuerzos') {
    if (value === 'diagnostico') return { kind: 'modulo', delta: parsePrice(diagnostico.price) };
    const plan = value === 'blindada' ? blindada : protegida;
    return { kind: 'mensual', mensual: parsePrice(plan.price) };
  }

  if (stepId === 'urgencia') {
    const plazo = plazoDe(answers);
    const tope = TOPE_URGENCIA[value];
    if (!plazo || tope === undefined) return null;
    const dias = plazoDias(plazo);
    if (dias.max > tope) {
      // El plazo ya lo dice el aviso de arriba: repetirlo aquí sería contarlo
      // dos veces en tres centímetros.
      return { kind: 'no-da-tiempo', motivo: 'No sale antes de esa fecha.' };
    }
    return null;
  }

  return null;
}

/**
 * Lo que ve el cliente en la etiqueta de una opción.
 *
 * Son campos separados y no una cadena porque hay dos totales: `unico` es lo
 * que la opción mueve en el total de una vez y `mensual` lo que mueve en el de
 * cada mes. Pegados en la misma frase se leerían como una suma —«+$150 y $60»
 * invita a sumar 210— y además el arnés de `medir:cotizador` no podría
 * comprobar por separado que cada cifra mueve su total exactamente lo que
 * anuncia, que es la única comprobación que impide que una etiqueta mienta.
 *
 * `motivo` no es un precio: es la frase que explica por qué esa opción está
 * apagada. Va aparte para que no se pueda colar donde se leen cifras.
 */
export interface PriceLabel {
  unico: string;
  /** Solo cuando la opción deja una mensualidad detrás. */
  mensual?: string;
  /** Solo cuando la opción está bloqueada. */
  motivo?: string;
}

/** El texto que ve el cliente para cada estado. */
export function optionLabel(state: OptionState): PriceLabel {
  switch (state.kind) {
    case 'bloqueada':
      return { unico: 'Ya incluido' };
    case 'gratis':
      return { unico: 'Incluido' };
    case 'modulo':
      return { unico: `+${formatMoney(state.delta)}` };
    case 'servicio':
      return { unico: `+${formatMoney(state.delta)}`, mensual: `y ${formatMensual(state.mensual)}` };
    // Sin parte de una vez: la etiqueta se queda vacía en vez de escribir «+$0».
    // Un cero es una cifra, y una cifra en pantalla se lee como un concepto que
    // existe.
    case 'mensual':
      return { unico: '', mensual: `+${formatMensual(state.mensual)}` };
    case 'sube-plan':
      return { unico: `+${formatMoney(state.delta)} · pasa a ${planCorto(state.to)}` };
    case 'desde':
      return { unico: `Desde ${formatMoney(state.precio)}` };
    case 'fijo':
      return { unico: formatMoney(state.precio) };
    case 'no-alcanza':
      return { unico: 'No alcanza' };
    case 'no-da-tiempo':
      return { unico: 'No da tiempo', motivo: state.motivo };
  }
}

/**
 * Cada opción enseña lo que cuesta ANTES de marcarla.
 *
 * Sin esto el cotizador se comporta como un carrito sin precios: marcar sale
 * gratis, el entusiasmo no encuentra freno y el total aparece de golpe al
 * final. Una cifra de cuatro dígitos sin aviso previo no se lee como
 * presupuesto, se lee como sorpresa — y la sorpresa mata la venta.
 */
/**
 * La línea que va debajo del enunciado de un paso, y que no es de ninguna
 * opción en concreto.
 *
 * Existe porque hay cosas que valen para el paso entero: por qué se han apagado
 * la mitad de los tamaños (es siempre el mismo motivo, y escrito tres veces se
 * lee como un error) y en qué fecha del calendario cae el plazo contra el que
 * se está eligiendo la urgencia.
 *
 * `hoy` entra por parámetro por lo mismo que en `computeQuote`: una fecha
 * calculada en el build se queda congelada en el HTML.
 */
export function stepNotice(stepId: string, answers: Answers, hoy: Date): string {
  if (stepId === 'alcance') {
    const piso = pisoDelObjetivo(answers);
    if (rank(piso.slug) === 0) return '';
    return `«${piso.label}» necesita al menos ${planCorto(planBySlug(piso.slug))}: lo que se queda por debajo sale apagado.`;
  }
  if (stepId === 'urgencia') {
    const plazo = plazoDe(answers);
    if (!plazo) return '';
    const fecha = fechaDeEntrega(plazo, hoy);
    return fecha ? `${plazo}. Si arrancamos hoy, ${fecha}.` : plazo;
  }
  return '';
}

export function optionPriceLabel(
  stepId: string,
  value: string,
  answers: Answers = {}
): PriceLabel | null {
  const state = optionState(stepId, value, answers);
  return state ? optionLabel(state) : null;
}

/* ------------------------------------------------------------------ *
 * Cálculo
 * ------------------------------------------------------------------ */

export interface QuoteLine {
  label: string;
  /** null = viene incluido en el plan. */
  price: Money | null;
  note?: string;
  /**
   * Cada cuánto se paga esta línea. Sin este campo, una línea mensual acabaría
   * sumada al total de una vez y el cotizador anunciaría como precio de tu
   * sitio una cifra que incluye un mes de vigilancia.
   */
  periodo?: 'unico' | 'mes';
}

export interface QuoteResult {
  rama: Rama;
  /** El titular del resultado: el plan, o el servicio si no hay plan. */
  titulo: string;
  /** Solo en la rama web. */
  plan?: Plan;
  /** Por qué se recomienda eso y no otra cosa. */
  reason: string;
  lines: QuoteLine[];
  /** Lo que se paga de una vez. */
  total: Money;
  /** Lo que se paga cada mes. `{min:0,max:0}` cuando no hay nada mensual. */
  mensual: Money;
  /** El plazo tal y como lo publica el producto: 'Entrega 8–12 días'. */
  plazo: string;
  /** Ese mismo plazo en fechas: 'del 14 al 18 de agosto'. */
  fecha: string;
  /** Lo que el plazo NO cubre todavía. */
  plazoNota?: string;
  urgencia: string;
}

function sumar(lines: QuoteLine[], periodo: 'unico' | 'mes'): Money {
  return lines.reduce<Money>(
    (acc, l) =>
      l.price && (l.periodo ?? 'unico') === periodo
        ? { min: acc.min + l.price.min, max: acc.max + l.price.max }
        : acc,
    { min: 0, max: 0 }
  );
}

const urgenciaLabel = (answers: Answers) =>
  optionOf('urgencia', answers.urgencia?.[0] ?? '')?.label ?? '';

/**
 * La cotización de un sitio web: plan, capacidades y plazo.
 */
function computeWeb(answers: Answers, hoy: Date): QuoteResult | null {
  const objetivo = answers.objetivo?.[0];
  const alcance = answers.alcance?.[0];
  if (!objetivo || !alcance) return null;

  const capacidades = answers[CAPABILITY_STEP] ?? [];

  const { slug, driver } = resolverPlan(answers);
  const plan = planBySlug(slug);
  const lines: QuoteLine[] = [
    { label: plan.name, price: parsePrice(plan.price), note: plan.delivery },
  ];

  for (const cap of capacidades) {
    const rule = CAPABILITIES[cap];
    const option = optionOf(CAPABILITY_STEP, cap);
    if (!rule || !option) continue;

    if (rule.includedFrom && rank(slug) >= rank(rule.includedFrom)) {
      lines.push({ label: option.label, price: null, note: `Incluido en ${plan.name}` });
      continue;
    }
    if (rule.moduleName) {
      const mod = modules.find((m) => m.name === rule.moduleName);
      if (mod) lines.push({ label: option.label, price: parsePrice(mod.price), note: mod.stack });
      continue;
    }
    if (rule.product) {
      lines.push({
        label: `${option.label} (${rule.product.name})`,
        price: parsePrice(rule.product.price),
        note: rule.product.note,
      });
      continue;
    }
    /*
     * Dos líneas para una sola casilla. Es la única capacidad que lo hace, y es
     * lo honesto: quien marca «Que no te lo hackeen» está contratando una
     * auditoría que se paga y se acaba, y una vigilancia que se paga mientras la
     * quiera. Una sola línea tendría que callar una de las dos cosas.
     */
    if (rule.servicio) {
      lines.push({
        label: `${option.label} (${rule.servicio.setupName})`,
        price: parsePrice(rule.servicio.setupPrice),
        note: rule.servicio.setupNote,
      });
      lines.push({
        label: rule.servicio.monthlyName,
        price: parsePrice(rule.servicio.monthlyPrice),
        note: rule.servicio.monthlyNote,
        periodo: 'mes',
      });
    }
  }

  const extras = lines.length - 1;

  return {
    rama: 'web',
    titulo: plan.name,
    plan,
    reason: driver
      ? `Lo pide "${driver}". Es el plan más pequeño que lo cubre.`
      : 'Es el plan más pequeño que cubre lo que marcaste.',
    lines,
    total: sumar(lines, 'unico'),
    mensual: sumar(lines, 'mes'),
    plazo: plan.delivery,
    fecha: fechaDeEntrega(plan.delivery, hoy),
    plazoNota: extras > 0 ? 'Más el plazo de cada capacidad, que va en la propuesta.' : undefined,
    urgencia: urgenciaLabel(answers),
  };
}

/**
 * La cotización de una auditoría sobre un sitio que ya existe.
 *
 * No hay plan ni módulos: hay un trabajo que se paga una vez y, si se quiere,
 * una protección que se paga cada mes. Los dos totales del cotizador ya sabían
 * separar esas dos cosas, así que esta rama no necesita ninguna cifra nueva —
 * solo componer las que `seguridad.ts` ya publica.
 */
function computeAuditoria(answers: Answers, hoy: Date): QuoteResult | null {
  const tramo = revisionTramos.find((t) => t.slug === answers.sitio?.[0]);
  if (!tramo) return null;

  const lines: QuoteLine[] = [
    { label: revision.name, price: dinero(tramo.price), note: `${tramo.label} · ${revision.kicker}` },
  ];

  const refuerzos = answers.refuerzos ?? [];
  // Blindada primero: si por lo que sea llegaran las dos marcadas, se cotiza la
  // que ya incluye a la otra y no las dos, que sería cobrar dos veces lo mismo.
  const mensual = refuerzos.includes('blindada')
    ? blindada
    : refuerzos.includes('protegida')
      ? protegida
      : null;
  if (mensual) {
    lines.push({
      label: mensual.name,
      price: parsePrice(mensual.price),
      note: 'Al mes, mientras lo quieras. Sin permanencia.',
      periodo: 'mes',
    });
  }
  if (refuerzos.includes('diagnostico')) {
    lines.push({
      label: diagnostico.name,
      price: parsePrice(diagnostico.price),
      note: `Pago único por adelantado · ${diagnostico.entrega}`,
    });
  }

  return {
    rama: 'auditoria',
    titulo: revision.name,
    reason:
      'Es el punto de partida y no se salta: proteger sin haber mirado cómo está montado es proteger a ciegas.',
    lines,
    total: sumar(lines, 'unico'),
    mensual: sumar(lines, 'mes'),
    plazo: revisionEntrega,
    fecha: fechaDeEntrega(revisionEntrega, hoy),
    plazoNota: mensual ? `${mensual.name} arranca en cuanto se entrega el informe.` : undefined,
    urgencia: urgenciaLabel(answers),
  };
}

/**
 * `hoy` entra por parámetro y no se lee dentro: es lo que deja calcular fechas
 * sin que el render de Astro pueda congelar una en el HTML.
 */
export function computeQuote(answers: Answers, hoy: Date = new Date()): QuoteResult | null {
  return ramaDe(answers) === 'auditoria'
    ? computeAuditoria(answers, hoy)
    : computeWeb(answers, hoy);
}
