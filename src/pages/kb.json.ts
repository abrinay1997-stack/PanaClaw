import type { APIRoute } from 'astro';

import { site, contact, formDestination } from '../data/site';
import { metaPixelId, ga4MeasurementId } from '../data/analytics';
import { plans, diagnostico } from '../data/plans';
import { modules } from '../data/modules';
import {
  evot,
  evotCanales,
  evotCapacidades,
  evotCostos,
  evotIncluye,
  evotNoIncluye,
  evotFaq,
} from '../data/evot';
import { carePlans, careNote } from '../data/care';
import { faqGroups } from '../data/faq';
import { services, procesoSteps } from '../data/services';
import { projects } from '../data/projects';

/**
 * Base de conocimiento del chatbot, generada en el build desde los MISMOS
 * archivos de datos que renderizan el sitio.
 *
 * Por qué generada y no escrita a mano: una base copiada a mano se desincroniza
 * el primer día que alguien cambia un precio. Aquí no puede pasar — si cambias
 * $850 en plans.ts, cambia en /planes, en el cotizador y en lo que responde el
 * bot, en el mismo build.
 *
 * Diseño pensado para modelos pequeños (Groq, Haiku). Tres decisiones:
 *
 *  1. Hechos ATÓMICOS y autocontenidos. Cada entrada se entiende sola, sin
 *     necesitar otra. Un modelo pequeño no tiene que reconstruir nada.
 *  2. Cada hecho trae sus propias `q` (formas en que la gente pregunta eso).
 *     La recuperación es léxica, así que las variantes las ponemos nosotros en
 *     vez de esperar que el modelo las infiera.
 *  3. `prices` es la lista blanca de cifras. La función la usa para BLOQUEAR
 *     cualquier importe que el modelo se invente. Es la única defensa que no
 *     depende de que el modelo se porte bien.
 */

export interface KbFact {
  id: string;
  topic: string;
  /** Formas naturales de preguntar por esto. Alimentan la recuperación. */
  q: string[];
  /** La respuesta, ya redactada. El modelo la parafrasea, no la deduce. */
  text: string;
}

/**
 * Qué herramientas de medición hay activas, derivado de `data/analytics.ts`.
 * Vive aquí y no dentro del hecho para que se lea de un vistazo qué gobierna la
 * respuesta sobre privacidad, que es la única del bot con consecuencias legales.
 */
const medicionNombres = [
  metaPixelId && 'el píxel de Meta',
  ga4MeasurementId && 'Google Analytics',
]
  .filter(Boolean)
  .join(' y ');
const medicionActiva = medicionNombres.length > 0;

export const GET: APIRoute = () => {
  const facts: KbFact[] = [];
  const add = (f: KbFact) => facts.push(f);

  /* ---------------- Planes ---------------- */

  /**
   * Vocabulario de intención por plan.
   *
   * La recuperación es léxica: solo encuentra lo que está escrito. Nadie
   * pregunta "cuánto cuesta PanaClaw Commerce", preguntan "quiero vender en
   * línea". Estas frases son el puente entre cómo habla la gente y cómo se
   * llaman los productos, y es aquí donde se arregla un fallo de recuperación
   * — no tocando el prompt ni cambiando de modelo.
   */
  const intencionPorPlan: Record<string, string[]> = {
    start: [
      'una sola pagina',
      'algo sencillo y rapido',
      'para un evento',
      'para una campaña',
      'lo mas barato',
      'presupuesto ajustado',
      'soy emprendedor',
    ],
    launch: [
      'landing page',
      'pagina de aterrizaje',
      'hago publicidad y necesito donde caer',
      'pauta en redes',
      'quiero que convierta',
      'una pagina a medida',
    ],
    corporate: [
      'sitio corporativo',
      'varias paginas',
      'quiero un blog',
      'poder editarlo yo mismo',
      'necesito seo',
      'pagina de empresa',
      'reemplazar mi wordpress',
    ],
    commerce: [
      'vender en linea',
      'tienda en linea',
      'ecommerce',
      'comercio electronico',
      'vender productos',
      'catalogo con carrito',
      'cobrar con tarjeta',
      'yappy',
      'quiero vender',
    ],
  };

  for (const p of plans) {
    add({
      id: `plan-${p.slug}`,
      topic: 'planes',
      q: [
        `cuanto cuesta ${p.name}`,
        `precio ${p.name}`,
        `que incluye ${p.name}`,
        `${p.slug}`,
        p.name,
        ...(intencionPorPlan[p.slug] ?? []),
      ],
      text:
        `${p.name} cuesta ${p.price}. ${p.delivery}. ${p.desc} ` +
        `Incluye: ${p.features.join('; ')}.`,
    });
  }

  add({
    id: 'planes-rango',
    topic: 'planes',
    q: [
      'cuanto cuestan los sitios',
      'que precios manejan',
      'cuanto vale una pagina web',
      'presupuesto',
      'tarifas',
      'es caro',
      'cual es el mas barato',
      // "¿Qué planes tienen?" es de las tres preguntas más frecuentes y no
      // recuperaba este hecho: ninguna de las frases de arriba lleva la palabra
      // "planes", así que ganaban preguntas frecuentes sueltas y la respuesta
      // salía sin una sola cifra. Justo el fallo que docs/chat.md dice arreglar
      // aquí y no en el prompt.
      'que planes tienen',
      'cuales son sus planes',
      'que planes manejan',
      'planes',
      'paquetes',
      'que ofrecen',
      'que opciones hay',
      'lista de planes',
    ],
    text:
      `Nuestros sitios van de ${plans.find((p) => p.slug === 'start')!.price} a ` +
      `${plans.find((p) => p.slug === 'commerce')!.price}: ` +
      plans.map((p) => `${p.name} ${p.price}`).join(', ') +
      `. Todos los precios son fijos y públicos. Para una cifra exacta según lo que necesitas, ` +
      `el cotizador la calcula en cuatro preguntas.`,
  });

  add({
    id: 'diagnostico',
    topic: 'planes',
    q: [
      'diagnostico',
      'revisar mi sitio actual',
      'auditoria de mi web',
      'que tan lento esta mi sitio',
      'algo mas barato para empezar',
    ],
    text: `${diagnostico.name} cuesta ${diagnostico.price}. ${diagnostico.desc}`,
  });

  /* ---------------- Capacidades ---------------- */
  for (const m of modules) {
    add({
      id: `modulo-${m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      topic: 'capacidades',
      q: [`cuanto cuesta ${m.name}`, `precio ${m.name}`, m.name, `quiero ${m.name}`],
      text: `"${m.name}" cuesta ${m.price}. ${m.stack} Se suma a cualquier plan.`,
    });
  }

  add({
    id: 'capacidades-que-son',
    topic: 'capacidades',
    q: [
      'que capacidades tienen',
      'hacen sistemas',
      'hacen aplicaciones a medida',
      'se puede agregar despues',
      'modulos',
    ],
    text:
      'Además de los planes, le enchufamos capacidades a lo que ya tengas, con precio cerrado y sin rehacer el sitio: ' +
      modules.map((m) => `${m.name} (${m.price})`).join(', ') +
      '. Puedes empezar con una y sumar el resto más adelante.',
  });

  /* ---------------- eVot ---------------- */

  /**
   * eVot es el único producto que no es una web, y por eso es el que más riesgo
   * de recuperación falsa tiene: casi nadie va a escribir su nombre. Preguntan
   * «¿tienen algo para contestar WhatsApp solo?». Sin estas frases de intención,
   * esa pregunta recupera el módulo "Respuestas automáticas con IA" —comparten
   * media frase— y el bot contesta $250–$900 por algo que cuesta $70.
   */
  const evotIntencion = [
    'evot',
    'que es evot',
    'bot',
    'chatbot',
    'tienen chatbot',
    'quiero un bot',
    'bot para whatsapp',
    'contestar whatsapp automatico',
    'responder mensajes solo',
    'atencion automatica',
    'atender clientes 24 horas',
    'contestar de noche',
    'no doy abasto con los mensajes',
    'se me acumulan los mensajes',
    'responder instagram automatico',
    'bot de telegram',
    'bot multicanal',
    'panel de mensajes',
    'bandeja unica',
    'juntar whatsapp instagram y messenger',
    'crm',
    'inteligencia artificial para mi negocio',
  ];

  add({
    id: 'evot-que-es',
    topic: 'evot',
    q: evotIntencion,
    text:
      `${evot.summary} ` +
      `Contesta por ${evotCanales.map((c) => c.name).join(', ')}, ` +
      `y además: ${evotCapacidades.map((c) => c.title.toLowerCase()).join('; ')}. ` +
      `Todo está en la página de ${evot.name}.`,
  });

  add({
    id: 'evot-costos',
    topic: 'evot',
    q: [
      `cuanto cuesta ${evot.name}`,
      `precio de ${evot.name}`,
      'cuanto cuesta el bot',
      'el bot tiene mensualidad',
      'hay que pagar todos los meses por el bot',
      'que mas pago aparte del bot',
      'cuanto cuesta la inteligencia artificial',
      'cloudflare',
      'llave de ia',
      'cuanto gasta el bot al mes',
    ],
    text:
      `La implementación de ${evot.name} cuesta ${evot.price} una sola vez y no lleva mensualidad nuestra. ` +
      `Aparte pagas por tu cuenta, y directo a esas empresas: ` +
      // Sin `toLowerCase()`: "Cloudflare" es un nombre propio y en minúscula el
      // modelo lo copiaba tal cual, escribiendo mal la única empresa a la que el
      // cliente le va a pasar la tarjeta.
      evotCostos.map((c) => `${c.concepto} — ${c.price}, ${c.aQuien}`).join('; ') +
      `. Son aproximados para un negocio normal, y el panel te muestra el gasto al día.`,
  });

  add({
    id: 'evot-incluye',
    topic: 'evot',
    q: [
      `que incluye ${evot.name}`,
      'que hacen ustedes con el bot',
      'que me entregan con el bot',
      'quien monta el bot',
      'cuanto tardan en montar el bot',
      'que no incluye el bot',
      'el bot necesita mi pagina web',
    ],
    text:
      `Por los ${evot.price} de ${evot.name}: ${evotIncluye.join('; ')}. ${evot.priceKicker.replace(' · ', '. ')}. ` +
      `No incluye: ${evotNoIncluye.join('; ')}.`,
  });

  add({
    id: 'evot-de-quien-es',
    topic: 'evot',
    q: [
      'de quien son las conversaciones del bot',
      'donde se guardan los mensajes del bot',
      'el bot es suyo o mio',
      'puedo quedarme con el bot',
      'ustedes ven mis conversaciones',
      'el bot dice que es un bot',
      'puedo apagar el bot',
    ],
    text:
      `${evot.name} corre en tu propia cuenta, con tu llave, así que las conversaciones son tuyas y no pasan por nosotros. ` +
      'Los mensajes se borran solos a los 90 días; los clientes y lo pendiente se quedan hasta que tú los borres. ' +
      'Si le preguntan si es un bot, lo admite, y puedes apagarlo entero desde el panel en un clic.',
  });

  // Las preguntas de la página de eVot entran una por una: cada una ya trae
  // redactada la respuesta que se lee en el sitio, así que el bot no tiene que
  // deducir nada — solo parafrasear lo que está publicado.
  for (const [i, item] of evotFaq.entries()) {
    add({ id: `evot-faq-${i}`, topic: 'evot', q: [item.q], text: item.a });
  }

  /* ---------------- Care ---------------- */
  for (const c of carePlans) {
    add({
      id: `care-${c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      topic: 'mantenimiento',
      q: [`${c.name}`, `cuanto cuesta ${c.name}`, 'mantenimiento mensual', 'soporte'],
      text: `${c.name} cuesta ${c.price}${c.suffix}. Incluye: ${c.features.join('; ')}.`,
    });
  }

  add({
    id: 'care-general',
    topic: 'mantenimiento',
    q: [
      'hay mantenimiento',
      'quien mantiene el sitio despues',
      'soporte mensual',
      'que pasa despues de la entrega',
      'permanencia',
    ],
    text:
      'PanaClaw Care es nuestro mantenimiento mensual: ' +
      carePlans.map((c) => `${c.name} ${c.price}${c.suffix}`).join(', ') +
      `. ${careNote} Sin plan Care activo no monitorizamos el sitio ni respondemos incidencias.`,
  });

  /* ---------------- Servicios y proceso ---------------- */
  for (const s of services) {
    add({
      id: `pilar-${s.idx}`,
      topic: 'servicios',
      q: [s.title, `por que ${s.title}`, 'que los diferencia', 'por que ustedes'],
      text: `${s.title}: ${s.desc}`,
    });
  }

  for (const step of procesoSteps) {
    add({
      id: `proceso-${step.num}`,
      topic: 'proceso',
      q: [step.title, 'como trabajan', 'como es el proceso', 'que necesito para empezar'],
      text: `${step.title}: ${step.desc}`,
    });
  }

  /* ---------------- Proyectos ---------------- */
  /**
   * "¿Tienen ejemplos?" es de las primeras preguntas de cualquiera que dude, y
   * hasta ahora el bot no tenía con qué responderla. Se genera desde el mismo
   * projects.ts que dibuja la página, así que un caso nuevo aparece en los dos
   * sitios a la vez.
   */
  add({
    id: 'proyectos',
    topic: 'proyectos',
    q: [
      'tienen ejemplos',
      'puedo ver trabajos',
      'portafolio',
      'portfolio',
      'que han hecho',
      'muestrame sitios que hayan hecho',
      'tienen casos',
      'trabajos anteriores',
      'referencias',
      'con quien han trabajado',
      'como se que saben hacerlo',
    ],
    text:
      'Sí. Tenemos sitios publicados y funcionando que puedes abrir ahora mismo: ' +
      projects.map((p) => `${p.name} (${p.domain})`).join(', ') +
      '. Están todos en la página de Proyectos, cada uno con enlace directo a su dominio ' +
      'para que compruebes tú mismo cómo carga.',
  });

  /**
   * Prueba social: lo que hay, dicho sin adornos.
   *
   * "¿Tienen testimonios?" recuperaba el módulo "Portal de clientes" —comparten
   * la palabra "clientes"— y esa clase de acierto falso es peor que no
   * encontrar nada: con un hecho plausible delante, el modelo responde en vez
   * de admitir que no lo sabe. Mientras no haya testimonios publicados, la
   * respuesta honesta es que no los hay y que en su lugar están los sitios
   * funcionando, que es una prueba más fuerte y comprobable en un clic.
   */
  add({
    id: 'prueba-social',
    topic: 'proyectos',
    q: [
      'tienen testimonios',
      'opiniones de clientes',
      'reseñas',
      'comentarios de clientes',
      'que dicen sus clientes',
      'hay reviews',
      'clientes satisfechos',
    ],
    text:
      'Todavía no publicamos testimonios escritos. Lo que sí puedes comprobar tú mismo son los sitios ' +
      'que ya están funcionando: ' +
      projects.map((p) => `${p.name} (${p.domain})`).join(', ') +
      '. Ábrelos y mira cómo cargan; nos parece mejor prueba que una cita en una página.',
  });

  /* ---------------- FAQ ---------------- */
  for (const group of faqGroups) {
    for (const [i, item] of group.items.entries()) {
      add({
        id: `faq-${group.id}-${i}`,
        topic: 'faq',
        q: [item.q],
        text: item.a,
      });
    }
  }

  /* ---------------- Negocio y contacto ---------------- */
  add({
    id: 'contacto',
    topic: 'contacto',
    q: [
      'como los contacto',
      'telefono',
      'whatsapp',
      'horario',
      'donde estan',
      'atienden fuera de panama',
      'quiero hablar con alguien',
      // "¿Tienen oficina?" no recuperaba nada: este hecho ya la respondía —se
      // opera en remoto— pero ninguna de sus frases llevaba esa palabra. La
      // recuperación es léxica: solo encuentra lo que está escrito.
      'tienen oficina',
      'oficina fisica',
      'donde queda su local',
      'podemos vernos en persona',
      'reuniones presenciales',
    ],
    text:
      // Deliberadamente sin el número: la respuesta del chat lleva al chat,
      // no a memorizar un teléfono. El widget además ofrece el botón directo.
      `Hablas directo con quien programa tu sitio, por WhatsApp, ` +
      `en horario ${contact.horario} (${contact.timezone}). ` +
      `Operamos desde ${site.location}, 100 % en remoto para todo el país.`,
  });

  add({
    id: 'cotizador',
    topic: 'contacto',
    q: [
      'como cotizo',
      'quiero un presupuesto',
      'cuanto me saldria lo mio',
      'necesito una cotizacion',
      'cotizador',
    ],
    text:
      'Nuestro cotizador te da un precio en cuatro preguntas, sin que dejes tus datos primero: ' +
      'qué necesitas, de qué tamaño, qué tiene que hacer y para cuándo. Al final muestra el desglose y el total.',
  });

  add({
    id: 'wordpress',
    topic: 'servicios',
    q: [
      'usan wordpress',
      'por que no wordpress',
      'es mejor que wordpress',
      'me ofrecen uno de 199',
      'por que tan caro comparado',
      'que es jamstack',
    ],
    text:
      'No usamos WordPress. Construimos de otra forma: sin complementos que actualizar y sin panel público ' +
      'por el que puedan entrar. Un WordPress barato suele abrir en cinco segundos y hay que mantenerlo cada ' +
      'semana; los nuestros abren en menos de uno y puedes dejarlos solos un año.',
  });

  add({
    id: 'propiedad',
    topic: 'proceso',
    q: [
      'de quien es el codigo',
      'me dan el codigo',
      'puedo irme con otra agencia',
      'quien es dueño del dominio',
      'me quedo atrapado',
    ],
    text:
      'El código es tuyo. Al pago final te transferimos el repositorio a tu cuenta de GitHub y el dominio queda ' +
      'a tu nombre. Si mañana quieres irte con otra agencia, te llevas todo.',
  });

  add({
    id: 'pagos',
    topic: 'proceso',
    q: [
      'como se paga',
      'formas de pago',
      'hay que pagar por adelantado',
      'se puede pagar en cuotas',
      'anticipo',
    ],
    text:
      'Cobramos el 50 % por adelantado para reservar tu cupo y arrancar, y el 50 % restante a la entrega, ' +
      'antes de publicar y de transferirte el repositorio. Los precios están en dólares. ' +
      `El ${diagnostico.name} se paga íntegro por adelantado.`,
  });

  add({
    id: 'revisiones',
    topic: 'proceso',
    q: [
      'cuantos cambios puedo pedir',
      'revisiones incluidas',
      'y si no me gusta',
      'cuanto cuesta un cambio extra',
    ],
    text:
      'Cada plan incluye un número definido de rondas de revisión, especificado en la propuesta. ' +
      'Agotadas las incluidas, te cobramos $40 por cada ronda adicional.',
  });

  add({
    id: 'plazos',
    topic: 'proceso',
    q: [
      'cuanto tardan',
      'en cuanto tiempo esta listo',
      'lo necesito urgente',
      'para cuando lo tienen',
    ],
    text:
      plans.map((p) => `${p.name}: ${p.delivery.replace('Entrega ', '')}`).join('; ') +
      '. Los plazos cuentan desde que recibimos el contenido final y el 50 % del pago.',
  });

  add({
    id: 'privacidad',
    topic: 'legal',
    q: ['que hacen con mis datos', 'privacidad', 'usan cookies', 'me van a spamear'],
    text:
      // Se compone del mismo dato que decide qué se carga, igual que hace
      // /privacidad. Escribirlo a mano fue justo lo que estuvo a punto de dejar
      // al chat afirmando que no había analítica el día que se instaló el píxel.
      (medicionActiva
        ? 'No guardamos nada en servidores nuestros, pero el sitio usa herramientas de medición de terceros (' +
          medicionNombres +
          ') que registran la visita con cookies. Puedes bloquearlas con cualquier bloqueador de rastreadores y el sitio funciona igual. '
        : 'No usamos cookies propias ni tenemos analítica instalada en el sitio. ') +
      (formDestination === 'whatsapp'
        ? 'Los formularios no envían nada a ningún servidor: redactan un mensaje de WhatsApp en tu navegador que tú decides enviar. '
        : 'El formulario de contacto se envía al servicio de formularios del alojamiento y lo leemos desde ahí; el cotizador no envía nada, redacta un mensaje de WhatsApp en tu navegador que tú decides enviar. ') +
      'Los datos solo se usan para responderte y preparar tu propuesta.',
  });

  add({
    id: 'no-incluye',
    topic: 'faq',
    q: [
      'que no incluye',
      'incluye contenido',
      'hacen las fotos',
      'escriben los textos',
      'incluye logo',
    ],
    text:
      'El precio del paquete cubre diseño, desarrollo, despliegue y las revisiones del plan. No cubrimos la redacción ' +
      'de contenido, sesión de fotografía ni licencias de imágenes premium: eso se cotiza aparte solo si lo necesitas.',
  });

  /* ---------------- Lista blanca de importes ---------------- */
  // Toda cifra que el modelo escriba y no esté aquí se considera inventada.
  const prices = [
    ...plans.map((p) => p.price),
    diagnostico.price,
    evot.price,
    // Los dos gastos mensuales de eVot no los cobramos nosotros, pero el bot
    // los dice igual — y si no están en la lista blanca, la respuesta correcta
    // se bloquea como si fuera inventada. El rango "$1–2" se parte igual que
    // los de módulos y Care.
    ...evotCostos.flatMap((c) => c.price.split(/[–-]/).map((s) => s.trim())),
    ...modules.flatMap((m) => m.price.split(/[–-]/).map((s) => s.trim())),
    ...carePlans.flatMap((c) => c.price.split(/[–-]/).map((s) => s.trim())),
    '$40',
    '$15',
  ]
    .map((p) => p.replace(/[^0-9,]/g, ''))
    .filter(Boolean);

  return new Response(
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        site: { name: site.name, location: site.location, whatsapp: contact.whatsapp },
        prices: [...new Set(prices)],
        facts,
      },
      null,
      0
    ),
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
  );
};
