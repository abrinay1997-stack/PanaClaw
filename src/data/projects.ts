/**
 * Trabajo publicado.
 *
 * REGLA DE ESTE ARCHIVO: aquí solo entra lo verificable.
 *
 * Todo lo que no sea el nombre, el dominio y el enlace es opcional y está sin
 * rellenar a propósito. La página omite el campo que no existe, así que una
 * ficha a medias se ve corta pero nunca falsa.
 *
 * El motivo no es prudencia decorativa: el argumento entero del sitio es que
 * los números se miden. Una cifra inflada aquí desmonta las otras nueve
 * páginas. Es preferible enseñar cuatro enlaces reales sin adornos que cuatro
 * fichas completas que no aguanten una comprobación.
 *
 * CÓMO COMPLETAR UNA FICHA
 *   1. `sector`, `year`, `summary`, `challenge`, `solution` — los escribe quien
 *      hizo el proyecto. `summary` es una frase; `challenge` y `solution`, un
 *      párrafo corto cada uno. Mismo criterio que en services.ts: el dolor del
 *      cliente antes que la herramienta.
 *   2. `metrics` — medidas de verdad, no recordadas: `npm run medir` las saca de
 *      Lighthouse y las devuelve listas para pegar, con su `measuredAt`. Si no
 *      se midió, se deja el array vacío y la banda no aparece.
 *   3. `capabilities` — qué del catálogo se aplicó, con el mismo vocabulario de
 *      modules.ts, para que el visitante ate el caso con lo que puede contratar.
 *   4. `image` — `npm run capturas` abre cada sitio de esta lista y deja la
 *      portada en `src/assets/proyectos/<slug>.jpg`. Míralas antes de
 *      publicarlas (el script no distingue una portada de un aviso de cookies
 *      tapándola) y luego enlázalas: el import arriba y `image` en la ficha, que
 *      es lo único que el script no hace por ti. Sin captura, la tarjeta cae a
 *      un tratamiento tipográfico que ya se ve intencionado; no hace falta poner
 *      una imagen de relleno.
 */

import bukoflowPlay from '../assets/proyectos/bukoflow-play.jpg';
import livesyncPro from '../assets/proyectos/livesync-pro.jpg';
import acusticaSuperior from '../assets/proyectos/acustica-superior.jpg';
import bukoflowTienda from '../assets/proyectos/bukoflow-tienda.jpg';
import dcasapty from '../assets/proyectos/dcasapty.jpg';
import byslogistics from '../assets/proyectos/byslogistics.jpg';

export interface ProjectMetric {
  /**
   * Etiqueta corta: «Carga», «Prueba de Google», «Productos».
   * En el idioma del cliente, como el resto del sitio: nada de nombres de
   * herramienta que solo reconozca un programador.
   */
  k: string;
  /** El valor medido, con su unidad. */
  v: string;
}

export interface Project {
  slug: string;
  /** Cómo se nombra el proyecto en la ficha. */
  name: string;
  /** Dominio visible, sin protocolo. Es lo que sostiene la tarjeta sin captura. */
  domain: string;
  url: string;

  /** Sector en una o dos palabras. */
  sector?: string;
  /** Año de entrega. */
  year?: string;
  /** Qué es, en una frase. */
  summary?: string;
  /** De qué se partía. */
  challenge?: string;
  /** Qué se construyó. */
  solution?: string;
  /** Medidas reales. Vacío = no se dibuja la banda de métricas. */
  metrics?: ProjectMetric[];
  /** Fecha de la medición. Sin ella las métricas no se publican. */
  measuredAt?: string;
  /** Capacidades del catálogo aplicadas en este proyecto. */
  capabilities?: string[];
  /** Captura del sitio. */
  image?: ImageMetadata;
  /** Ocupa el doble de ancho en la retícula. */
  featured?: boolean;
}

// El orden es el de la página. D'CASA va primero por decisión de la dueña (8-nov-2026):
// es la primera captura que ve quien llega. Un proyecto nuevo se añade después.
export const projects: Project[] = [
  {
    slug: 'dcasapty',
    name: "D'CASA Panamá",
    domain: 'dcasapty.com',
    url: 'https://dcasapty.com/',
    image: dcasapty,
    sector: 'Mueblería',
    // Todo lo que dice esta frase está en la propia portada del sitio: el
    // rubro, las categorías, los precios claros y las zonas de entrega.
    summary:
      'El sitio de una mueblería de La Chorrera: catálogo de salas, recámaras, colchones y zapateras con precios claros, carrito, cuenta de cliente y entregas en Panamá Oeste, Panamá y Colón.',
    // TODO(contenido): year, challenge, solution, capabilities.
    // TODO(medición): `npm run medir` → metrics + measuredAt.
  },
  {
    slug: 'byslogistics',
    name: 'B&S Logistics',
    domain: 'byslogistics.com.co',
    url: 'https://byslogistics.com.co/',
    image: byslogistics,
    sector: 'Seguridad preventiva',
    // Sacado de la portada del sitio: a qué se dedica la empresa y qué ofrece
    // el sitio (catálogo, recursos, cotización y asistente).
    summary:
      'El sitio de una empresa que distribuye y comercializa elementos de seguridad preventiva, como precintos: catálogo de productos, recursos, cotización en línea y un asistente de chat.',
    // TODO(contenido): year, challenge, solution, capabilities.
    // TODO(medición): `npm run medir` → metrics + measuredAt.
  },
  {
    slug: 'bukoflow-play',
    // El sitio se presenta como StemFlow; el slug sigue el dominio, que es lo
    // que ata la ficha con su captura en src/assets/proyectos/.
    name: 'StemFlow',
    domain: 'play.bukoflow.com',
    url: 'https://play.bukoflow.com/',
    image: bukoflowPlay,
    sector: 'Música',
    summary:
      'Una plataforma para escuchar música en tres dimensiones: cada instrumento se mueve por el espacio y se ajusta en tiempo real mientras suena.',
    // TODO(contenido): year, challenge, solution, capabilities.
    // TODO(medición): `npm run medir` → metrics + measuredAt.
  },
  {
    slug: 'livesync-pro',
    name: 'LiveSync Pro',
    domain: 'livesyncpro.com',
    url: 'https://livesyncpro.com/',
    image: livesyncPro,
    sector: 'Software técnico',
    summary:
      'Una suite de herramientas de cálculo para ingenieros: física, comportamiento térmico de los equipos y gestión del inventario, en una sola plataforma colaborativa.',
    // TODO(contenido): year, challenge, solution, capabilities.
    // TODO(medición): `npm run medir` → metrics + measuredAt.
  },
  {
    slug: 'acustica-superior',
    name: 'Acústica Superior',
    domain: 'acusticasuperior.com',
    url: 'https://acusticasuperior.com/',
    image: acusticaSuperior,
    sector: 'Acústica',
    summary:
      'El sitio de una empresa panameña de tratamiento acústico: qué hace, los proyectos que ha entregado y un camino directo a cotizar por WhatsApp.',
    // TODO(contenido): year, challenge, solution, capabilities.
    // TODO(medición): `npm run medir` → metrics + measuredAt.
  },
  {
    slug: 'bukoflow-tienda',
    name: 'Bukoflow Tienda',
    domain: 'tienda.bukoflow.com',
    url: 'https://tienda.bukoflow.com/',
    image: bukoflowTienda,
    sector: 'Música',
    summary:
      'Una tienda de beats con licencia inmediata: catálogo, compra en línea y servicios de producción a medida.',
    // TODO(contenido): year, challenge, solution, capabilities.
    // TODO(medición): `npm run medir` → metrics + measuredAt.
  },
];

/**
 * Las métricas solo se publican si además se sabe cuándo se tomaron. Una cifra
 * sin fecha envejece sin avisar y acaba siendo mentira sin que nadie la tocara.
 */
export function publishedMetrics(project: Project): ProjectMetric[] {
  if (!project.measuredAt) return [];
  return project.metrics ?? [];
}
