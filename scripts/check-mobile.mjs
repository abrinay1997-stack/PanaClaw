/**
 * Auditoría de layout en móvil, con números en vez de a ojo.
 *
 *   npm run build && npm run medir:movil
 *
 * Comprueba cuatro cosas sobre el sitio ya construido, en varios anchos:
 *
 *   A. El navbar queda centrado de verdad (márgenes iguales a izquierda y
 *      derecha) y no se sale de la pantalla.
 *   A2. El contenido del navbar cabe DENTRO de su pill. Es otra cosa que la A,
 *      y la diferencia costó tres desbordes: el pill puede estar centrado al
 *      píxel mientras sus enlaces se comprimen contra el CTA.
 *   B. Ninguna página tiene espacio muerto después del footer ni desborda
 *      horizontalmente.
 *   C. El footer no se come más pantallas de la cuenta.
 *   D. La burbuja del chat no tapa los enlaces legales.
 *
 * Los tres primeros nacieron de fallos reales: el navbar descentrado por debajo
 * de 1120px y un footer de 1580px que en un teléfono eran dos pantallas y media
 * de scroll. Se quedan aquí como cepo para que no vuelvan sin avisar.
 *
 * Sale con código 1 si algo falla, así que sirve tal cual en CI.
 *
 * PLAYWRIGHT NO ES DEPENDENCIA DEL PROYECTO a propósito: arrastra la descarga
 * de un navegador y encarecería cada build de Netlify para algo que solo se
 * corre a mano. El script lo busca instalado en el proyecto o en el sistema:
 *
 *   npm i -D playwright && npx playwright install chromium
 */
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { DIST, loadPlaywright, serveDist } from './_harness.mjs';

/* ------------------------------------------------------------------ *
 * Presupuestos. Son cepos, no aspiraciones: se fijan un pelo por encima
 * de lo que hoy se cumple, para que un empeoramiento salte y una mejora
 * obligue a bajarlos.
 * ------------------------------------------------------------------ */
const BUDGET = {
  navAsymmetryPx: 1, // diferencia tolerable entre margen izquierdo y derecho
  deadSpaceAfterFooterPx: 2,
  /*
   * En píxeles y no en "pantallas": el iPhone SE tiene 568px de alto y con esa
   * vara cualquier footer decente ya va por 2 pantallas, así que el umbral
   * quedaba pegado al valor real y saltaría por ruido. El footer llegó a medir
   * 1580px; hoy anda por 1249 en el peor teléfono (2026-08-11). 1300 separa las
   * dos cosas sin ambigüedad.
   *
   * Este cepo ya cobró una pieza: el séptimo enlace de la columna de Servicios
   * —Seguridad— subió el pie a 1337px en un iPhone SE, y de ahí salió el
   * recorte del respiro entre enlaces en `Footer.astro`. Es exactamente para lo
   * que está: un enlace de más no se ve en un escritorio de 1440px.
   */
  footerMaxPx: 1300,
  /*
   * Aire mínimo entre la marca y el primer enlace, y entre el último y el CTA.
   * 8px y no 14 —que es lo que hoy mide el peor caso— porque este cepo vigila
   * que el nav no se COMPRIMA, no el gusto tipográfico: apretarlo a 8 sería
   * feo, pasar de ahí es que ya no cabe.
   */
  navInnerMinGapPx: 8,
};

const NAV_WIDTHS = [320, 360, 390, 430, 768, 900, 1024, 1120, 1280, 1440, 1920];

/*
 * Anchos de A2: la franja donde el nav horizontal acaba de aparecer, que es
 * donde se rompe siempre. 1101 es el primer ancho en el que se despliega hoy;
 * los de abajo salen colapsados y se saltan solos, y siguen en la lista para
 * que el día que el colapso vuelva a bajar, esos anchos se midan sin que nadie
 * tenga que acordarse de añadirlos.
 */
const NAV_INNER_WIDTHS = [1001, 1024, 1060, 1080, 1101, 1140, 1180, 1280, 1440];
const PHONES = ['iPhone SE', 'iPhone 13', 'iPhone 14 Pro Max'];

/* ------------------------------------------------------------------ *
 * Comprobaciones
 * ------------------------------------------------------------------ */
const fails = [];
const fail = (msg) => fails.push(msg);
const mark = (ok) => (ok ? 'ok' : 'FALLA');

async function checkNav(browser, base) {
  console.log('\nA. Centrado del navbar');
  console.log('   ancho │   izq    der │  pill │');
  const page = await (await browser.newContext()).newPage();
  for (const w of NAV_WIDTHS) {
    await page.setViewportSize({ width: w, height: 800 });
    await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(120);
    const m = await page.evaluate(() => {
      const r = document.querySelector('.nav-pill').getBoundingClientRect();
      return {
        left: r.left,
        right: window.innerWidth - r.right,
        width: r.width,
        overflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    });
    const asym = Math.abs(m.left - m.right);
    const ok = asym <= BUDGET.navAsymmetryPx && m.left >= 0 && m.right >= 0 && !m.overflow;
    if (!ok) fail(`navbar descentrado a ${w}px (asimetría ${asym.toFixed(1)}px)`);
    console.log(
      `   ${String(w).padStart(5)} │ ${m.left.toFixed(1).padStart(5)} ${m.right.toFixed(1).padStart(6)} │` +
        ` ${m.width.toFixed(0).padStart(5)} │ ${mark(ok)}`
    );
  }
  await page.context().close();
}

/**
 * A2 · Lo que pasa DENTRO del pill.
 *
 * La comprobación A mide dónde está el pill; esta mide si su contenido cabe.
 * Son dos cosas distintas y la diferencia costó dos incidentes: con siete
 * enlaces el pill se desbordaba 18px a 901px, con el octavo llegó a 77px en toda
 * la franja 901–999, y con el noveno a 75px entre 1001 y 1079 — y las tres veces
 * A pasó en verde, porque el pill seguía perfectamente centrado mientras sus
 * enlaces se comprimían contra el CTA. `body{overflow-x:hidden}` se traga el
 * sobrante, así que tampoco se ve mirando la página.
 *
 * Los anchos son los de la franja donde el nav horizontal acaba de aparecer,
 * que es donde siempre se rompe: por encima sobra sitio y por debajo manda el
 * desplegable. Las medidas colapsadas se saltan, no se dan por buenas.
 */
async function checkNavInterior(browser, base) {
  console.log('\nA2. El contenido cabe dentro del pill (nav horizontal)');
  console.log('   ancho │ desborde │ holgura izq  der │');
  const page = await (await browser.newContext()).newPage();
  let medidos = 0;
  for (const w of NAV_INNER_WIDTHS) {
    await page.setViewportSize({ width: w, height: 800 });
    await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(120);
    const m = await page.evaluate(() => {
      const pill = document.querySelector('.nav-pill');
      const links = [...pill.querySelectorAll('.nav-links a')];
      const brand = pill.querySelector('.brand');
      const cta = pill.querySelector('.nav-cta');
      if (getComputedStyle(pill.querySelector('nav')).display === 'none' || !links.length) {
        return { colapsado: true };
      }
      const primero = links[0].getBoundingClientRect();
      const ultimo = links[links.length - 1].getBoundingClientRect();
      return {
        colapsado: false,
        desborde: Math.round(pill.scrollWidth - pill.getBoundingClientRect().width),
        izq: Math.round(primero.left - brand.getBoundingClientRect().right),
        der: cta ? Math.round(cta.getBoundingClientRect().left - ultimo.right) : 999,
      };
    });

    if (m.colapsado) {
      console.log(`   ${String(w).padStart(5)} │ colapsado — manda el desplegable`);
      continue;
    }
    medidos++;
    const holgura = Math.min(m.izq, m.der);
    const ok = m.desborde <= 0 && holgura >= BUDGET.navInnerMinGapPx;
    if (!ok)
      fail(
        `el nav se sale de su pill a ${w}px (${m.desborde}px de sobra, holgura mínima ${holgura}px): ` +
          'sobra un enlace o falta subir el ancho al que colapsa'
      );
    console.log(
      `   ${String(w).padStart(5)} │ ${String(m.desborde).padStart(8)} │ ${String(m.izq).padStart(11)} ${String(m.der).padStart(4)} │ ${mark(ok)}`
    );
  }

  /*
   * Si TODOS los anchos salen colapsados, esta comprobación no ha comprobado
   * nada y no puede pasar en verde: sería exactamente el adorno que este
   * proyecto ya se comió dos veces.
   */
  if (medidos === 0)
    fail('A2 no midió ni un ancho con el nav horizontal desplegado: la comprobación no vigila nada');

  await page.context().close();
}

async function checkPages(browser, base, pages) {
  console.log('\nB. Espacio tras el footer y desborde horizontal (iPhone 13)');
  const { devices } = await loadPlaywright();
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await ctx.newPage();
  for (const p of pages) {
    await page.goto(`${base}/${p}`, { waitUntil: 'load' });
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => {
      const d = document.documentElement;
      const f = document.querySelector('footer');
      const fb = f ? f.getBoundingClientRect().bottom + window.scrollY : d.scrollHeight;
      return {
        dead: Math.round(d.scrollHeight - fb),
        overflow: d.scrollWidth > window.innerWidth,
      };
    });
    const ok = r.dead <= BUDGET.deadSpaceAfterFooterPx && !r.overflow;
    if (!ok)
      fail(`${p}: ${r.dead}px tras el footer${r.overflow ? ' + desborda horizontalmente' : ''}`);
    console.log(
      `   ${p.padEnd(16)} muerto:${String(r.dead).padStart(4)}px  desborde:${r.overflow ? 'SÍ' : 'no'}  ${mark(ok)}`
    );
  }
  await ctx.close();
}

async function checkFooter(browser, base) {
  console.log('\nC. Peso del footer  ·  D. Burbuja del chat sobre los enlaces legales');
  const { devices } = await loadPlaywright();
  for (const name of PHONES) {
    const ctx = await browser.newContext({ ...devices[name] });
    const page = await ctx.newPage();
    await page.goto(`${base}/`, { waitUntil: 'load' });
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const f = document.querySelector('footer').getBoundingClientRect();
      const fab = document.querySelector('.chat')?.getBoundingClientRect();
      const legal = document.querySelector('.foot-legal')?.getBoundingClientRect();
      const hit =
        fab && legal
          ? !(
              fab.right < legal.left ||
              fab.left > legal.right ||
              fab.bottom < legal.top ||
              fab.top > legal.bottom
            )
          : false;
      return { h: Math.round(f.height), screens: f.height / window.innerHeight, hit };
    });
    const okH = r.h <= BUDGET.footerMaxPx;
    const okOverlap = !r.hit;
    if (!okH) fail(`footer de ${r.h}px en ${name} (tope ${BUDGET.footerMaxPx}px)`);
    if (!okOverlap) fail(`la burbuja del chat tapa los enlaces legales en ${name}`);
    console.log(
      `   ${name.padEnd(20)} ${String(r.h).padStart(5)}px  ${r.screens.toFixed(2)} pantallas ${mark(okH)}` +
        `   ·  solape: ${r.hit ? 'SÍ' : 'no'} ${mark(okOverlap)}`
    );
    await ctx.close();
  }
}

async function checkChat(browser, base) {
  console.log('\nE. Panel del chat abierto, dentro de la pantalla');
  const { devices } = await loadPlaywright();

  /*
   * El último escenario no es un teléfono: es un viewport estrecho con canal de
   * barra de scroll reservado, de forma que el ancho utilizable queda por debajo
   * de lo que miden las unidades de viewport.
   *
   * Está aquí porque el fallo del panel apareció en Safari de iOS y Chromium no
   * lo reproducía: allí `100vw` no siempre coincide con lo que se ve. Sin este
   * caso, la comprobación pasaba igual con el código roto y no servía de nada.
   */
  const cases = [
    ...PHONES.map((n) => ({ name: n, opts: { ...devices[n] }, gutter: false })),
    { name: 'desajuste de 100vw', opts: { viewport: { width: 500, height: 700 } }, gutter: true },
  ];

  for (const c of cases) {
    const name = c.name;
    const ctx = await browser.newContext(c.opts);
    const page = await ctx.newPage();
    // En /proceso, que es donde apareció el fallo: el panel se abre sobre una
    // página larga y con el nav flotante encima.
    await page.goto(`${base}/proceso/`, { waitUntil: 'load' });
    if (c.gutter) {
      await page.addStyleTag({
        content:
          'html{scrollbar-gutter:stable both-edges;overflow-y:scroll}' +
          '::-webkit-scrollbar{width:16px;background:#333}',
      });
    }
    await page.waitForTimeout(400);
    await page.click('.chat-launcher');
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const p = document.querySelector('.chat-panel').getBoundingClientRect();
      // Lo que de verdad duele es que se corten los controles, no el borde.
      const out = [];
      for (const el of document.querySelectorAll('.chat-panel *')) {
        const b = el.getBoundingClientRect();
        if (b.width > 0 && (b.right > vw + 0.5 || b.left < -0.5)) {
          out.push(el.className ? String(el.className).trim().split(/\s+/)[0] : el.tagName);
        }
      }
      return {
        gapL: Math.round(p.left),
        gapR: Math.round(vw - p.right),
        w: Math.round(p.width),
        fitsV: p.top >= -0.5 && p.bottom <= vh + 0.5,
        cut: [...new Set(out)].slice(0, 4),
      };
    });
    const ok = Math.abs(r.gapL - r.gapR) <= 1 && r.gapL >= 0 && r.gapR >= 0 && r.cut.length === 0 && r.fitsV;
    if (!ok) {
      fail(
        `chat en ${name}: márgenes ${r.gapL}/${r.gapR}px` +
          (r.cut.length ? `, se cortan: ${r.cut.join(', ')}` : '') +
          (r.fitsV ? '' : ', no cabe de alto')
      );
    }
    console.log(
      `   ${name.padEnd(20)} ancho ${String(r.w).padStart(4)}  izq ${String(r.gapL).padStart(3)}  der ${String(r.gapR).padStart(3)}` +
        `  cortados:${r.cut.length}  ${mark(ok)}`
    );
    await ctx.close();
  }
}

/* ------------------------------------------------------------------ */
async function main() {
  try {
    await stat(DIST);
  } catch {
    console.error('No existe dist/. Corre `npm run build` antes.');
    process.exit(2);
  }

  const { chromium } = await loadPlaywright();
  const { server, port } = await serveDist();
  const base = `http://127.0.0.1:${port}`;

  /**
   * Las páginas se descubren recorriendo dist/, no listando su raíz.
   *
   * Antes esto era un `readdir` plano filtrando `.html`, y funcionaba porque
   * cada página era un archivo suelto (`contacto.html`). Al pasar a URLs de
   * directorio (`contacto/index.html`) ese filtro siguió sin fallar:
   * simplemente dejó de encontrar diez de las doce páginas, y la comprobación
   * de espacio muerto pasó en verde midiendo solo la home y el 404. Un
   * verificador que se queda sin sujetos y no protesta es peor que no tenerlo,
   * así que abajo se exige un mínimo.
   */
  const { readdir } = await import('node:fs/promises');
  async function findPages(dir = DIST, prefix = '') {
    const found = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name === '_astro') continue;
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) found.push(...(await findPages(join(dir, entry.name), rel)));
      else if (entry.name.endsWith('.html')) found.push(rel);
    }
    return found;
  }
  const pages = (await findPages()).sort();
  /*
   * Suelo, no cuenta exacta: el sitio crece y esto no debería pedir
   * mantenimiento cada vez que se añade una página. Lo que vigila es la caída
   * brusca — si el descubrimiento se vuelve a romper, devolverá dos o tres, no
   * once.
   */
  const MINIMO_PAGINAS = 10;
  if (pages.length < MINIMO_PAGINAS) {
    console.error(
      `Solo se encontraron ${pages.length} páginas en dist/, menos del mínimo ` +
        `esperado (${MINIMO_PAGINAS}). El descubrimiento está roto: no te fíes de este informe.`,
    );
    process.exitCode = 1;
  }

  const browser = await chromium.launch();
  try {
    await checkNav(browser, base);
    await checkNavInterior(browser, base);
    await checkPages(browser, base, pages);
    await checkFooter(browser, base);
    await checkChat(browser, base);
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n' + '─'.repeat(60));
  if (fails.length === 0) {
    console.log('✅ Todo dentro de presupuesto.');
  } else {
    console.log(`❌ ${fails.length} problema(s):`);
    for (const f of fails) console.log(`   · ${f}`);
  }
  process.exit(fails.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
