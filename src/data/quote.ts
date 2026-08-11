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
 */
import { plans, type Plan } from './plans';
import { modules } from './modules';
import { ebot, ebotCostos } from './ebot';
import { seguridadCotizador } from './seguridad';

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

/* ------------------------------------------------------------------ *
 * Pasos
 * ------------------------------------------------------------------ */

export interface QuoteOption {
  value: string;
  label: string;
  hint: string;
  /** Plan mínimo que exige esta respuesta. */
  requiresPlan?: PlanSlug;
}

export interface QuoteStep {
  id: string;
  /** La pregunta, en segunda persona. */
  question: string;
  help: string;
  multiple: boolean;
  options: QuoteOption[];
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
    ],
  },
  {
    id: 'alcance',
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

export type Answers = Record<string, string[]>;

/** El paso donde se marcan capacidades. Lo demás fija el plan. */
const CAPABILITY_STEP = 'capacidades';

const planBySlug = (slug: PlanSlug) => plans.find((p) => p.slug === slug)!;

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

/* ------------------------------------------------------------------ *
 * Estado de cada capacidad
 * ------------------------------------------------------------------ */

/**
 * Las cuatro respuestas posibles a la única pregunta que le importa a quien
 * está marcando: ¿qué me cuesta a mí esto, ahora mismo?
 */
export type CapabilityState =
  /** El plan base ya la trae. Marcarla no decide nada: se bloquea. */
  | { kind: 'bloqueada' }
  /** Sale gratis por otra capacidad marcada, que sí se puede desmarcar. */
  | { kind: 'gratis' }
  /** Se cobra aparte. */
  | { kind: 'modulo'; delta: Money }
  /** Se cobra aparte, y además deja una mensualidad detrás. */
  | { kind: 'servicio'; delta: Money; mensual: Money }
  /** Marcarla cambia de plan: el precio es la diferencia, no el del plan nuevo. */
  | { kind: 'sube-plan'; delta: Money; to: Plan };

const restar = (a: Money, b: Money): Money => ({ min: a.min - b.min, max: a.max - b.max });

export function capabilityState(cap: string, answers: Answers): CapabilityState | null {
  const rule = CAPABILITIES[cap];
  const opt = steps.find((s) => s.id === CAPABILITY_STEP)?.options.find((o) => o.value === cap);
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
 * Lo que ve el cliente en la etiqueta de una opción.
 *
 * Son dos campos y no una cadena porque hay dos totales: `unico` es lo que la
 * opción mueve en el total de una vez y `mensual` lo que mueve en el de cada
 * mes. Pegados en la misma frase se leerían como una suma —«+$150 y $60» invita
 * a sumar 210— y además el arnés de `medir:cotizador` no podría comprobar por
 * separado que cada cifra mueve su total exactamente lo que anuncia, que es la
 * única comprobación que impide que una etiqueta mienta.
 */
export interface PriceLabel {
  unico: string;
  /** Solo cuando la opción deja una mensualidad detrás. */
  mensual?: string;
}

/** El texto que ve el cliente para cada estado. */
export function capabilityLabel(state: CapabilityState): PriceLabel {
  switch (state.kind) {
    case 'bloqueada':
      return { unico: 'Ya incluido' };
    case 'gratis':
      return { unico: 'Incluido' };
    case 'modulo':
      return { unico: `+${formatMoney(state.delta)}` };
    case 'servicio':
      return { unico: `+${formatMoney(state.delta)}`, mensual: `y ${formatMensual(state.mensual)}` };
    case 'sube-plan':
      return { unico: `+${formatMoney(state.delta)} · pasa a ${state.to.name.replace('PanaClaw ', '')}` };
  }
}

/* ------------------------------------------------------------------ *
 * Etiquetas de precio para las opciones
 * ------------------------------------------------------------------ */

/**
 * Cada opción enseña lo que cuesta ANTES de marcarla.
 *
 * Sin esto el cotizador se comporta como un carrito sin precios: marcar sale
 * gratis, el entusiasmo no encuentra freno y el total aparece de golpe al
 * final. Una cifra de cuatro dígitos sin aviso previo no se lee como
 * presupuesto, se lee como sorpresa — y la sorpresa mata la venta.
 *
 * Las capacidades pasan por `capabilityState`, así que la etiqueta depende de
 * lo ya contestado: «Cobrar en línea» decía «Incluido en Commerce» —que se lee
 * como gratis— cuando desde Corporate son 350 dólares más.
 */
export function optionPriceLabel(
  stepId: string,
  value: string,
  answers: Answers = {}
): PriceLabel | null {
  if (stepId === 'urgencia') return null;

  const opt = steps.find((s) => s.id === stepId)?.options.find((o) => o.value === value);
  if (!opt) return null;

  if (stepId === CAPABILITY_STEP) {
    const state = capabilityState(value, answers);
    return state ? capabilityLabel(state) : null;
  }

  // Pasos que fijan el plan: enseñamos desde cuánto arranca esa elección
  if (!opt.requiresPlan) return null;
  const plan = plans.find((p) => p.slug === opt.requiresPlan);
  return plan ? { unico: `Desde ${plan.price}` } : null;
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
  plan: Plan;
  /** Por qué se recomienda ese plan y no otro. */
  reason: string;
  lines: QuoteLine[];
  /** Lo que se paga de una vez. */
  total: Money;
  /** Lo que se paga cada mes. `{min:0,max:0}` cuando no hay nada mensual. */
  mensual: Money;
  delivery: string;
  urgencia: string;
  /** Solo cuando pidió "Ya" y el plan tarda más de una semana. */
  urgenciaAviso?: string;
}

/**
 * Días que anuncia un plazo escrito ("Entrega 15–20 días" → 20, "Entrega 72 h"
 * → 3). Se lee del propio texto para que cambiar un plazo en `plans.ts` no
 * obligue a tocar nada más.
 */
function diasDePlazo(delivery: string): number {
  const nums = delivery.match(/\d+/g)?.map(Number) ?? [];
  if (!nums.length) return 0;
  const mayor = Math.max(...nums);
  return /\bh\b|hora/i.test(delivery) ? mayor / 24 : mayor;
}

export function computeQuote(answers: Answers): QuoteResult | null {
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
    const option = steps
      .find((s) => s.id === CAPABILITY_STEP)!
      .options.find((o) => o.value === cap);
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
     * revisión que se paga y se acaba, y una vigilancia que se paga mientras la
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

  const sumar = (periodo: 'unico' | 'mes') =>
    lines.reduce<Money>(
      (acc, l) =>
        l.price && (l.periodo ?? 'unico') === periodo
          ? { min: acc.min + l.price.min, max: acc.max + l.price.max }
          : acc,
      { min: 0, max: 0 }
    );

  const total = sumar('unico');
  const mensual = sumar('mes');

  const extras = lines.length - 1;
  const reason = driver
    ? `Lo pide "${driver}". Es el plan más pequeño que lo cubre.`
    : 'Es el plan más pequeño que cubre lo que marcaste.';

  const urgenciaLabel =
    steps.find((s) => s.id === 'urgencia')!.options.find((o) => o.value === answers.urgencia?.[0])
      ?.label ?? '';

  /*
   * El paso de urgencia dice que no cambia el precio —y es cierto— pero
   * tampoco cambiaba nada visible: se podía pedir "esta semana" y recibir un
   * plazo de 15 a 20 días sin que nadie lo mencionara. Esto solo constata la
   * tensión; prometer prioridad es una decisión comercial, no del cotizador.
   */
  const urgenciaAviso =
    answers.urgencia?.[0] === 'ya' && diasDePlazo(plan.delivery) > 7
      ? `Marcaste "Ya", y este plan va en ${plan.delivery.replace(/^Entrega /, '')}.`
      : undefined;

  return {
    plan,
    reason,
    lines,
    total,
    mensual,
    delivery: extras > 0 ? `${plan.delivery}, más el plazo de cada capacidad` : plan.delivery,
    urgencia: urgenciaLabel,
    urgenciaAviso,
  };
}
