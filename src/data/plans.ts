import { ebot } from './ebot';
import { securityPlans, precioCompleto } from './seguridad';

export interface Plan {
  slug: string;
  name: string;
  price: string;
  delivery: string;
  desc: string;
  features: string[];
  featured?: boolean;
  badge?: string;
}

/**
 * Orden visual (Corporate primero = anclaje).
 * Cambiar precio o plan aquí propaga a landing + selector del formulario.
 */
export const plans: Plan[] = [
  {
    slug: 'corporate',
    name: 'PanaClaw Corporate',
    price: '$850',
    delivery: 'Entrega 8–12 días',
    featured: true,
    badge: 'Recomendado',
    desc: 'Hasta 10 páginas, con blog y un panel para que edites el contenido tú mismo. Es el plan que sustituye al WordPress de $1,200 de las agencias.',
    features: [
      'Hasta 10 páginas a medida',
      'Editas textos e imágenes tú mismo',
      'Blog y todo listo para salir en Google',
      'Los mensajes te llegan al WhatsApp',
      'Medición de visitas incluida',
      'Publicación y dominio incluidos',
    ],
  },
  {
    slug: 'launch',
    name: 'PanaClaw Launch',
    price: '$450',
    delivery: 'Entrega 4–5 días',
    desc: 'Una sola página, larga y diseñada desde cero. Para quien invierte en publicidad y necesita un sitio donde esa inversión se convierta en clientes.',
    features: [
      '7 secciones a medida',
      'Preparada para salir en Google',
      'Los mensajes te llegan al WhatsApp',
      'Medición de visitas y anuncios',
      'Publicación incluida',
    ],
  },
  {
    slug: 'commerce',
    name: 'PanaClaw Commerce',
    price: '$1,200',
    delivery: 'Entrega 15–20 días',
    desc: 'Todo lo de Corporate, más tu catálogo, tu carrito y el cobro en línea. Pensado para el negocio panameño que quiere vender sin depender de las redes.',
    features: [
      'Todo lo de Corporate',
      'Catálogo con control de stock',
      'Carrito y compra en línea',
      'Cobras con Yappy, tarjeta y PayPal',
      'Panel para gestionar tus pedidos',
    ],
  },
  {
    slug: 'start',
    name: 'PanaClaw Start',
    price: '$295',
    delivery: 'Entrega 72 h',
    desc: 'Una página con lo esencial, lista en 72 horas. Para emprender, para un evento o para dejar de mandar a tus clientes a un perfil de Instagram.',
    features: [
      '4–5 secciones',
      'Diseño sobre una base ya probada',
      'Los mensajes te llegan al WhatsApp',
      'Medición de visitas',
      'Publicación incluida',
    ],
  },
];

export const diagnostico = {
  slug: 'diagnostico',
  name: 'Diagnóstico PanaClaw',
  price: '$49',
  desc: 'Te decimos qué tan lento va tu sitio hoy, las 3 razones concretas por las que estás perdiendo clientes en él, y qué hacer con cada una. Informe y llamada de 30 minutos en 48 horas.',
} as const;

/**
 * Opciones del <select> en /contacto — se genera de plans + diagnostico + extras.
 */
export interface PlanOption {
  value: string;
  label: string;
}

export const planOptions: PlanOption[] = [
  ...plans.map((p) => ({ value: p.slug, label: `${p.name} — ${p.price}` })),
  { value: diagnostico.slug, label: `${diagnostico.name} — ${diagnostico.price}` },
  // eBot no es un plan de sitio web, pero sí es algo que se pide por este mismo
  // formulario. Su precio se importa de `ebot.ts` en vez de escribirse: si algún
  // día sube, el desplegable no puede quedarse anunciando la cifra vieja.
  { value: ebot.slug, label: `${ebot.name} — ${ebot.price}` },
  // Los tres de seguridad entran uno a uno y no como una sola entrada genérica:
  // son tres compromisos distintos (una revisión que se paga y se acaba, y dos
  // mensualidades), y saber cuál pulsó la persona es la mitad de la respuesta.
  // Los precios se importan, igual que el de eBot: si suben, el desplegable no
  // puede quedarse anunciando la cifra vieja.
  ...securityPlans.map((p) => ({
    value: `seguridad-${p.slug}`,
    label: `${p.name} — ${precioCompleto(p)}`,
  })),
  { value: 'modulos', label: 'Sistema por módulos' },
  { value: 'care', label: 'Solo mantenimiento (Care)' },
  { value: 'otro', label: 'Aún no lo sé' },
];
