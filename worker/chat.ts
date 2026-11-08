import { retrieve, invalidPrices, buildSystem, trimReply, type Kb, type KbFact } from './retrieval.ts';

/**
 * Endpoint del chat de PanaClaw.
 *
 * PREMISA DE DISEÑO: el modelo es la parte menos fiable del sistema, así que se
 * le da el trabajo más pequeño posible. No busca, no calcula y no recuerda: solo
 * redacta a partir de hechos que le ponemos delante ya resueltos.
 *
 * Reparto de responsabilidades:
 *
 *   Recuperación  → código (léxica sobre kb.json, determinista)
 *   Precios       → código (vienen literales del build)
 *   Aritmética    → NO se hace; se deriva al cotizador
 *   Verificación  → código (lista blanca de importes, post-respuesta)
 *   Redacción     → modelo
 *
 * Con este reparto un modelo pequeño (Groq/Llama, Haiku) responde igual de bien
 * que uno grande, porque lo único que aporta es el lenguaje. Y lo más importante:
 * la comprobación de precios NO depende de que el modelo obedezca el prompt.
 */

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/* ------------------------------------------------------------------ *
 * Base de conocimiento
 * ------------------------------------------------------------------ */

/**
 * Lo único que la lógica del chat necesita saber de dónde corre.
 *
 * El chat recibe una petición y contesta una respuesta. Lo que depende de dónde
 * corre son dos datos —la IP de quien escribe y cómo se llega a `kb.json`— y
 * viajan aquí, para que la lógica se pueda probar sin levantar un Worker.
 */
export interface Entorno {
  ip: string;
  /** Cómo obtener `kb.json`. Sin esto se descarga del propio origen. */
  cargarKb?: (origin: string) => Promise<Kb>;
}

async function descargarKb(origin: string): Promise<Kb> {
  const res = await fetch(`${origin}/kb.json`);
  if (!res.ok) throw new Error(`kb.json devolvió ${res.status}`);
  return (await res.json()) as Kb;
}

let kbCache: { kb: Kb; at: number } | null = null;
const KB_TTL_MS = 10 * 60 * 1000;

async function loadKb(origin: string, cargar?: Entorno['cargarKb']): Promise<Kb> {
  if (kbCache && Date.now() - kbCache.at < KB_TTL_MS) return kbCache.kb;
  // En un Worker el archivo se pide al binding de los estáticos, no a la red.
  const kb = cargar ? await cargar(origin) : await descargarKb(origin);
  kbCache = { kb, at: Date.now() };
  return kb;
}

/* ------------------------------------------------------------------ *
 * Proveedor
 * ------------------------------------------------------------------ */

interface Provider {
  name: string;
  url: string;
  headers: Record<string, string>;
  /** Modelos a probar dentro de este proveedor, en orden. Ver `listaModelos()`. */
  models: string[];
  body: (model: string, system: string, msgs: ChatMessage[]) => unknown;
  /**
   * Formas alternativas de la misma petición, de la preferida a la de último
   * recurso. Se pasa a la siguiente si el proveedor rechaza la anterior con un
   * 400 o si contesta sin texto. Se recuerda cuál funcionó (`variantePorModelo`),
   * para no repetir el descubrimiento en cada pregunta. Solo Meta las usa.
   */
  variantes?: ((model: string, system: string, msgs: ChatMessage[]) => unknown)[];
  extract: (json: any) => string;
}

/**
 * Los proveedores configurados, en orden de preferencia.
 *
 * Devuelve una lista y no uno solo porque antes elegía uno y se quedaba con él:
 * con las dos claves presentes y la de Anthropic inservible, el chat contestaba
 * "se me cayó la conexión" a todo el mundo mientras la clave de Groq, buena, no
 * se llegaba a mirar. Tener un repuesto que no entra a jugar no es tener
 * repuesto.
 *
 * Y las claves no siempre las pone uno: el entorno de la plataforma puede traer un
 * `ANTHROPIC_API_KEY` inyectado por la plataforma que no aparece en la lista de
 * variables del panel y que la API rechaza si se le manda directamente. Por eso
 * existe `CHAT_PROVIDER`: con 'groq' o 'anthropic' se fija cuál se usa y se
 * ignora todo lo demás, en vez de descubrir por los registros a quién se está
 * llamando de verdad.
 *
 * El orden por defecto se mantiene: Anthropic primero, que con el mismo
 * andamiaje da mejores respuestas. Lo que cambia es que si falla se prueba el
 * siguiente.
 */
const CONOCIDOS = ['anthropic', 'groq', 'meta'];

/**
 * Cómo se describe CHAT_PROVIDER en el registro.
 *
 * NUNCA se escribe el valor crudo. Parece una variable inofensiva —solo admite
 * dos palabras— pero en producción alguien pegó ahí su clave de Groq en vez de
 * la palabra 'groq', y el registro la publicó entera y en claro. Un campo donde
 * cabe un secreto acaba conteniendo un secreto: la regla es que ningún valor de
 * entorno se imprime, aunque "no sea un secreto".
 */
function describeChatProvider(): string {
  const crudo = process.env.CHAT_PROVIDER;
  if (!crudo) return '(ausente)';
  const limpio = crudo.trim().toLowerCase().replace(/^["']|["']$/g, '');
  if (CONOCIDOS.includes(limpio)) return limpio;
  return `(valor no reconocido, ${limpio.length} caracteres)`;
}

/**
 * Lee CHAT_PROVIDER tolerando lo que de verdad se pega en un panel: espacios
 * sobrantes, mayúsculas y comillas alrededor del valor.
 *
 * Y si aun así no es ninguno de los dos, se ignora y se avisa por el registro.
 * La primera versión de esto hacía lo contrario —un valor no reconocido dejaba
 * la lista de proveedores vacía— y el chat contestaba "todavía no está
 * conectado" teniendo las claves puestas. Una variable mal escrita puede costar
 * una respuesta peor; no puede apagar el chat entero sin decir nada.
 */
function proveedorForzado(): string | undefined {
  const crudo = process.env.CHAT_PROVIDER?.trim().toLowerCase().replace(/^["']|["']$/g, '');
  if (!crudo) return undefined;
  if (CONOCIDOS.includes(crudo)) return crudo;
  console.error(
    `[chat] CHAT_PROVIDER ${describeChatProvider()}: se esperaba ${CONOCIDOS.join(' o ')}. Se ignora.`
  );
  return undefined;
}

/**
 * Los modelos por defecto de cada proveedor, en orden de preferencia.
 *
 * Son listas y no un nombre suelto por lo que pasó el 16 de agosto de 2026:
 * Groq retiró `llama-3.3-70b-versatile`, que era el único nombre escrito aquí, y
 * desde ese día toda pregunta acabó en «se me cayó la conexión». La API devolvía
 * `400 model_decommissioned` en cada mensaje y la función no tenía a qué más
 * llamar, así que un modelo retirado —algo anunciado con dos meses de antelación
 * y que vuelve a pasar— apagó el chat entero hasta que alguien miró el registro.
 *
 * Un repuesto dentro del mismo proveedor cuesta una línea y convierte esa avería
 * en una respuesta con otro modelo. Los sustitutos son los que recomienda el
 * propio aviso de retirada de Groq.
 */
const MODELOS_ANTHROPIC = ['claude-haiku-4-5-20251001'];
const MODELOS_GROQ = ['openai/gpt-oss-120b', 'qwen/qwen3.6-27b'];

/**
 * Muse Spark, de Meta: el mismo cerebro que usan los CRM. Su API habla el
 * formato de mensajes de Anthropic, en `api.meta.ai/v1/messages`, con otra llave.
 *
 * El primero es el Contributor (el más barato). Lo es PORQUE Meta entrena con lo
 * que recibe: aquí, lo que escriban los visitantes en el chat. El segundo es
 * `muse-spark-1.3`, que no entrena, y entra solo si el primero deja de existir.
 * Para pasar al que no entrena basta `META_MODEL=muse-spark-1.3` en el Worker.
 */
const MODELOS_META = ['muse-spark-1.2-contributor', 'muse-spark-1.3'];

/**
 * Los sustitutos de Llama razonan antes de contestar, y ese razonamiento gasta
 * del mismo presupuesto de tokens que la respuesta: con los 260 de siempre lo
 * que llega al visitante sale cortado o vacío. El techo alto no encarece los
 * turnos que no lo usan —se paga lo generado, no lo reservado— y quien decide el
 * largo de lo que se publica sigue siendo `trimReply()`.
 */
const RAZONA = /gpt-oss|qwen/i;

/**
 * Arma la lista de modelos de un proveedor: primero lo que diga el entorno —que
 * puede traer varios separados por comas— y detrás los de por defecto.
 *
 * Los de por defecto van SIEMPRE al final, también con `GROQ_MODEL` puesto.
 * Fijar un modelo es decir cuál prefieres, no renunciar a tener chat el día que
 * lo retiren: si el fijado ya no existe se sigue por el siguiente, en vez de
 * derivar a WhatsApp a todo el mundo. Esto importa hoy más que mañana, porque
 * el nombre retirado puede estar escrito en el panel del Worker y no aquí.
 */
function listaModelos(...fuentes: (string | undefined)[]): string[] {
  const out: string[] = [];
  for (const fuente of fuentes) {
    for (const modelo of (fuente ?? '').split(',').map((m) => m.trim()).filter(Boolean)) {
      if (!out.includes(modelo)) out.push(modelo);
    }
  }
  return out;
}

/**
 * ¿El fallo es del modelo (retirado, mal escrito, no habilitado para la cuenta)
 * o del proveedor entero (clave inservible, cuota agotada)?
 *
 * Solo en el primer caso tiene sentido reintentar con otro nombre. Con un 401 o
 * un 429, probar cinco modelos son cinco esperas para quien está preguntando y
 * cinco líneas idénticas en el registro.
 */
function modeloInservible(status: number, detalle: string): boolean {
  if (status !== 400 && status !== 404) return false;
  return /model|decommission|deprecat|not_found|does not exist/i.test(detalle);
}

function pickProviders(): Provider[] {
  const forzado = proveedorForzado();
  const anthropic = forzado && forzado !== 'anthropic' ? undefined : process.env.ANTHROPIC_API_KEY;
  const groq = forzado && forzado !== 'groq' ? undefined : process.env.GROQ_API_KEY;
  // La llave de Meta es `META_API_KEY` (o `MODEL_API_KEY`, como la llama Meta).
  // NO es el token de Messenger/Instagram: ese jamás se manda a `api.meta.ai`.
  const meta =
    forzado && forzado !== 'meta'
      ? undefined
      : process.env.META_API_KEY?.trim() || process.env.MODEL_API_KEY?.trim() || undefined;

  /*
   * CHAT_MODEL solo manda cuando hay una sola clave configurada. Con dos, el
   * mismo nombre de modelo no existe en las dos APIs, así que aplicarlo a ambas
   * garantizaría romper la de repuesto justo cuando hace falta. Para fijar el
   * modelo de un proveedor concreto están ANTHROPIC_MODEL y GROQ_MODEL.
   */
  const generico = [anthropic, groq, meta].filter(Boolean).length === 1 ? process.env.CHAT_MODEL : undefined;

  const out: Provider[] = [];

  if (anthropic) {
    out.push({
      name: 'anthropic',
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'content-type': 'application/json',
        'x-api-key': anthropic,
        'anthropic-version': '2023-06-01',
      },
      models: listaModelos(process.env.ANTHROPIC_MODEL, generico, ...MODELOS_ANTHROPIC),
      body: (model, system, msgs) => ({
        model,
        max_tokens: 260,
        temperature: 0.3,
        system,
        messages: msgs,
      }),
      extract: (j) => j?.content?.[0]?.text ?? '',
    });
  }

  if (groq) {
    out.push({
      name: 'groq',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${groq}` },
      models: listaModelos(process.env.GROQ_MODEL, generico, ...MODELOS_GROQ),
      body: (model, system, msgs) => ({
        model,
        max_tokens: RAZONA.test(model) ? 900 : 260,
        temperature: 0.3,
        messages: [{ role: 'system', content: system }, ...msgs],
      }),
      extract: (j) => j?.choices?.[0]?.message?.content ?? '',
    });
  }

  if (meta) {
    out.push({
      name: 'meta',
      url: 'https://api.meta.ai/v1/messages',
      // Las dos credenciales, como en los CRM: Bearer y `x-api-key`. Con solo
      // `x-api-key` el chat llegaba a Meta y volvía rechazado.
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${meta}`,
        'x-api-key': meta,
        'anthropic-version': '2023-06-01',
      },
      models: listaModelos(process.env.META_MODEL, generico, ...MODELOS_META),
      // Muse Spark RAZONA antes de contestar, y por defecto sin tope: en el ensayo
      // gastó 1500 tokens enteros pensando, con cero de texto visible
      // (`parada=max_tokens; bloques=[redacted_thinking:0]`), y cada pregunta
      // tardaba 18 s para acabar en «se me cayó la conexión».
      //
      // `thinking: disabled` NO sirve: Meta lo traduce a «effort: none» y lo
      // rechaza («reasoning_effort 'none' is not supported ... Supported values:
      // [minimal, low, medium, high, xhigh, max]»). Hay que pedir poco
      // razonamiento, no ninguno. Como no está publicado en qué campo, se prueban
      // tres formas, de la más estándar a la de último recurso (sin orden y con
      // mucho cupo), y se recuerda la que funcione.
      //
      // El largo de lo que se publica lo sigue decidiendo `trimReply()`.
      body: (model, system, msgs) => ({
        model,
        max_tokens: 3000,
        temperature: 0.3,
        thinking: { type: 'enabled', budget_tokens: 1024 },
        system,
        messages: msgs,
      }),
      variantes: [
        (model, system, msgs) => ({
          model,
          max_tokens: 3000,
          temperature: 0.3,
          thinking: { type: 'enabled', budget_tokens: 1024 },
          system,
          messages: msgs,
        }),
        (model, system, msgs) => ({
          model,
          max_tokens: 3000,
          temperature: 0.3,
          output_config: { effort: 'low' },
          system,
          messages: msgs,
        }),
        (model, system, msgs) => ({
          model,
          max_tokens: 6000,
          temperature: 0.3,
          system,
          messages: msgs,
        }),
      ],
      extract: (j) =>
        (Array.isArray(j?.content) ? j.content : [])
          .filter((b: any) => b?.type === 'text')
          .map((b: any) => b.text)
          .join(''),
    });
  }

  return out;
}

/* ------------------------------------------------------------------ *
 * Quién puede llamar
 * ------------------------------------------------------------------ */

/**
 * Solo se atiende lo que venga del propio sitio.
 *
 * El endpoint gasta la clave de Anthropic en cada llamada, así que sin esto
 * cualquiera puede apuntar un script contra `/api/chat` y facturarnos sus
 * conversaciones. Se compara contra el origen de la petición —no contra una
 * lista fija— para que cualquier dirección del sitio (`workers.dev`, el dominio, una vista previa),
 * sigan funcionando sin mantener nada.
 *
 * Un `Origin` se puede falsificar con curl: esto no es autenticación, es quitar
 * de en medio el abuso barato. Lo que acota el gasto de verdad es el tope
 * diario de más abajo.
 */
function allowedOrigin(req: Request): boolean {
  const self = new URL(req.url).origin;
  const origin = req.headers.get('origin');
  if (origin) return origin === self;

  // Sin Origin (algunos navegadores en same-origin) miramos el Referer.
  const referer = req.headers.get('referer');
  if (referer) {
    try {
      return new URL(referer).origin === self;
    } catch {
      return false;
    }
  }
  return false;
}

/* ------------------------------------------------------------------ *
 * Límites de uso (best-effort, por instancia)
 * ------------------------------------------------------------------ */

/** Qué variante de la petición funcionó con cada modelo (por instancia). */
const variantePorModelo = new Map<string, number>();

const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 12;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const prev = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  prev.push(now);
  hits.set(ip, prev);
  if (hits.size > 500) hits.clear(); // no dejamos crecer el mapa sin límite
  return prev.length > MAX_PER_WINDOW;
}

/**
 * Techo de conversaciones al día para todo el sitio, no por visitante: es el
 * único límite que pone una cifra máxima a la factura del mes.
 *
 * Vive en memoria y cada instancia lleva su propia cuenta, así que Cloudflare
 * levantando varias lo multiplica. Es un tope aproximado a propósito: el
 * alternativo —un contador compartido— pide almacenamiento externo y una
 * llamada de red en cada mensaje, para proteger un endpoint que hoy responde
 * preguntas sobre precios. Si algún día el chat pesa más, se sube a una regla de
 * límite de tasa de Cloudflare o a un Durable Object.
 */
const MAX_PER_DAY = Number(process.env.CHAT_MAX_PER_DAY || 300);
let day = '';
let dayCount = 0;

function dailyCapReached(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== day) {
    day = today;
    dayCount = 0;
  }
  dayCount += 1;
  return dayCount > MAX_PER_DAY;
}


/* ------------------------------------------------------------------ *
 * A dónde llevar a quien pregunta
 * ------------------------------------------------------------------ */

export interface Accion {
  /** Lo que dice el botón. */
  t: string;
  /** Ruta del sitio, con ancla si hay una sección concreta. */
  href: string;
}

/**
 * De qué sección del sitio viene cada hecho.
 *
 * El chat no solo contesta: guía. Los hechos que el modelo usó para responder
 * dicen de qué se está hablando, así que de ahí salen los botones —«Ver los
 * planes», «Conocer eBot»— sin pedirle nada al modelo y sin que pueda inventar
 * un enlace. Las anclas son `id` reales de cada página (si una página cambia su
 * `id`, hay una prueba que lo detecta: `scripts/check-chat.mjs`).
 */
export function destinoDe(f: Pick<KbFact, 'id' | 'topic'>): Accion | null {
  const id = f.id;
  const faq = /^faq-(empezar|precio|proceso|despues)-/.exec(id);
  if (faq) return { t: 'Ver la ayuda', href: `/ayuda/#${faq[1]}` };
  if (id.startsWith('plan-') || id === 'planes-rango') return { t: 'Ver los planes', href: '/planes/#planes' };
  if (id.startsWith('modulo-') || id === 'capacidades-que-son') return { t: 'Ver las capacidades', href: '/planes/#modulos' };
  if (id === 'ebot-costos') return { t: 'Ver el precio de eBot', href: '/ebot/#precio' };
  if (id.startsWith('ebot-faq')) return { t: 'Preguntas sobre eBot', href: '/ebot/#preguntas' };
  if (id.startsWith('ebot')) return { t: 'Conocer eBot', href: '/ebot/' };
  if (id.startsWith('seguridad-faq')) return { t: 'Preguntas sobre Seguridad', href: '/seguridad/#preguntas' };
  if (id.startsWith('seguridad-vs-')) return { t: 'Comparar opciones', href: '/seguridad/#comparativa' };
  if (id.startsWith('seguridad')) return { t: 'Ver Seguridad', href: '/seguridad/' };
  if (id.startsWith('care')) return { t: 'Ver el mantenimiento', href: '/servicios/#care' };
  if (id === 'diagnostico') return { t: 'Ver el diagnóstico', href: '/servicios/#diagnostico' };
  if (id.startsWith('proceso') || id === 'plazos' || id === 'revisiones') return { t: 'Cómo trabajamos', href: '/proceso/' };
  if (id === 'proyectos' || id === 'prueba-social') return { t: 'Ver proyectos', href: '/proyectos/' };
  if (id === 'cotizador') return { t: 'Abrir el cotizador', href: '/cotizador/' };
  if (id === 'contacto') return { t: 'Hablar con nosotros', href: '/contacto/' };
  if (id.startsWith('pilar')) return { t: 'Ver los servicios', href: '/servicios/' };
  if (id === 'privacidad') return { t: 'Ver la privacidad', href: '/privacidad/' };
  if (id === 'wordpress' || id === 'propiedad' || id === 'pagos' || id === 'no-incluye') {
    return { t: 'Ver la ayuda', href: '/ayuda/' };
  }
  return null;
}

/**
 * El botón principal sale del hecho más relevante. Un segundo solo si el
 * siguiente es del MISMO tema y apunta a otro sitio (p. ej. eBot y el precio de
 * eBot). Mezclar temas distintos daba botones que no venían a cuento: una
 * pregunta por plazos terminaba ofreciendo «Conocer eBot».
 */
export function accionesDe(facts: Pick<KbFact, 'id' | 'topic'>[]): Accion[] {
  const [primero, segundo] = facts;
  const a = primero ? destinoDe(primero) : null;
  if (!a) return [];
  const b = segundo && segundo.topic === primero!.topic ? destinoDe(segundo) : null;
  return b && b.href !== a.href ? [a, b] : [a];
}

/* ------------------------------------------------------------------ *
 * Handler
 * ------------------------------------------------------------------ */

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

export async function atender(req: Request, entorno: Entorno): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  if (!allowedOrigin(req)) return json({ error: 'Origen no permitido' }, 403);

  if (rateLimited(entorno.ip)) {
    return json({ reply: 'Vas muy rápido. Espera un momento y vuelve a preguntar.' }, 429);
  }

  let messages: ChatMessage[];
  try {
    const body = (await req.json()) as { messages?: ChatMessage[] };
    messages = (body.messages ?? [])
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }))
      .slice(-6); // memoria corta a propósito: cada turno se re-recupera
  } catch {
    return json({ error: 'Cuerpo inválido' }, 400);
  }

  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUser?.content.trim()) return json({ error: 'Falta el mensaje' }, 400);

  const origin = new URL(req.url).origin;
  const proveedores = pickProviders();

  let kb: Kb;
  try {
    kb = await loadKb(origin, entorno.cargarKb);
  } catch {
    return json({
      reply: `Ahora mismo no puedo consultar los datos. Escríbenos por WhatsApp y te respondemos: ${
        process.env.FALLBACK_WHATSAPP || ''
      }`.trim(),
      degraded: true,
    });
  }

  // Sin clave configurada el chat no se cae: deriva a WhatsApp.
  if (proveedores.length === 0) {
    /*
     * Qué variables VE la función, que no es lo mismo que las que hay escritas
     * en el panel: pueden estar fuera del contexto de despliegue, sin marcar
     * para funciones, o no haberse redesplegado desde que se crearon. Se
     * registra solo la presencia, nunca el valor.
     */
    console.error(
      `[chat] ningún proveedor disponible. CHAT_PROVIDER ${describeChatProvider()}; ` +
        `ANTHROPIC_API_KEY ${process.env.ANTHROPIC_API_KEY ? 'presente' : 'ausente'}; ` +
        `GROQ_API_KEY ${process.env.GROQ_API_KEY ? 'presente' : 'ausente'}; ` +
        `META_API_KEY ${process.env.META_API_KEY || process.env.MODEL_API_KEY ? 'presente' : 'ausente'}`
    );
    return json({
      reply: `El asistente todavía no está conectado. Escríbenos por WhatsApp al ${kb.site.whatsapp} y te contestamos directo.`,
      degraded: true,
    });
  }

  // Techo del día alcanzado: se deriva a la persona, no se devuelve un error.
  if (dailyCapReached()) {
    return json({
      reply: `El asistente ya no atiende más consultas por hoy. Escríbenos por WhatsApp al ${kb.site.whatsapp} y te contestamos directo.`,
      degraded: true,
    });
  }

  const facts = retrieve(kb, lastUser.content);
  const system = buildSystem(kb, facts);

  let reply = '';
  let fallo = 'sin_proveedores';

  // Proveedor por proveedor y, dentro de cada uno, modelo por modelo. Se sale
  // con el primero que conteste; con una sola clave y un solo modelo el
  // comportamiento es idéntico al de antes.
  porProveedor: for (const provider of proveedores) {
    porModelo: for (const model of provider.models) {
      const variantes = provider.variantes ?? [provider.body];
      const clave = `${provider.name}:${model}`;
      const desde = Math.min(variantePorModelo.get(clave) ?? 0, variantes.length - 1);

      for (let v = desde; v < variantes.length; v++) {
        const ultima = v === variantes.length - 1;
        try {
          const res = await fetch(provider.url, {
            method: 'POST',
            headers: provider.headers,
            body: JSON.stringify(variantes[v](model, system, messages)),
            signal: AbortSignal.timeout(20_000),
          });

          if (!res.ok) {
            /*
             * El motivo real vive aquí y en ningún otro sitio: una clave mal pegada,
             * una cuota agotada y un modelo retirado dan los tres el mismo "se me cayó
             * la conexión" en pantalla. Sin este log había que adivinar. Va al registro
             * de la función, que solo ve quien administra el sitio; al visitante nunca
             * se le enseña el error del proveedor.
             *
             * El nombre del modelo va en la línea porque es la mitad del diagnóstico:
             * distingue "la clave no sirve" de "ese modelo ya no existe", que es
             * justo lo que costó una semana de chat mudo en agosto de 2026.
             */
            const detalle = (await res.text().catch(() => '')).slice(0, 500);
            console.error(
              `[chat] ${provider.name} (${model}) variante ${v} devolvió ${res.status}: ${detalle}`
            );
            fallo = `${provider.name}_http_${res.status}`;
            // Un 400 puede ser la forma de la petición: se prueba la siguiente.
            if (res.status === 400 && !ultima) continue;
            // Si el problema es el modelo, el siguiente de la lista puede servir.
            // Si es del proveedor, cambiarle el nombre al modelo no arregla nada.
            if (modeloInservible(res.status, detalle)) continue porModelo;
            continue porProveedor;
          }

          const cuerpo = await res.json();
          reply = trimReply(provider.extract(cuerpo).trim());
          if (reply) {
            variantePorModelo.set(clave, v);
            break porProveedor;
          }

          /*
           * Qué forma tenía la respuesta, sin su texto ni su llave: por qué paró
           * (`stop_reason` / `finish_reason`), qué bloques trajo y cuántos tokens
           * gastó. Con eso se distingue «el modelo gastó todo en razonar» de «la
           * respuesta viene con otra forma».
           */
          const bloques = Array.isArray(cuerpo?.content)
            ? cuerpo.content
                .map((b: any) => `${b?.type ?? '?'}:${String(b?.text ?? b?.thinking ?? '').length}`)
                .join(',')
            : typeof cuerpo?.choices !== 'undefined'
              ? 'choices'
              : `claves=${Object.keys(cuerpo ?? {}).join(',')}`;
          console.error(
            `[chat] ${provider.name} (${model}) variante ${v} respondió vacío; parada=${
              cuerpo?.stop_reason ?? cuerpo?.choices?.[0]?.finish_reason ?? '?'
            }; bloques=[${bloques}]; tokens_salida=${
              cuerpo?.usage?.output_tokens ?? cuerpo?.usage?.completion_tokens ?? '?'
            }`
          );
          fallo = `${provider.name}_vacio`;
          // Vacío con una variante: la siguiente puede razonar menos.
          if (!ultima) continue;
        } catch (err) {
          // Un corte de red o un tiempo agotado son del proveedor, no del modelo:
          // reintentar aquí solo suma otros 20 segundos de espera al visitante.
          console.error(`[chat] fallo llamando a ${provider.name} (${model}):`, err);
          fallo = `${provider.name}_network`;
          continue porProveedor;
        }
      }
    }
  }

  if (!reply) {
    return json({
      reply: `Se me cayó la conexión. Escríbenos por WhatsApp al ${kb.site.whatsapp} y te respondemos al momento.`,
      degraded: true,
      // Solo el código, nunca el cuerpo del error: sirve para diagnosticar desde
      // las herramientas del navegador sin publicar nada del proveedor.
      code: fallo,
    });
  }

  // Barandilla: si aparece un importe que no salió del build, no se publica.
  const bad = invalidPrices(reply, kb.prices);
  if (bad.length) {
    return json({
      reply:
        `Prefiero no darte una cifra de memoria. Los precios están en la página de planes, ` +
        `y el cotizador calcula el tuyo exacto en cuatro preguntas.`,
      blocked: bad,
      acciones: [
        { t: 'Abrir el cotizador', href: '/cotizador/' },
        { t: 'Ver los planes', href: '/planes/#planes' },
      ],
    });
  }

  return json({ reply, sources: facts.map((f) => f.id), acciones: accionesDe(facts) });
}
