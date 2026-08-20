/**
 * Auditoría de enlaces rotos, sobre el sitio ya construido.
 *
 *   npm run build && npm run medir:enlaces
 *
 * No necesita Playwright ni levantar un navegador: lee el HTML de `dist/`
 * directamente. Comprueba, en las páginas ya generadas:
 *
 *   A. Todo `href` interno (`/algo/`) apunta a un archivo que existe en `dist/`.
 *   B. Todo `src` de `<img>` y `<script>`, y todo `href` de `<link>`
 *      (hoja de estilo, icono, fuente, manifest) también existe.
 *   C. Toda ancla (`#seccion`, incluida la combinada `/planes/#modulos`) apunta
 *      a un `id` que existe de verdad en la página de destino. Un ancla que
 *      apunta a nada no rompe nada visible — el navegador solo se queda quieto
 *      donde está — así que a ojo no se nota nunca.
 *   D. Ningún enlace se quedó vacío o en un `#` suelto (el placeholder que deja
 *      un enlace a medio escribir).
 *
 * Antes de tocar `dist/`, también comprueba la regla 1 de
 * `docs/convenciones.md` sobre el código fuente:
 *
 *   E. Ningún `.astro`/`.ts` de `src/` hardcodea `href="/algo"`. La ruta se
 *      escribe una sola vez, en `routes.*` (`src/data/links.ts`); todo lo demás
 *      la importa. Un `href` hardcodeado no se nota hoy —hoy el sitio se sirve
 *      en la raíz—, pero rompería en silencio el día que sirva bajo un subpath,
 *      y ya de paso deja de moverse cuando cambia el mapa de rutas.
 *
 * Lo que NO comprueba a propósito: enlaces externos (WhatsApp, Instagram,
 * Facebook, el propio dominio en absoluto). Pedirles red en cada corrida de CI
 * los haría intermitentes por cosas que no tienen nada que ver con este repo.
 *
 * Sale con código 1 si algo falla, así que sirve tal cual en CI.
 */
import { readdir, readFile, access } from 'node:fs/promises';
import { join, dirname, extname, posix, relative } from 'node:path';
import { DIST, ROOT } from './_harness.mjs';

const fails = [];
const fail = (msg) => fails.push(msg);

/** Todos los `.html` bajo `dist/`, con su ruta relativa a `dist/`. */
async function findHtmlFiles(dir, base = dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await findHtmlFiles(full, base)));
    } else if (entry.name.endsWith('.html')) {
      out.push(full.slice(base.length + 1));
    }
  }
  return out;
}

/** URL → ruta absoluta que debería existir en `dist/`, sin query ni hash. */
function resolveDistPath(urlPath) {
  const clean = urlPath.split(/[?#]/)[0];
  if (clean === '' || clean === '/') return join(DIST, 'index.html');
  if (extname(clean)) return join(DIST, clean); // asset: .css, .png, .woff2…
  if (clean.endsWith('/')) return join(DIST, clean, 'index.html');
  return join(DIST, `${clean}/index.html`); // el sitio va con trailingSlash:'always'
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/** Quita el contenido de <script> y <style> antes de buscar <a href>. */
function stripScriptsAndStyles(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
}

function extractAttr(html, tagRe, attr) {
  const out = [];
  const attrRe = new RegExp(`${attr}="([^"]*)"`, 'i');
  for (const m of html.matchAll(tagRe)) {
    const found = m[0].match(attrRe);
    if (found) out.push(found[1]);
  }
  return out;
}

/** Todo `.astro`/`.ts` bajo `src/`, con su ruta relativa a `src/`. */
async function findSourceFiles(dir, base = dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await findSourceFiles(full, base)));
    } else if (/\.(astro|ts|tsx)$/.test(entry.name)) {
      out.push(full.slice(base.length + 1));
    }
  }
  return out;
}

/** E. `href="/algo"` hardcodeado en vez de `routes.*` / `withBase()`. */
async function checkHardcodedHrefs() {
  const SRC = join(ROOT, 'src');
  // links.ts ES la fuente de verdad: ahí BASE puede componerse a mano.
  const files = (await findSourceFiles(SRC)).filter((f) => f !== 'data/links.ts');
  for (const rel of files) {
    const text = await readFile(join(SRC, rel), 'utf8');
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      if (/href\s*=\s*["'`]\//.test(line)) {
        fail(`${relative(ROOT, join(SRC, rel))}:${i + 1}: href hardcodeado — usa routes.* / withBase()`);
      }
    });
  }
}

async function main() {
  await checkHardcodedHrefs();

  const files = await findHtmlFiles(DIST);
  if (files.length === 0) {
    console.error('No hay nada en dist/. Corre `npm run build` primero.');
    process.exit(2);
  }

  // Un solo `readFile` por archivo: se reusa para los ids y para los enlaces.
  const raw = new Map(); // ruta relativa → html completo
  const ids = new Map(); // ruta relativa → Set de ids presentes en esa página
  for (const rel of files) {
    const html = await readFile(join(DIST, rel), 'utf8');
    raw.set(rel, html);
    ids.set(rel, new Set(extractAttr(html, /<[a-z][^>]*\bid="[^"]*"[^>]*>/gi, 'id')));
  }

  /** ruta relativa de dist/ que le correspondería a un href absoluto interno. */
  function relForHref(hrefPath) {
    const abs = resolveDistPath(hrefPath);
    return posix
      .relative(DIST.split('\\').join('/'), abs.split('\\').join('/'))
      .split('\\')
      .join('/');
  }

  for (const rel of files) {
    const html = raw.get(rel);
    const body = stripScriptsAndStyles(html);

    // B. assets — se buscan ANTES de tocar <script>/<style>, para no perder
    // el `src` de un <script src="…">.
    const assetUrls = [
      ...extractAttr(html, /<script\b[^>]*\bsrc="[^"]*"[^>]*>/gi, 'src'),
      ...extractAttr(html, /<img\b[^>]*\bsrc="[^"]*"[^>]*>/gi, 'src'),
      ...extractAttr(
        html,
        /<link\b[^>]*\brel="(?:stylesheet|icon|manifest|preload|apple-touch-icon)"[^>]*>/gi,
        'href'
      ),
    ];
    for (const url of assetUrls) {
      if (!url.startsWith('/') || url.startsWith('//')) continue; // solo interno
      if (!(await exists(resolveDistPath(url)))) {
        fail(`${rel}: recurso roto → ${url}`);
      }
    }

    // A, C, D — enlaces de verdad, nunca los de dentro de un <script>.
    const hrefs = extractAttr(body, /<a\b[^>]*\bhref="[^"]*"[^>]*>/gi, 'href');
    for (const href of hrefs) {
      if (href === '' || href === '#') {
        fail(`${rel}: enlace vacío o "#" suelto`);
        continue;
      }
      if (/^([a-z]+:)?\/\//i.test(href) || /^(mailto|tel):/i.test(href)) continue; // externo

      if (href.startsWith('#')) {
        if (!ids.get(rel).has(href.slice(1))) {
          fail(`${rel}: ancla "${href}" no existe en la página`);
        }
        continue;
      }

      if (!href.startsWith('/')) {
        fail(`${rel}: enlace relativo sin "/" → ${href} (usa withBase() / routes.*)`);
        continue;
      }

      const targetRel = relForHref(href);
      if (!(await exists(join(DIST, targetRel)))) {
        fail(`${rel}: enlace roto → ${href}`);
        continue;
      }

      const hash = href.split('#')[1];
      if (hash && !(ids.get(targetRel) ?? new Set()).has(hash)) {
        fail(`${rel}: ancla "${href}" no existe en ${targetRel}`);
      }
    }
  }

  console.log(`${files.length} páginas revisadas.\n`);
  if (fails.length) {
    for (const f of fails) console.error(`✗ ${f}`);
    console.error(`\n${fails.length} enlace(s) roto(s).`);
    process.exit(1);
  }
  console.log('✅ Ningún enlace interno roto.');
}

main();
