/**
 * Auditoría del chat, con números en vez de a ojo.
 *
 *   npm run build && npm run medir:chat
 *
 * Nació de una captura de iPhone (8-nov-2026): el chat se abría con la página
 * ampliada y recortado por la derecha. La causa era doble —el campo de texto
 * medía 14,5 px y Safari amplía la página al enfocar uno de menos de 16 px, y el
 * código lo enfocaba solo al abrir—. Aquí se quedan los cepos para que no vuelva.
 *
 *   A. TELÉFONO (iPhone SE, 13, 14 Pro Max y Pixel 7, emulados). Al abrir el chat:
 *      el panel cabe entero en la pantalla, la página no desborda de lado, el
 *      campo mide 16 px o más, el teclado NO se abre solo, los botones táctiles
 *      miden 44 px, la página de atrás queda bloqueada, y arrastrar la cabecera
 *      hacia abajo lo cierra.
 *   B. ESCRITORIO. El panel se puede mover, no se sale de la ventana, el doble clic
 *      lo devuelve a su sitio, se agranda, y la rueda sobre la conversación mueve
 *      la conversación y NO la página.
 *   C. LA GUÍA. «Ayúdame a elegir» lleva a donde dice; ir a una sección de la
 *      misma página se desplaza hasta ella y la marca.
 *   D. LOS DESTINOS. Cada pregunta de arranque recupera un hecho que lleva a una
 *      página, y cada ancla a la que apunta el chat existe de verdad en esa página.
 *
 * LO QUE ESTO NO PUEDE HACER: Chromium emulando un iPhone no reproduce el zoom
 * automático de Safari. Lo que sí vigila es la causa documentada (tamaño de
 * letra del campo y foco automático). El resultado real hay que verlo en un
 * iPhone después de desplegar.
 *
 * Sale con código 1 si algo falla, así que sirve tal cual en CI.
 */
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DIST, ROOT, loadPlaywright, serveDist } from './_harness.mjs';

const fails = [];
const fail = (msg) => fails.push(msg);
const ok = (cond, msg) => {
  if (!cond) fail(msg);
  return cond;
};

const TELEFONOS = ['iPhone SE', 'iPhone 13', 'iPhone 14 Pro Max', 'Pixel 7'];
const PAGINAS = ['/', '/planes/', '/ebot/'];

async function abrir(page) {
  await page.click('[data-chat-toggle]');
  await page.waitForSelector('[data-chat-panel]:not([hidden])');
  await page.waitForTimeout(450); // la animación de entrada
}

/* ------------------------------------------------------------------ *
 * A. Teléfono
 * ------------------------------------------------------------------ */
async function checkTelefonos(browser, playwright, base) {
  console.log('\nA. Chat en teléfono');
  for (const nombre of TELEFONOS) {
    const dev = playwright.devices[nombre];
    if (!dev) {
      fail(`Playwright no conoce el dispositivo «${nombre}»`);
      continue;
    }
    const ctx = await browser.newContext({ ...dev, reducedMotion: 'no-preference' });
    for (const ruta of PAGINAS) {
      const page = await ctx.newPage();
      await page.goto(`${base}${ruta}`, { waitUntil: 'load' });
      await abrir(page);
      const m = await page.evaluate(() => {
        const panel = document.querySelector('[data-chat-panel]');
        const r = panel.getBoundingClientRect();
        const input = document.querySelector('[data-chat-input]');
        const alto = (el) => (el ? el.getBoundingClientRect().height : 0);
        const visibles = (sel) => [...document.querySelectorAll(sel)].filter((e) => e.offsetParent !== null);
        const chicos = [
          ...visibles('.chat-icon-btn'),
          ...visibles('.chat-send'),
          ...visibles('.chat-chip'),
        ].filter((e) => e.getBoundingClientRect().height < 44);
        return {
          left: r.left,
          right: r.right,
          top: r.top,
          bottom: r.bottom,
          vw: window.innerWidth,
          vh: window.innerHeight,
          desborde: document.documentElement.scrollWidth - window.innerWidth,
          fuente: parseFloat(getComputedStyle(input).fontSize),
          foco: document.activeElement === input,
          bloqueo: document.documentElement.classList.contains('chat-bloqueo'),
          fondo: !document.querySelector('[data-chat-backdrop]').hidden,
          chicos: chicos.map((e) => `${e.className.toString().split(' ')[0] || e.tagName}(${Math.round(alto(e))}px)`),
        };
      });
      const etiqueta = `${nombre} ${ruta}`;
      ok(m.left >= -0.5 && m.right <= m.vw + 0.5, `${etiqueta}: el panel se sale de la pantalla de lado (${m.left.toFixed(0)}→${m.right.toFixed(0)} de ${m.vw})`);
      ok(m.top >= -0.5 && m.bottom <= m.vh + 0.5, `${etiqueta}: el panel se sale de la pantalla en vertical (${m.top.toFixed(0)}→${m.bottom.toFixed(0)} de ${m.vh})`);
      ok(m.desborde <= 0, `${etiqueta}: la página desborda ${m.desborde}px de lado con el chat abierto`);
      ok(m.fuente >= 16, `${etiqueta}: el campo mide ${m.fuente}px; menos de 16 y Safari amplía la página al enfocarlo`);
      ok(!m.foco, `${etiqueta}: el campo se enfocó solo al abrir (en táctil abre el teclado y amplía)`);
      ok(m.bloqueo, `${etiqueta}: la página de atrás no se bloquea con el chat abierto`);
      ok(m.fondo, `${etiqueta}: no hay fondo oscuro tras la hoja`);
      ok(m.chicos.length === 0, `${etiqueta}: botones táctiles de menos de 44px: ${m.chicos.join(', ')}`);
      console.log(
        `   ${nombre.padEnd(18)} ${ruta.padEnd(9)} panel ${m.left.toFixed(0)}→${m.right.toFixed(0)}/${m.vw}` +
          ` · letra ${m.fuente}px · teclado ${m.foco ? 'SE ABRE' : 'no'} · botones<44: ${m.chicos.length}`
      );

      // Arrastrar la cabecera hacia abajo cierra la hoja.
      if (ruta === '/') {
        const h = await page.locator('[data-chat-head]').boundingBox();
        await page.mouse.move(h.x + h.width / 2, h.y + 12);
        await page.mouse.down();
        await page.mouse.move(h.x + h.width / 2, h.y + 160, { steps: 8 });
        await page.mouse.up();
        await page.waitForTimeout(150);
        const cerrado = await page.evaluate(() => document.querySelector('[data-chat-panel]').hidden);
        ok(cerrado, `${nombre}: arrastrar la cabecera hacia abajo no cierra el chat`);
        const sigueBloqueada = await page.evaluate(() => document.documentElement.classList.contains('chat-bloqueo'));
        ok(!sigueBloqueada, `${nombre}: al cerrar el chat la página sigue bloqueada`);
      }
      await page.close();
    }
    await ctx.close();
  }
}

/* ------------------------------------------------------------------ *
 * B. Escritorio
 * ------------------------------------------------------------------ */
async function checkEscritorio(browser, base) {
  console.log('\nB. Chat en escritorio');
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${base}/`, { waitUntil: 'load' });
  await abrir(page);

  const rect = () =>
    page.evaluate(() => {
      const r = document.querySelector('[data-chat-panel]').getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height, r: r.right, b: r.bottom };
    });
  const r0 = await rect();
  ok(
    await page.evaluate(() => document.activeElement === document.querySelector('[data-chat-input]')),
    'escritorio: al abrir, el cursor no queda en el campo (con ratón sí debe)'
  );

  // Mover.
  const h = await page.locator('[data-chat-head]').boundingBox();
  await page.mouse.move(h.x + 60, h.y + 12);
  await page.mouse.down();
  await page.mouse.move(h.x - 140, h.y - 90, { steps: 8 });
  await page.mouse.up();
  const r1 = await rect();
  ok(Math.abs(r1.x - (r0.x - 200)) < 3 && Math.abs(r1.y - (r0.y - 102)) < 3, `escritorio: arrastrar no mueve el panel lo esperado (${r0.x.toFixed(0)},${r0.y.toFixed(0)} → ${r1.x.toFixed(0)},${r1.y.toFixed(0)})`);

  // No se sale de la ventana aunque se arrastre muy lejos.
  const h2 = await page.locator('[data-chat-head]').boundingBox();
  await page.mouse.move(h2.x + 60, h2.y + 12);
  await page.mouse.down();
  await page.mouse.move(-2000, -2000, { steps: 10 });
  await page.mouse.up();
  const r2 = await rect();
  ok(r2.x >= 7 && r2.y >= 7, `escritorio: el panel se sale por arriba o por la izquierda (${r2.x.toFixed(0)},${r2.y.toFixed(0)})`);
  const h3 = await page.locator('[data-chat-head]').boundingBox();
  await page.mouse.move(h3.x + 60, h3.y + 12);
  await page.mouse.down();
  await page.mouse.move(5000, 5000, { steps: 10 });
  await page.mouse.up();
  const r3 = await rect();
  ok(r3.r <= 1440 - 7 && r3.b <= 900 - 7, `escritorio: el panel se sale por abajo o por la derecha (${r3.r.toFixed(0)},${r3.b.toFixed(0)})`);

  // Doble clic: vuelve a su sitio.
  const h4 = await page.locator('[data-chat-head]').boundingBox();
  await page.mouse.dblclick(h4.x + 60, h4.y + 12);
  const r4 = await rect();
  ok(Math.abs(r4.x - r0.x) < 2 && Math.abs(r4.y - r0.y) < 2, `escritorio: el doble clic no devuelve el panel a su sitio (${r4.x.toFixed(0)},${r4.y.toFixed(0)} vs ${r0.x.toFixed(0)},${r0.y.toFixed(0)})`);

  // Agrandar.
  await page.click('[data-chat-expand]');
  await page.waitForTimeout(100);
  const r5 = await rect();
  ok(r5.w > r0.w + 100, `escritorio: «Agrandar» no agranda (${r0.w.toFixed(0)} → ${r5.w.toFixed(0)})`);
  await page.click('[data-chat-expand]');

  // La rueda sobre la conversación mueve la conversación, no la página.
  await page.evaluate(() => {
    const log = document.querySelector('[data-chat-log]');
    for (let i = 0; i < 14; i++) {
      const d = document.createElement('div');
      d.className = 'chat-msg is-bot';
      d.innerHTML = '<p>Mensaje de relleno para que la conversación tenga que desplazarse.</p>';
      log.appendChild(d);
    }
    log.scrollTop = 0;
  });
  const rl = await page.locator('[data-chat-log]').boundingBox();
  await page.mouse.move(rl.x + rl.width / 2, rl.y + rl.height / 2);
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(700);
  const rueda = await page.evaluate(() => ({
    log: document.querySelector('[data-chat-log]').scrollTop,
    pagina: window.scrollY,
  }));
  ok(rueda.log > 0, 'escritorio: la rueda sobre el chat no mueve la conversación');
  ok(rueda.pagina === 0, `escritorio: la rueda sobre el chat desplazó la página de atrás (${rueda.pagina}px)`);
  console.log(
    `   panel ${r0.w.toFixed(0)}×${r0.h.toFixed(0)} · mover ok · límites ok · reset ok · agrandar ${r5.w.toFixed(0)}px · rueda: chat ${rueda.log.toFixed(0)}px, página ${rueda.pagina}px`
  );

  // Escape cierra.
  await page.keyboard.press('Escape');
  ok(await page.evaluate(() => document.querySelector('[data-chat-panel]').hidden), 'escritorio: Escape no cierra el chat');
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * C. La guía
 * ------------------------------------------------------------------ */
async function checkGuia(browser, playwright, base) {
  console.log('\nC. La guía');
  const dev = playwright.devices['iPhone 13'];
  const ctx = await browser.newContext({ ...dev });
  const page = await ctx.newPage();
  await page.goto(`${base}/planes/`, { waitUntil: 'load' });
  await abrir(page);

  await page.click('[data-chat-elegir]');
  const n = await page.locator('[data-chat-necesidad]').count();
  ok(n >= 5, `guía: «Ayúdame a elegir» ofrece ${n} opciones (se esperan 5 o más)`);
  await page.locator('[data-chat-necesidad]', { hasText: 'Una web nueva' }).click();
  const acciones = await page.locator('.chat-action').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
  ok(acciones.some((h) => h.includes('/cotizador/')), `guía: «Una web nueva» no lleva al cotizador (${acciones.join(', ')})`);
  ok(acciones.some((h) => h.includes('/planes/#planes')), `guía: «Una web nueva» no lleva a los planes (${acciones.join(', ')})`);

  // Ir a una sección de ESTA página: el chat se pliega, se desplaza y se marca.
  const y0 = await page.evaluate(() => window.scrollY);
  await page.locator('.chat-action', { hasText: 'Ver los 4 planes' }).click();
  await page.waitForTimeout(1300);
  const t = await page.evaluate(() => ({
    cerrado: document.querySelector('[data-chat-panel]').hidden,
    y: window.scrollY,
    bloqueo: document.documentElement.classList.contains('chat-bloqueo'),
    top: document.getElementById('planes')?.getBoundingClientRect().top,
  }));
  ok(t.cerrado, 'guía: ir a una sección de la misma página no pliega el chat en teléfono');
  ok(!t.bloqueo, 'guía: tras plegar el chat, la página sigue bloqueada');
  ok(t.top !== undefined && Math.abs(t.top) < 160, `guía: no llegó a #planes (queda a ${t.top}px del borde)`);
  console.log(`   «Ayúdame a elegir» ${n} opciones · ir a #planes: chat plegado, scroll ${y0}→${t.y}px`);

  // Una sección lejana de la misma página (como las que manda el servidor): se desplaza y se marca.
  await page.click('[data-chat-toggle]');
  await page.waitForSelector('[data-chat-panel]:not([hidden])');
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const a = document.createElement('a');
    a.className = 'chat-action';
    a.setAttribute('data-chat-ir', '');
    a.href = '/planes/#modulos';
    a.textContent = 'Ver las capacidades';
    const caja = document.createElement('div');
    caja.className = 'chat-msg is-bot';
    caja.appendChild(a);
    document.querySelector('[data-chat-log]').appendChild(caja);
  });
  const antes = await page.evaluate(() => window.scrollY);
  await page.locator('.chat-action', { hasText: 'Ver las capacidades' }).click();
  await page.waitForTimeout(300);
  const marcada = await page.evaluate(() => document.getElementById('modulos')?.classList.contains('chat-destino'));
  await page.waitForTimeout(1200);
  const lejos = await page.evaluate(() => ({ y: window.scrollY, top: document.getElementById('modulos')?.getBoundingClientRect().top }));
  ok(lejos.y > antes + 300, `guía: ir a #modulos no desplazó la página (${antes}→${lejos.y}px)`);
  ok(marcada, 'guía: la sección de destino no se marca (clase chat-destino)');
  ok(Math.abs(lejos.top) < 200, `guía: #modulos quedó a ${lejos.top}px del borde superior`);
  console.log(`   ir a #modulos: scroll ${antes}→${lejos.y}px, sección marcada`);

  // Ir a otra página.
  await page.click('[data-chat-toggle]');
  await page.waitForSelector('[data-chat-panel]:not([hidden])');
  await page.waitForTimeout(400);
  const verProyectos = page.locator('[data-chat-guia] a', { hasText: 'Ver proyectos' });
  await verProyectos.click();
  await page.waitForURL('**/proyectos/', { timeout: 5000 });
  const plegado = await page.evaluate(() => document.querySelector('[data-chat-panel]').hidden);
  ok(plegado, 'guía: al ir a otra página en teléfono, el chat no se pliega y tapa el contenido');
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * D. Los destinos
 * ------------------------------------------------------------------ */
async function checkDestinos() {
  console.log('\nD. Destinos del chat');
  const kb = JSON.parse(await readFile(join(DIST, 'kb.json'), 'utf8'));
  const { retrieve } = await import(pathToFileURL(join(ROOT, 'worker/retrieval.ts')).href);
  const { destinoDe, accionesDe } = await import(pathToFileURL(join(ROOT, 'worker/chat.ts')).href);

  // Las preguntas de arranque, tal como están escritas en el widget.
  const fuente = await readFile(join(ROOT, 'src/components/ChatWidget.astro'), 'utf8');
  const bloque = fuente.slice(fuente.indexOf('const base = ['), fuente.indexOf('const claves = Object.keys(porPagina)'));
  const preguntas = [...new Set([...bloque.matchAll(/'([^']*\?)'/g)].map((m) => m[1]))];
  ok(preguntas.length >= 8, `destinos: solo se encontraron ${preguntas.length} preguntas de arranque en el widget`);

  /*
   * Qué hecho debe aparecer ENTRE LOS DOS PRIMEROS para cada pregunta, y que el
   * PRIMERO lleve al botón correcto. La recuperación es por palabras, no por
   * sentido: «¿Qué incluye cada plan?» devolvía hechos de seguridad (la palabra
   * «incluye» pesa más que «plan»), así que cada pregunta de arranque se
   * escribió comprobándola aquí.
   */
  const ESPERADO = {
    '¿Cuánto cuesta un sitio?': /^(plan|planes)/,
    '¿Tienen un agente de IA para WhatsApp?': /^ebot/,
    '¿Qué es eBot?': /^ebot/,
    '¿Cuánto cuesta eBot?': /^ebot/,
    '¿Qué pasa si el agente contesta mal?': /^ebot/,
    '¿Qué incluye la auditoría?': /^seguridad/,
    '¿Qué incluye el mantenimiento?': /^care/,
    '¿Qué planes tienen?': /^(plan|planes)/,
    '¿Qué no incluye el precio?': /^(plan|planes)/,
    '¿Cómo funciona el cotizador?': /^cotizador/,
    '¿En cuánto tiempo lo entregan?': /^plazos/,
    '¿El código es mío?': /^propiedad/,
  };
  for (const q of preguntas) {
    const top = retrieve(kb, q).slice(0, 2);
    const acciones = accionesDe(top);
    ok(top.length > 0, `destinos: «${q}» no recupera ningún hecho`);
    ok(acciones.length > 0, `destinos: «${q}» recupera ${top.map((f) => f.id).join(', ')} pero ninguno lleva a una página`);
    const esp = ESPERADO[q];
    if (esp) ok(top.some((f) => esp.test(f.id)), `destinos: «${q}» debía recuperar ${esp} y recuperó ${top.map((f) => f.id).join(', ')}`);
    console.log(`   ${q.padEnd(42)} → ${top.map((f) => f.id).join(', ')}  ⇒  ${acciones.map((a) => a.href).join('  ')}`);
  }

  // Cada ancla a la que apunta el chat existe en su página.
  const hrefs = new Set();
  for (const f of kb.facts) {
    const a = destinoDe(f);
    if (a) hrefs.add(a.href);
  }
  for (const m of fuente.matchAll(/ancla\(rutas\.(\w+), '(#[\w-]+)'\)/g)) hrefs.add(`/${m[1]}/${m[2]}`);
  for (const href of hrefs) {
    const [ruta, hash] = href.split('#');
    let html;
    try {
      html = await readFile(join(DIST, ruta, 'index.html'), 'utf8');
    } catch {
      fail(`destinos: ${href} apunta a una página que no existe`);
      continue;
    }
    if (hash) ok(html.includes(`id="${hash}"`), `destinos: ${href} apunta a un #${hash} que no existe en esa página`);
  }
  console.log(`   ${hrefs.size} destinos distintos, todos con su página y su ancla`);
}

/* ------------------------------------------------------------------ */

async function main() {
  try {
    await stat(DIST);
  } catch {
    console.error('No existe dist/. Corre `npm run build` antes.');
    process.exit(2);
  }
  const playwright = await loadPlaywright();
  const { server, port } = await serveDist();
  const base = `http://127.0.0.1:${port}`;
  const browser = await playwright.chromium.launch(
    process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {}
  );
  try {
    await checkTelefonos(browser, playwright, base);
    await checkEscritorio(browser, base);
    await checkGuia(browser, playwright, base);
    await checkDestinos();
  } finally {
    await browser.close();
    server.close();
  }

  if (fails.length) {
    console.error(`\n✗ ${fails.length} fallo(s):`);
    for (const f of fails) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log('\n✓ El chat cumple todo.');
}

main();
