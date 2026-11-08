// Las flechas de la galería de /proyectos/ recorren todos los sitios, de ida y vuelta, en celular y escritorio.
// Falló en el iPhone (avanzaba una vez y se atascaba) y esto lo vigila. Uso: npm run medir:galeria
import { loadPlaywright, serveDist } from './_harness.mjs';

const pw = await loadPlaywright();
const { server, port } = await serveDist();
const b = await pw.chromium.launch();
const fallos = [];
for (const [nombre, opts, toca] of [
  ['iPhone 13', pw.devices['iPhone 13'], true],
  ['escritorio', { viewport: { width: 1440, height: 900 } }, false],
]) {
  const p = await (await b.newContext(opts)).newPage();
  await p.goto(`http://localhost:${port}/proyectos/`);
  await p.evaluate(() => document.getElementById('trabajo').scrollIntoView());
  await p.waitForTimeout(600);
  const total = await p.locator('[data-galeria-pista] > li').count();
  const leer = () => p.evaluate(() => document.querySelector('[data-galeria-count]').textContent.trim());
  const pulsar = (sel) => (toca ? p.locator(sel).tap() : p.locator(sel).click());
  for (let i = 1; i < total; i++) {
    await pulsar('[data-galeria="1"]');
    await p.waitForTimeout(750);
    const c = await leer();
    if (c !== `${i + 1} / ${total}`) fallos.push(`${nombre}: al avanzar ${i} veces dice «${c}», debía decir «${i + 1} / ${total}»`);
  }
  for (let i = total - 1; i > 0; i--) {
    await pulsar('[data-galeria="-1"]');
    await p.waitForTimeout(750);
    const c = await leer();
    if (c !== `${i} / ${total}`) fallos.push(`${nombre}: al retroceder dice «${c}», debía decir «${i} / ${total}»`);
  }
  console.log(`${fallos.length ? '✗' : '✓'} ${nombre}: ${total} sitios, ida y vuelta`);
}
await b.close();
server.close();
if (fallos.length) {
  console.error(`\n❌ ${fallos.length} problema(s):\n${fallos.map((f) => '   · ' + f).join('\n')}`);
  process.exit(1);
}
console.log('\n✓ La galería avanza y retrocede completa.');
process.exit(0);
