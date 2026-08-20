/**
 * Helpers de URLs para respetar el `base` de Astro.
 *
 * Netlify sirve en la raíz, así que en prod BASE_URL = '/' (igual que en dev).
 * Se mantiene withBase() por si algún día se despliega bajo un subpath.
 *
 * Regla: NUNCA hardcodear rutas con '/…' en templates. Usar siempre withBase() o routes.*
 */

// Normalizamos: siempre garantizamos trailing slash para poder concatenar sin sorpresas.
const RAW = import.meta.env.BASE_URL;
const BASE = RAW.endsWith('/') ? RAW : `${RAW}/`;

/** Une el base con una ruta interna. Acepta hashes y query strings. */
export function withBase(path: string): string {
  // Enlaces externos y anclas puras pasan tal cual
  if (/^([a-z]+:)?\/\//i.test(path) || path.startsWith('#')) return path;
  const clean = path.replace(/^\/+/, '');
  return `${BASE}${clean}`;
}

/**
 * Rutas internas nombradas — punto único de verdad.
 *
 * Todas terminan en barra porque el sitio se construye con
 * `trailingSlash:'always'` (ver `astro.config.mjs`). La barra no es cosmética:
 * es la URL que declara el canonical de cada página y la que emite el sitemap.
 * Un enlace interno sin ella provoca una redirección extra en cada clic.
 */
export const routes = {
  home: BASE,
  servicios: withBase('servicios/'),
  ebot: withBase('ebot/'),
  seguridad: withBase('seguridad/'),
  proyectos: withBase('proyectos/'),
  planes: withBase('planes/'),
  proceso: withBase('proceso/'),
  ayuda: withBase('ayuda/'),
  cotizador: withBase('cotizador/'),
  contacto: withBase('contacto/'),
  blog: withBase('blog/'),
  gracias: withBase('gracias/'),
  privacidad: withBase('privacidad/'),
  terminos: withBase('terminos/'),
};

/** Ancla dentro de una ruta. */
export function anchor(route: string, hash: string): string {
  return `${route}${hash}`;
}
