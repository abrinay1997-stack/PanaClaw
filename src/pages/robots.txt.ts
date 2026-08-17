import type { APIRoute } from 'astro';

/**
 * `robots.txt` generado, no estático.
 *
 * Vivía en `public/robots.txt` y ahí no podía declarar el sitemap: la directiva
 * `Sitemap:` exige una URL absoluta, y un archivo estático solo puede llevar el
 * dominio escrito a mano. Eso creaba una segunda copia del dominio fuera de
 * `astro.config.mjs` — justo la que se queda desfasada el día que el dominio
 * cambie, y en silencio, porque un `robots.txt` con un sitemap muerto no rompe
 * ningún build ni ninguna página: solo deja de guiar al rastreador.
 *
 * Generándolo, el dominio sale de `Astro.site` como el canonical y el sitemap,
 * así que las tres cosas no pueden discrepar.
 *
 * Las rutas excluidas son las mismas que van con `noindex`, MENOS `/smark/`:
 * esa se enlaza desde la bio en redes y un `Disallow` impediría al rastreador
 * entrar a leer su propio `noindex`, con lo que acabaría indexada igual y sin
 * descripción. Es el mismo razonamiento que ya está escrito en el filtro del
 * sitemap, en `astro.config.mjs`.
 */
export const GET: APIRoute = ({ site }) => {
  const lines = ['User-agent: *', 'Allow: /', 'Disallow: /gracias/', 'Disallow: /404.html'];

  // `site` es `undefined` si `astro.config.mjs` no lo declara. No se inventa un
  // dominio: sin él se omite la línea, porque un `Sitemap:` relativo o apuntando
  // a localhost es peor que no tenerlo.
  if (site) {
    lines.push('', `Sitemap: ${new URL('sitemap-index.xml', site).toString()}`);
  }

  return new Response(`${lines.join('\n')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
