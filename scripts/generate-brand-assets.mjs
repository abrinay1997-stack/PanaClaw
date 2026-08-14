/**
 * Genera los assets de marca estáticos que viven en `public/`:
 *
 *   public/favicon.svg          — marca vectorial (rayo naranja sobre negro)
 *   public/favicon-32.png       — fallback para navegadores viejos
 *   public/apple-touch-icon.png — 180×180, iOS
 *   public/og.png               — 1200×630, imagen social (OpenGraph / Twitter)
 *
 * Se corre a mano cuando cambie el branding, NO en cada build:
 *
 *   npm run brand              → solo og.png
 *   npm run brand -- --iconos  → además rehace los iconos desde el rayo
 *
 * Los PNG resultantes se commitean. El build de Astro solo los copia. Y hay que
 * MIRARLOS antes de commitearlos: son la cara de la marca fuera del sitio.
 *
 * NOTA SOBRE FUENTES. @fontsource solo distribuye woff/woff2, y el motor de SVG
 * de sharp resuelve fuentes vía fontconfig, que no lee woff. El script
 * descomprime el woff a sfnt (un woff es un sfnt con las tablas en zlib) y lo
 * instala en ~/.fonts antes de renderizar.
 *
 * Eso vale mientras ese motor sea **librsvg**. Las versiones de sharp con
 * libvips >= 8.17 traen **resvg**, que no pasa por fontconfig y por tanto
 * ignora ~/.fonts: en esas, el script corría entero y emitía un og.png sin una
 * sola letra. Por eso `comprobarQueElRenderizadorDibujaTexto()` aborta antes de
 * escribir nada. Si te salta, esta es la explicación.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { inflateSync } from 'node:zlib';
import { homedir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');

/* ------------------------------------------------------------------ *
 * Tokens de marca — deben coincidir con src/styles/global.css
 * ------------------------------------------------------------------ */
const DEEP_BLACK = '#100101';
const FLASH_ORANGE = '#FF5100';
const EMBER_RED = '#FF1E1E';
const SOFT_WHITE = '#FFF7F7';
const STUDIO_GRAY = '#BABABA';

/* ------------------------------------------------------------------ *
 * 1. Fuentes: woff → sfnt → ~/.fonts
 * ------------------------------------------------------------------ */
function woffToSfnt(buf) {
  if (buf.toString('latin1', 0, 4) !== 'wOFF') throw new Error('no es un WOFF v1');
  const flavor = buf.readUInt32BE(4);
  const numTables = buf.readUInt16BE(12);

  const pad4 = (n) => (n + 3) & ~3;
  let cursor = 12 + numTables * 16;

  const tables = [];
  for (let i = 0; i < numTables; i++) {
    const o = 44 + i * 20;
    const tag = buf.toString('latin1', o, o + 4);
    const offset = buf.readUInt32BE(o + 4);
    const compLength = buf.readUInt32BE(o + 8);
    const origLength = buf.readUInt32BE(o + 12);
    const checksum = buf.readUInt32BE(o + 16);

    const raw = buf.subarray(offset, offset + compLength);
    const data = compLength === origLength ? Buffer.from(raw) : inflateSync(raw);
    if (data.length !== origLength) throw new Error(`tabla ${tag}: longitud inesperada`);

    tables.push({ tag, checksum, data, sfntOffset: cursor });
    cursor += pad4(origLength);
  }

  const out = Buffer.alloc(cursor, 0);
  const pow2 = Math.floor(Math.log2(numTables));
  out.writeUInt32BE(flavor, 0);
  out.writeUInt16BE(numTables, 4);
  out.writeUInt16BE(16 * 2 ** pow2, 6);
  out.writeUInt16BE(pow2, 8);
  out.writeUInt16BE(numTables * 16 - 16 * 2 ** pow2, 10);

  // El directorio sfnt va ordenado alfabéticamente por tag
  [...tables]
    .sort((a, b) => (a.tag < b.tag ? -1 : 1))
    .forEach((t, i) => {
      const o = 12 + i * 16;
      out.write(t.tag, o, 4, 'latin1');
      out.writeUInt32BE(t.checksum, o + 4);
      out.writeUInt32BE(t.sfntOffset, o + 8);
      out.writeUInt32BE(t.data.length, o + 12);
    });
  tables.forEach((t) => t.data.copy(out, t.sfntOffset));
  return out;
}

function installFonts() {
  const dir = join(homedir(), '.fonts');
  mkdirSync(dir, { recursive: true });
  let installed = 0;
  for (const weight of [400, 600, 700]) {
    const src = join(ROOT, 'node_modules/@fontsource/archivo/files', `archivo-latin-${weight}-normal.woff`);
    if (!existsSync(src)) continue;
    writeFileSync(join(dir, `Archivo-${weight}.ttf`), woffToSfnt(readFileSync(src)));
    installed++;
  }
  if (!installed) {
    console.warn('⚠  No se encontró @fontsource/archivo — el texto caerá a la fuente por defecto.');
    return;
  }
  try {
    execFileSync('fc-cache', ['-f'], { stdio: 'ignore' });
  } catch {
    console.warn('⚠  fc-cache no disponible; si el texto sale con otra fuente, esa es la causa.');
  }
  console.log(`· ${installed} pesos de Archivo instalados en ~/.fonts`);
}

/* ------------------------------------------------------------------ *
 * 2. Marca: rayo sobre cuadrado negro
 * ------------------------------------------------------------------ */
// Rayo dibujado sobre un viewBox de 64×64, centrado.
const BOLT = 'M37.5 6 18 35.5h11.2L26.5 58 46 28.5H34.8L37.5 6Z';

function iconSvg(size, { rounded = true } = {}) {
  const r = rounded ? size * 0.22 : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="bolt" x1="18" y1="6" x2="46" y2="58" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${FLASH_ORANGE}"/>
      <stop offset="1" stop-color="${EMBER_RED}"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="${(r / size) * 64}" fill="${DEEP_BLACK}"/>
  <path d="${BOLT}" fill="url(#bolt)"/>
</svg>`;
}

/* ------------------------------------------------------------------ *
 * 3. Imagen social 1200×630
 * ------------------------------------------------------------------ */
export function ogSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="0.86" cy="0.08" r="0.75">
      <stop offset="0" stop-color="${FLASH_ORANGE}" stop-opacity="0.85"/>
      <stop offset="0.38" stop-color="#EE0000" stop-opacity="0.42"/>
      <stop offset="1" stop-color="${DEEP_BLACK}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${FLASH_ORANGE}"/>
      <stop offset="1" stop-color="${FLASH_ORANGE}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="streak" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${EMBER_RED}" stop-opacity="0"/>
      <stop offset="0.5" stop-color="${EMBER_RED}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${EMBER_RED}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="boltG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${FLASH_ORANGE}"/>
      <stop offset="1" stop-color="${EMBER_RED}"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="${DEEP_BLACK}"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- Estelas: eco del shader del hero -->
  <g opacity="0.55">
    <rect x="620" y="150" width="620" height="2" fill="url(#streak)" transform="rotate(-14 620 150)"/>
    <rect x="560" y="238" width="720" height="3" fill="url(#streak)" transform="rotate(-14 560 238)"/>
    <rect x="700" y="322" width="520" height="2" fill="url(#streak)" transform="rotate(-14 700 322)"/>
    <rect x="640" y="410" width="640" height="2" fill="url(#streak)" transform="rotate(-14 640 410)"/>
  </g>

  <!-- Wordmark.
       El punto naranja va como <tspan> DENTRO del mismo <text>, no como un
       segundo <text> posicionado a mano. Antes estaba en x="305", una medida
       calculada para el ancho exacto de la palabra que hubiera ese día: al
       cambiar el nombre de la marca, el punto se quedaba flotando en mitad de
       la nada sin que nada avisara. Así lo coloca el propio renderizador y el
       nombre puede volver a cambiar sin romper nada.

       Versalitas y tracking .20em son el tratamiento real del wordmark en el
       sitio (.brand-name en global.css). Esta imagen es lo que se ve al
       compartir un enlace, así que es justo donde tiene que coincidir. -->
  <g transform="translate(80 92)">
    <g transform="translate(0 -30) scale(0.75)">
      <path d="${BOLT}" fill="url(#boltG)"/>
    </g>
    <text x="62" y="18" font-family="Archivo" font-weight="700" font-size="34"
          letter-spacing="6.8" fill="${SOFT_WHITE}">PANACLAW<tspan
          fill="${FLASH_ORANGE}">.</tspan></text>
  </g>

  <rect x="80" y="140" width="420" height="1" fill="url(#rule)"/>

  <!-- Titular -->
  <text x="80" y="292" font-family="Archivo" font-weight="700" font-size="84"
        letter-spacing="-2.4" fill="${SOFT_WHITE}">Sitios que <tspan fill="${EMBER_RED}">encienden</tspan>.</text>
  <text x="80" y="386" font-family="Archivo" font-weight="700" font-size="84"
        letter-spacing="-2.4" fill="${SOFT_WHITE}">Código <tspan fill="${EMBER_RED}">tuyo</tspan>.</text>

  <!-- Bajada.
       Decía «Sitios Jamstack en Panamá». «Jamstack» está en la lista de jerga
       prohibida de la regla 12 (docs/convenciones.md): solo se usan los nombres
       que el cliente ya reconoce. Y esta es la única pieza de la marca que se
       ve FUERA del sitio —en un chat, al pegar el enlace—, o sea justo delante
       de quien todavía no sabe nada de nosotros. Es el peor sitio posible para
       una palabra que solo entiende un programador. -->
  <text x="80" y="452" font-family="Archivo" font-weight="400" font-size="26"
        fill="${STUDIO_GRAY}">Sitios web en Panamá · abren en menos de 1 s · desde $295</text>

  <!-- Pie -->
  <rect x="80" y="516" width="1040" height="1" fill="#FFFFFF" opacity="0.12"/>
  <text x="80" y="562" font-family="Archivo" font-weight="600" font-size="22"
        letter-spacing="2" fill="${FLASH_ORANGE}">CÓDIGO EN TU GITHUB</text>
  <text x="1120" y="562" text-anchor="end" font-family="Archivo" font-weight="400" font-size="22"
        fill="${STUDIO_GRAY}">Entrega en días, no en semanas</text>
</svg>`;
}

/* ------------------------------------------------------------------ *
 * El cepo: ¿este renderizador dibuja texto?
 * ------------------------------------------------------------------ */

/**
 * Renderiza dos veces la misma sonda —una con una palabra dentro y otra sin
 * ella— y exige que salgan distintas. Si salen idénticas, el renderizador no
 * está dibujando texto y todo lo que se genere después será una imagen bonita
 * y muda.
 *
 * POR QUÉ EXISTE. `og.png` es lo único de la marca que se ve FUERA del sitio:
 * es lo que aparece al pegar el enlace en un chat. Se publicó con un nombre de
 * marca que ya no era el nuestro durante dos renombrados seguidos sin que
 * nadie se enterara, porque nada comprueba lo que sale — el script imprime
 * «✓ Assets de marca generados» tanto si la imagen lleva el titular como si es
 * un degradado vacío.
 *
 * QUÉ LO DISPARA EN LA PRÁCTICA. El motor de SVG de sharp cambió: las
 * versiones con libvips ≥ 8.17 traen resvg en vez de librsvg, y resvg no
 * resuelve las fuentes por fontconfig, así que toda la instalación en
 * `~/.fonts` de aquí arriba deja de servirle. En una máquina así el script
 * corría entero y emitía un `og.png` sin una sola letra.
 *
 * Comprobado rompiéndolo: en un contenedor con resvg 0.47 las dos
 * renderizaciones salen byte a byte iguales y esto aborta.
 */
async function comprobarQueElRenderizadorDibujaTexto() {
  const sonda = (texto) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="60">` +
    `<rect width="240" height="60" fill="${DEEP_BLACK}"/>` +
    `<text x="8" y="42" font-family="Archivo" font-weight="700" font-size="30"` +
    ` fill="${SOFT_WHITE}">${texto}</text></svg>`;

  const render = (svg) => sharp(Buffer.from(svg), { density: 384 }).png().toBuffer();
  const [con, sin] = await Promise.all([render(sonda('PANACLAW')), render(sonda(''))]);

  if (!con.equals(sin)) return;

  console.error(`
✗ Este renderizador no está dibujando texto.

  Todo lo que se generara ahora saldría sin titular, sin marca y sin precio:
  un degradado vacío. Y el script no lo notaría.

  Causa habitual: el motor de SVG de sharp. Las versiones con libvips >= 8.17
  usan resvg, que NO resuelve las fuentes por fontconfig y por tanto ignora
  la instalación en ~/.fonts que hace este mismo script.

    aquí → resvg ${sharp.versions.resvg ?? '(ausente)'} · libvips ${sharp.versions.vips}

  Salida: correr esto donde sharp venga con librsvg (libvips < 8.17), o fijar
  esa versión de sharp en package.json.

  No se ha tocado ningún archivo de public/.
`);
  process.exit(1);
}

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */
async function main() {
  installFonts();
  mkdirSync(PUBLIC, { recursive: true });

  /*
   * LOS ICONOS NO SE REGENERAN POR DEFECTO, y esto no es una optimización.
   *
   * El `public/favicon.svg` que se sirve NO es el rayo que dibuja `iconSvg()`:
   * es la silueta real del logo, vectorizada con potrace a partir de
   * `brand-assets/logo-original.svg` y afinada a mano. El procedimiento está en
   * `brand-assets/README.md`. Los dos PNG salen de esa misma silueta.
   *
   * `iconSvg()` dibuja un rayo genérico que fue el marcador de posición hasta
   * que llegó el logo. Sigue aquí porque es la única forma de rehacer los
   * iconos si algún día cambia el tratamiento, pero correrlo sin querer
   * SUSTITUYE EL LOGO POR EL MARCADOR DE POSICIÓN — en silencio, y en tres
   * archivos a la vez. Pasó: `npm run brand` se corrió para arreglar el
   * `og.png` y se llevó por delante los tres iconos, que pasaron de 7.7 kB de
   * silueta a 2.0 kB de rayo sin que nada avisara.
   *
   * Así que el trabajo peligroso es el que hay que pedir:
   *
   *   npm run brand              → solo og.png
   *   npm run brand -- --iconos  → además, rehace los iconos desde el rayo
   *
   * Si algún día el rayo vuelve a ser la marca, esto se invierte. Mientras el
   * logo bueno viva en `public/` y no en este archivo, el que manda es el de
   * `public/`.
   */
  const rehacerIconos = process.argv.includes('--iconos');

  const jobs = [['og.png', ogSvg(), 1200]];

  if (rehacerIconos) {
    // favicon.svg — se sirve tal cual, sin rasterizar
    writeFileSync(join(PUBLIC, 'favicon.svg'), iconSvg(64));
    jobs.unshift(
      ['favicon-32.png', iconSvg(32), 32],
      ['apple-touch-icon.png', iconSvg(180, { rounded: false }), 180],
    );
  }

  await comprobarQueElRenderizadorDibujaTexto();

  for (const [name, svg, width] of jobs) {
    const buf = await sharp(Buffer.from(svg), { density: 384 })
      .resize({ width })
      .png({ compressionLevel: 9, palette: name !== 'og.png' })
      .toBuffer();
    writeFileSync(join(PUBLIC, name), buf);
    console.log(`· ${name} — ${(buf.length / 1024).toFixed(1)} kB`);
  }

  if (!rehacerIconos) {
    console.log('· iconos intactos (favicon.svg, favicon-32.png, apple-touch-icon.png)');
    console.log('  Para rehacerlos desde el rayo: npm run brand -- --iconos');
  }

  console.log('✓ Assets de marca generados en public/');
}

/*
 * Solo se ejecuta si a este archivo se le llama directamente. `ogSvg` se
 * exporta para poder mirarlo sin escribir en `public/` —comprobar el SVG antes
 * de rasterizarlo, o rasterizarlo con otro motor cuando el de sharp no dibuja
 * texto—, y sin este guardia importarlo dispararía la generación entera.
 */
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
