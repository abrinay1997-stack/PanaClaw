/**
 * Prepara `dist/` para Cloudflare: le añade lo que solo Cloudflare lee.
 *
 * Corre después de `astro build` y únicamente en el build de Cloudflare
 * (`npm run build:cloudflare`). El build de Netlify no lo toca, y por eso
 * `cloudflare/_headers` no está en `public/`: ver la cabecera de ese archivo.
 *
 * Falla en voz alta si algo de lo que el despliegue da por hecho no está, en vez
 * de dejar que Cloudflare publique un sitio sin cabeceras o sin su página 404.
 */

import { copyFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const raiz = new URL('..', import.meta.url).pathname;
const dist = join(raiz, 'dist');

if (!existsSync(dist)) {
  console.error('No existe dist/. Corre `astro build` antes (o usa `npm run build:cloudflare`).');
  process.exit(1);
}

copyFileSync(join(raiz, 'cloudflare/_headers'), join(dist, '_headers'));

// `/contacto` → `/contacto/` con un 301, como hace Netlify.
//
// Cloudflare también redirige a la URL con barra, pero con un 307 (temporal), y
// un 301 es lo que Google lee como «esta URL cambió para siempre». El sitio está
// indexado con barra, así que casi nadie llega sin ella; aun así, si alguien
// enlazó a mano `/planes`, el 307 le diría a Google que no se mueva de ahí. Se
// escribe una regla por página, sacadas de lo que Astro construyó de verdad: si
// mañana hay una página nueva, la regla aparece sola.
const paginas = [];
const recorrer = (carpeta, ruta) => {
  for (const entrada of readdirSync(carpeta, { withFileTypes: true })) {
    if (!entrada.isDirectory()) continue;
    const hija = `${ruta}/${entrada.name}`;
    if (existsSync(join(carpeta, entrada.name, 'index.html'))) paginas.push(hija);
    recorrer(join(carpeta, entrada.name), hija);
  }
};
recorrer(dist, '');
paginas.sort();

writeFileSync(
  join(dist, '_redirects'),
  [
    '# Generado por scripts/cloudflare-assets.mjs. No se edita a mano.',
    ...paginas.map((ruta) => `${ruta} ${ruta}/ 301`),
    '',
  ].join('\n'),
);

const exigidos = ['index.html', '404.html', 'kb.json', '_headers'];
const faltan = exigidos.filter((archivo) => !existsSync(join(dist, archivo)));
if (faltan.length) {
  console.error(`Falta en dist/: ${faltan.join(', ')}.`);
  process.exit(1);
}

// La única regla de caché que NO puede perderse: sin `! Cache-Control` en las
// excepciones, Cloudflare junta las dos cifras en una sola cabecera.
const cabeceras = readFileSync(join(dist, '_headers'), 'utf8');
if (!/\/_astro\/\*\s+! Cache-Control/.test(cabeceras)) {
  console.error('dist/_headers: la regla de /_astro/* perdió su `! Cache-Control`.');
  process.exit(1);
}

console.log(`dist/ listo para Cloudflare: cabeceras copiadas, ${paginas.length} redirecciones 301 y archivos comprobados.`);
