/**
 * El catálogo: todo lo que se vende, en una sola lista.
 *
 * POR QUÉ EXISTE. El sitio llegó a vender seis cosas distintas repartidas en
 * cinco páginas —planes, capacidades, eBot, seguridad, Care y el diagnóstico— y
 * no había ni una pantalla donde se vieran juntas. Quien quería comparar tenía
 * que recorrer cinco URLs y acordarse; quien no sabía que existían, no las
 * encontraba nunca. Esto es la puerta: qué es cada cosa, para quién es, cuánto
 * cuesta y cómo se cobra.
 *
 * NINGÚN PRECIO SE ESCRIBE AQUÍ. Todos se componen de la fuente de cada
 * producto (`plans.ts`, `modules.ts`, `ebot.ts`, `seguridad.ts`, `care.ts`), así
 * que el día que suba uno, sube aquí solo. Es la regla 10 del proyecto aplicada
 * al sitio donde más caro saldría romperla: una lista comparativa con una cifra
 * vieja es peor que no tener lista.
 *
 * EL ORDEN es el del recorrido de compra, no el del catálogo interno: primero lo
 * que trae a la gente al sitio (una web), después lo que se le suma, y al final
 * lo que solo le sirve a quien ya tiene sitio. La columna «para quién» es la que
 * de verdad hace el trabajo: la mayoría de la gente no sabe cómo se llama lo que
 * necesita, sabe en qué situación está.
 */
import { plans, diagnostico } from './plans';
import { modules } from './modules';
import { ebot } from './ebot';
import { revision, protegida } from './seguridad';
import { carePlans } from './care';
import { routes, anchor } from './links';

/** '$1,200' → 1200 · '$80–$150' → 80. El primero de la cadena, no el mayor. */
const primerImporte = (precio: string) =>
  Number(precio.replace(/,/g, '').match(/\d+(\.\d+)?/)?.[0] ?? 0);

const desde = (precios: string[]) =>
  `Desde $${Math.min(...precios.map(primerImporte)).toLocaleString('en-US')}`;

export interface CatalogItem {
  name: string;
  /** La situación del cliente, no la categoría del producto. */
  paraQuien: string;
  desc: string;
  price: string;
  /** Cómo se cobra. Es la mitad del precio y casi nadie la publica. */
  cobro: string;
  href: string;
}

export const catalogo: CatalogItem[] = [
  {
    name: 'Sitios web',
    paraQuien: 'No tienes sitio, o el que tienes da vergüenza',
    desc: 'Cuatro planes cerrados, de una página a una tienda completa. Abre en menos de un segundo y el código queda a tu nombre.',
    price: desde(plans.map((p) => p.price)),
    cobro: 'Pago único',
    href: routes.planes,
  },
  {
    name: 'Capacidades avanzadas',
    paraQuien: 'Tu web tiene que hacer algo más que existir',
    desc: 'Reservas, cuentas de usuario, panel de control, portal de clientes, inventario o conectarla con el programa que ya usas.',
    price: desde(modules.map((m) => m.price)),
    cobro: 'Pago único, por capacidad',
    href: anchor(routes.planes, '#modulos'),
  },
  {
    name: ebot.name,
    paraQuien: 'Se te acumulan los mensajes sin contestar',
    desc: 'Un asistente que contesta por WhatsApp, Instagram, Messenger y Telegram a cualquier hora, con un panel donde ves cada conversación.',
    price: ebot.price,
    cobro: 'Pago único, sin mensualidad nuestra',
    href: routes.ebot,
  },
  {
    name: 'Seguridad web',
    paraQuien: 'Ya tienes sitio y no sabes si está abierto de par en par',
    desc: 'Revisamos cómo está montado y por dónde podrían entrar, te lo entregamos por escrito y lo cerramos. Después, protección mes a mes si la quieres.',
    price: desde([revision.price]),
    cobro: `Pago único · protección desde ${protegida.price}${protegida.suffix}`,
    href: routes.seguridad,
  },
  {
    name: 'PanaClaw Care',
    paraQuien: 'Tu sitio lo hicimos nosotros y no quieres ocuparte de él',
    desc: 'Nos hacemos cargo de que siga en pie: dominio, copias, actualizaciones, vigilancia de caídas y las horas de cambios del mes.',
    price: `${desde(carePlans.map((c) => c.price))}/mes`,
    cobro: 'Al mes, sin permanencia',
    href: anchor(routes.servicios, '#care'),
  },
  {
    name: diagnostico.name,
    paraQuien: 'Tu sitio funciona, pero no te trae clientes',
    desc: 'Te decimos qué tan lento va, las tres razones concretas por las que estás perdiendo clientes en él y qué hacer con cada una.',
    price: diagnostico.price,
    cobro: 'Pago único · 48 horas',
    href: anchor(routes.servicios, '#diagnostico'),
  },
];
