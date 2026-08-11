/**
 * Auditoría del cotizador, en un navegador de verdad.
 *
 *   npm run build && npm run medir:cotizador
 *
 * Existe por un fallo concreto: el envío final abría WhatsApp con
 * `window.open(url, '_blank', 'noopener')` y usaba el valor devuelto para
 * decidir si esta pestaña se iba a /gracias/. Esa llamada devuelve null
 * SIEMPRE, así que el recorrido terminaba en dos pestañas de WhatsApp y ni un
 * solo `Lead` contado — y el código parecía correcto leyéndolo. Se dio por
 * comprobado durante semanas. La respuesta a eso no es leer con más cuidado,
 * es este script.
 *
 * Lo que vigila:
 *
 *   A. El envío termina en /gracias/ —el único punto donde el píxel cuenta una
 *      conversión— y abre UNA sola pestaña de WhatsApp.
 *   B. "Ninguna de estas" desmarca lo que hay marcado, en vez de solo avanzar.
 *   C. La cifra no cambia por el camino: el total corriente, el del resultado y
 *      el del mensaje de WhatsApp son el mismo número. Se comprueban LAS DOS
 *      cifras —la de una vez y la mensual— por separado: desde que existe el
 *      servicio de seguridad, un cotizador que sumara la mensualidad al total
 *      pasaría igual esta comprobación si solo se mirara un número.
 *   D. El precio de cada plan en el cotizador es el que dice /planes. Un
 *      cotizador que diga un número distinto destruye justo la confianza que el
 *      sitio vende.
 *   E. Lo que el plan ya trae sale apagado y no se puede marcar — y nada
 *      bloqueado queda marcado, que encerraría a la persona en el plan caro.
 *   F. Cada etiqueta mueve el total exactamente lo que anuncia, para las 12
 *      capacidades y los 4 planes — y la parte mensual de una etiqueta mueve el
 *      total mensual, nunca el otro. Es la comprobación que de verdad importa:
 *      mientras pase, ninguna etiqueta del cotizador puede mentir.
 *   G. `prefers-reduced-motion` apaga el scroll animado — midiendo también el
 *      caso contrario, para que la comprobación no pase por accidente.
 *   H. Desde el resultado se puede corregir una respuesta sin perder las otras.
 *
 * Sale con código 1 si algo falla, así que sirve tal cual en CI.
 *
 * PLAYWRIGHT NO ES DEPENDENCIA DEL PROYECTO a propósito:
 *
 *   npm i -D playwright && npx playwright install chromium
 */
import { stat } from 'node:fs/promises';
import { DIST, loadPlaywright, serveDist } from './_harness.mjs';

const fails = [];
const fail = (msg) => fails.push(msg);
const mark = (ok) => (ok ? 'ok' : 'FALLA');

/* ------------------------------------------------------------------ *
 * Recorrer el cotizador
 * ------------------------------------------------------------------ */

/** Índice del paso visible, leído de la propia página y no supuesto. */
async function pasoActual(page) {
  const txt = await page.locator('[data-count]').textContent();
  return Number(txt.match(/Paso (\d+)/)[1]) - 1;
}

/**
 * Se pulsa la ETIQUETA, no la casilla.
 *
 * Las casillas miden 1×1 y son transparentes; lo que pulsa una persona es la
 * tarjeta entera. Forzar el clic sobre el input se saltaba justo eso —y de paso
 * daba carreras con la hidratación, porque el radio nativo cambia de estado
 * aunque el script todavía no esté enganchado.
 */
const tarjeta = (page, value) => page.locator(`label.cot-opt:has(input[value="${value}"])`);

async function marcar(page, value) {
  if (!(await page.locator(`input[value="${value}"]`).isChecked())) await tarjeta(page, value).click();
}

async function desmarcar(page, value) {
  if (await page.locator(`input[value="${value}"]`).isChecked()) await tarjeta(page, value).click();
}

/** Hasta que el script no engancha, la página es HTML muerto: esperar a eso. */
async function abrirCotizador(page, base) {
  await page.goto(`${base}/cotizador/`, { waitUntil: 'load' });
  await page.waitForSelector('[data-quote][data-bound="true"]', { timeout: 5000 });
}

async function siguiente(page) {
  const i = await pasoActual(page);
  await page.locator('.cot-step').nth(i).locator('button[data-next]').click();
}

async function ninguna(page) {
  const i = await pasoActual(page);
  await page.locator('.cot-step').nth(i).locator('button[data-skip]').click();
}

const totales = (t) => t.replace(/\s+/g, ' ').trim();

/**
 * Las dos cifras que enseña el cotizador: la de una vez y la de cada mes.
 *
 * Se leen de nodos distintos a propósito. Mientras vivieron en el mismo texto
 * —«$375 y $45/mes»— cualquier comparación tenía que partir una cadena por un
 * separador, y un cambio de redacción habría dejado el cepo comparando basura
 * contra basura sin que nada fallara.
 */
async function ambasCifras(page, unicoSel, mesSel) {
  const unico = totales(await page.locator(unicoSel).textContent());
  const mes = totales((await page.locator(mesSel).textContent()) ?? '');
  return { unico, mes };
}

const corrientes = (page) => ambasCifras(page, '[data-running-total]', '[data-running-mes]');

/**
 * Recorre los cuatro pasos hasta el resultado.
 * Devuelve el total corriente justo antes de pedirlo, para poder compararlo.
 */
async function recorrer(page, base, { objetivo, alcance, capacidades = [], urgencia, saltar = false }) {
  await abrirCotizador(page, base);
  await marcar(page, objetivo);
  await siguiente(page);
  await marcar(page, alcance);
  await siguiente(page);
  for (const c of capacidades) await marcar(page, c);
  const corriente = await corrientes(page);
  if (saltar) await ninguna(page);
  else await siguiente(page);
  await marcar(page, urgencia);
  await siguiente(page);
  return { corriente };
}

/* ------------------------------------------------------------------ *
 * A · El envío llega a /gracias/
 * ------------------------------------------------------------------ */
async function checkEnvio(browser, base) {
  console.log('\nA. El envío pasa por /gracias/ y abre una sola pestaña');
  const ctx = await browser.newContext();
  // wa.me no se visita de verdad: se sirve un sello local. Sin esto el script
  // dependería de tener salida a internet para comprobar una redirección.
  await ctx.route('**://wa.me/**', (r) =>
    r.fulfill({ status: 200, contentType: 'text/html', body: '<h1>wa.me</h1>' })
  );
  const page = await ctx.newPage();
  // `popup` y no `context.on('page')`: lo segundo cuenta también esta pestaña y
  // el arnés se acusaba a sí mismo de abrir dos.
  const abiertas = [];
  page.on('popup', (p) => abiertas.push(p));

  await recorrer(page, base, { objetivo: 'nuevo', alcance: 'una', urgencia: 'ya' });
  await page.fill('#cot-nombre', 'Prueba');
  await page.fill('#cot-contacto', '+507 6000 0000');
  await page.locator('[data-send]').click();
  await page.waitForURL(/\/gracias\//, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(400);

  const enGracias = page.url().includes('/gracias');
  const unaPestana = abiertas.length === 1 && abiertas.every((p) => p.url().includes('wa.me'));

  if (!enGracias)
    fail(`el envío no pasa por /gracias/ (terminó en ${page.url().slice(0, 60)}) — el Lead no se cuenta`);
  if (!unaPestana) fail(`el envío abrió ${abiertas.length} pestañas de WhatsApp, se espera 1`);

  console.log(`   destino final        ${page.url().replace(base, '').slice(0, 40).padEnd(22)} ${mark(enGracias)}`);
  console.log(`   pestañas de WhatsApp ${String(abiertas.length).padEnd(22)} ${mark(unaPestana)}`);
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * B · "Ninguna de estas" desmarca
 * ------------------------------------------------------------------ */
async function checkNinguna(browser, base) {
  console.log('\nB. "Ninguna de estas" desmarca lo marcado');
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // Se marcan dos capacidades caras ANTES de arrepentirse —es justo el caso que
  // cobraba $1,050 de más— y una de ellas es la que deja mensualidad: un
  // arrepentimiento que borrara el pago único pero no la cuota mensual dejaría
  // al cliente suscrito a algo que acaba de rechazar.
  await recorrer(page, base, {
    objetivo: 'nuevo',
    alcance: 'una',
    capacidades: ['reservas', 'seguridad'],
    urgencia: 'ya',
    saltar: true,
  });

  const lineas = await page.locator('.cot-line').count();
  const total = totales(await page.locator('[data-total]').textContent());
  const mensualVisible = await page.locator('[data-total-mes]').isVisible();
  const ok = lineas === 1 && !mensualVisible;
  if (lineas !== 1)
    fail(`"Ninguna de estas" dejó ${lineas} líneas (se espera solo el plan) y un total de ${total}`);
  if (mensualVisible)
    fail('"Ninguna de estas" dejó una mensualidad en pantalla: se rechazó y se sigue cobrando');
  console.log(`   líneas tras arrepentirse ${String(lineas).padEnd(18)} ${mark(lineas === 1)}`);
  console.log(`   total                    ${total.padEnd(18)} ${mark(ok)}`);
  console.log(`   mensualidad              ${(mensualVisible ? 'sigue ahí' : 'ninguna').padEnd(18)} ${mark(!mensualVisible)}`);
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * C · La cifra no cambia por el camino
 * ------------------------------------------------------------------ */
async function checkCifraEstable(browser, base) {
  console.log('\nC. Total corriente = total del resultado = total del mensaje');
  const ctx = await browser.newContext();
  await ctx.route('**://wa.me/**', (r) =>
    r.fulfill({ status: 200, contentType: 'text/html', body: '<h1>wa.me</h1>' })
  );
  const page = await ctx.newPage();
  const abiertas = [];
  page.on('popup', (p) => abiertas.push(p));

  /*
   * Tres capacidades a la vez, elegidas para que ninguna forma de componer un
   * precio se quede sin ejercer en los tres caminos:
   *
   *  · eBot es la única línea que no sale de `modules.ts` (producto con precio
   *    cerrado propio),
   *  · seguridad es la única que produce DOS líneas y una cuota mensual, y de
   *    paso devuelve al cotizador el formato de rango «$X – $Y», que se quedó
   *    sin ejercer el día que se quitó el módulo «Respuestas automáticas»
   *    ($250–$900) al publicarse eBot,
   *  · portal es un módulo corriente.
   */
  const { corriente } = await recorrer(page, base, {
    objetivo: 'vender',
    alcance: 'catalogo',
    capacidades: ['ebot', 'seguridad', 'portal'],
    urgencia: 'mes',
  });
  const resultado = await ambasCifras(page, '[data-total]', '[data-total-mes]');

  await page.fill('#cot-nombre', 'Prueba');
  await page.fill('#cot-contacto', 'prueba@ejemplo.com');
  await page.locator('[data-send]').click();
  await page.waitForTimeout(600);

  const wa = abiertas.find((p) => p.url().includes('wa.me'));
  const texto = wa ? decodeURIComponent(new URL(wa.url()).searchParams.get('text') ?? '') : '';
  const enMensaje = {
    unico: totales(texto.match(/Total estimado: (.+)/)?.[1] ?? '(no aparece)'),
    mes: totales(texto.match(/Mensualidad: (.+)/)?.[1] ?? '(no aparece)'),
  };

  /*
   * Las cifras se comparan por su NÚMERO, no por su cadena: el mismo importe se
   * escribe con adornos distintos en cada sitio ("y $30 – $60/mes" en pantalla,
   * "$30 – $60/mes" en el mensaje), y exigir el mismo texto obligaría a que la
   * redacción de los tres caminos fuera idéntica para siempre — que es una
   * comprobación de estilo, no de honestidad.
   */
  const mismoImporte = (a, b) => {
    const x = cifras(a);
    const y = cifras(b);
    return x.min === y.min && x.max === y.max;
  };

  const okUnico =
    mismoImporte(corriente.unico, resultado.unico) && mismoImporte(resultado.unico, enMensaje.unico);
  const okMes =
    corriente.mes !== '' &&
    mismoImporte(corriente.mes, resultado.mes) &&
    mismoImporte(resultado.mes, enMensaje.mes);

  if (!okUnico)
    fail(
      `el total de una vez cambia por el camino: corriente ${corriente.unico}, ` +
        `resultado ${resultado.unico}, mensaje ${enMensaje.unico}`
    );
  if (!okMes)
    fail(
      `la mensualidad cambia por el camino (o no aparece): corriente "${corriente.mes}", ` +
        `resultado "${resultado.mes}", mensaje "${enMensaje.mes}"`
    );

  console.log(
    `   de una vez  ${corriente.unico.padEnd(16)} ${resultado.unico.padEnd(16)} ${enMensaje.unico.padEnd(16)} ${mark(okUnico)}`
  );
  console.log(
    `   al mes      ${corriente.mes.padEnd(16)} ${resultado.mes.padEnd(16)} ${enMensaje.mes.padEnd(16)} ${mark(okMes)}`
  );
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * D · Los precios son los de /planes
 * ------------------------------------------------------------------ */
const RUTAS_A_PLAN = [
  { plan: 'PanaClaw Start', objetivo: 'nuevo', alcance: 'una' },
  { plan: 'PanaClaw Launch', objetivo: 'rehacer', alcance: 'landing' },
  { plan: 'PanaClaw Corporate', objetivo: 'sistema', alcance: 'multi' },
  { plan: 'PanaClaw Commerce', objetivo: 'vender', alcance: 'catalogo' },
];

async function checkPrecios(browser, base) {
  console.log('\nD. El precio de cada plan es el que dice /planes');
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await page.goto(`${base}/planes/`, { waitUntil: 'load' });
  const publicados = Object.fromEntries(
    await page.locator('.plan').evaluateAll((cards) =>
      cards.map((c) => [
        c.querySelector('.plan-name')?.textContent.trim(),
        c.querySelector('.price')?.textContent.trim(),
      ])
    )
  );

  for (const caso of RUTAS_A_PLAN) {
    await recorrer(page, base, { ...caso, urgencia: 'flexible' });
    const nombre = (await page.locator('[data-plan-name]').textContent()).trim();
    const enCotizador = totales(
      await page.locator('.cot-line').first().locator('.cot-line-price').textContent()
    );
    const enPlanes = publicados[caso.plan];
    const ok = nombre === caso.plan && enCotizador === enPlanes;
    if (!ok) {
      fail(
        `${caso.plan}: /planes dice ${enPlanes} y el cotizador ${enCotizador}` +
          (nombre === caso.plan ? '' : ` (además recomendó ${nombre})`)
      );
    }
    console.log(
      `   ${caso.plan.padEnd(20)} /planes ${String(enPlanes).padStart(7)}   cotizador ${enCotizador.padStart(7)}   ${mark(ok)}`
    );
  }
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * E · Lo que el plan ya trae no se puede marcar
 * ------------------------------------------------------------------ */

/** Deja el recorrido plantado en el paso de capacidades. */
async function hastaCapacidades(page, base, { objetivo, alcance }) {
  await abrirCotizador(page, base);
  await marcar(page, objetivo);
  await siguiente(page);
  await marcar(page, alcance);
  await siguiente(page);
}

async function estadoDeCapacidades(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('input[name="capacidades"]')].map((input) => ({
      value: input.value,
      // La etiqueta son dos nodos: lo que suma de una vez y lo que suma al mes.
      // Se leen por separado porque cada una tiene que cuadrar con SU total.
      etiqueta: document.querySelector(`[data-opt-unico="${input.value}"]`)?.textContent.trim() ?? '',
      etiquetaMes: document.querySelector(`[data-opt-mes="${input.value}"]`)?.textContent.trim() ?? '',
      bloqueada: input.disabled,
      marcada: input.checked,
      apagada: !!input.closest('.cot-opt')?.classList.contains('is-locked'),
    }))
  );
}

/*
 * Qué tiene que salir bloqueado con cada plan base.
 *
 * Va escrito a mano y no derivado de los datos, a propósito: derivarlo haría la
 * comprobación circular —pasaría igual con la función desactivada, que es justo
 * lo que le ocurrió a la primera versión de este cepo—. Si cambia una regla de
 * `CAPABILITIES`, esta lista tiene que cambiar a mano, que es la forma de
 * obligar a mirarla.
 */
const BLOQUEADAS_ESPERADAS = {
  'PanaClaw Start': ['form'],
  'PanaClaw Launch': ['form'],
  'PanaClaw Corporate': ['blog', 'cms', 'form'],
  'PanaClaw Commerce': ['blog', 'cms', 'cobros', 'form', 'inventario'],
};

async function checkBloqueadas(browser, base) {
  console.log('\nE. Lo que el plan ya trae aparece apagado y no se puede marcar');
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  for (const caso of RUTAS_A_PLAN) {
    await hastaCapacidades(page, base, caso);
    const estado = await estadoDeCapacidades(page);

    // La etiqueta y el bloqueo tienen que contar lo mismo, y nada bloqueado
    // puede quedarse marcado: una casilla que no se puede desmarcar encerraría
    // a la persona en el plan caro.
    const incoherentes = estado.filter(
      (c) => c.bloqueada !== (c.etiqueta === 'Ya incluido') || c.bloqueada !== c.apagada
    );
    const marcadas = estado.filter((c) => c.bloqueada && c.marcada);
    const bloqueadas = estado.filter((c) => c.bloqueada).map((c) => c.value).sort();
    const esperadas = BLOQUEADAS_ESPERADAS[caso.plan];
    const coincide = bloqueadas.join(',') === esperadas.join(',');
    const ok = incoherentes.length === 0 && marcadas.length === 0 && coincide;

    if (incoherentes.length)
      fail(`${caso.plan}: ${incoherentes.map((c) => c.value).join(', ')} dicen una cosa y hacen otra`);
    if (marcadas.length) fail(`${caso.plan}: ${marcadas.map((c) => c.value).join(', ')} bloqueadas y marcadas`);
    if (!coincide)
      fail(`${caso.plan}: se bloquean [${bloqueadas.join(', ') || '—'}] y se esperaba [${esperadas.join(', ')}]`);

    console.log(
      `   ${caso.plan.padEnd(20)} bloqueadas: ${String(bloqueadas.length).padStart(2)}` +
        `  (${bloqueadas.join(', ') || '—'})`.padEnd(38) +
        mark(ok)
    );
  }

  /*
   * Caso aparte: lo que sale gratis por OTRA capacidad marcada no se bloquea, y
   * es deliberado. Desde Launch, marcar "Cobrar en línea" sube a Commerce y con
   * ello el blog entra incluido — pero si se bloqueara, y luego se desmarcara
   * "Cobrar en línea", la persona se quedaría con una casilla imposible de
   * tocar. Se queda marcable, solo que a coste cero.
   */
  await hastaCapacidades(page, base, { objetivo: 'rehacer', alcance: 'landing' });
  await marcar(page, 'cobros');
  const [blog] = (await estadoDeCapacidades(page)).filter((c) => c.value === 'blog');
  const okGratis = blog.etiqueta === 'Incluido' && !blog.bloqueada;
  if (!okGratis)
    fail(`gratis por otra opción: "blog" quedó "${blog.etiqueta}"${blog.bloqueada ? ' y bloqueada' : ''}`);
  console.log(`   gratis por otra opción  blog: "${blog.etiqueta}", bloqueada: ${blog.bloqueada ? 'sí' : 'no'}   ${mark(okGratis)}`);

  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * F · Cada etiqueta dice lo que de verdad cambia el total
 * ------------------------------------------------------------------ */

/** '$2,200 – $2,850' → {min,max} · '+$555 · pasa a Corporate' → {min:555,max:555} */
function cifras(texto) {
  const nums = texto.replace(/,/g, '').match(/\d+(\.\d+)?/g)?.map(Number) ?? [0];
  return { min: nums[0], max: nums[nums.length - 1] };
}

async function checkEtiquetasHonestas(browser, base) {
  console.log('\nF. Cada etiqueta mueve el total exactamente lo que anuncia');
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  let comprobadas = 0;
  let fallos = 0;

  const delta = (antes, despues) => ({ min: despues.min - antes.min, max: despues.max - antes.max });
  const iguales = (a, b) => a.min === b.min && a.max === b.max;

  for (const caso of RUTAS_A_PLAN) {
    await hastaCapacidades(page, base, caso);
    for (const cap of await estadoDeCapacidades(page)) {
      if (cap.bloqueada) continue; // no se puede marcar: nada que comparar

      const antes = await corrientes(page);
      await marcar(page, cap.value);
      const despues = await corrientes(page);
      await desmarcar(page, cap.value);

      const realUnico = delta(cifras(antes.unico), cifras(despues.unico));
      const realMes = delta(cifras(antes.mes), cifras(despues.mes));
      const anunciadoUnico = cap.etiqueta === 'Incluido' ? { min: 0, max: 0 } : cifras(cap.etiqueta);
      /*
       * Sin parte mensual anunciada, lo que se exige es CERO movimiento en el
       * total mensual. Es la mitad que de verdad protege: sin esta línea, una
       * capacidad que empezara a colar una cuota mensual sin decirlo pasaría
       * esta comprobación en verde.
       */
      const anunciadoMes = cap.etiquetaMes ? cifras(cap.etiquetaMes) : { min: 0, max: 0 };
      const ok = iguales(realUnico, anunciadoUnico) && iguales(realMes, anunciadoMes);

      comprobadas++;
      if (!ok) {
        fallos++;
        fail(
          `${caso.plan} · "${cap.value}": la etiqueta dice "${cap.etiqueta}` +
            `${cap.etiquetaMes ? ` / ${cap.etiquetaMes}` : ''}" y el total se mueve ` +
            `${realUnico.min}–${realUnico.max} de una vez y ${realMes.min}–${realMes.max} al mes`
        );
      }
    }
  }

  console.log(
    `   ${String(comprobadas).padStart(2)} combinaciones capacidad × plan comprobadas   ${mark(fallos === 0)}`
  );
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * G · reduced-motion apaga el scroll animado
 * ------------------------------------------------------------------ */

/** Salta al resultado midiendo el scroll a mitad de camino y ya asentado. */
async function medirSalto(browser, opts) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  await abrirCotizador(page, opts.base);
  await marcar(page, 'nuevo');
  await siguiente(page);
  await marcar(page, 'una');
  await siguiente(page);
  await siguiente(page);
  await marcar(page, 'ya');
  await page.locator('.cot-step').nth(3).locator('button[data-next]').click();
  await page.waitForTimeout(50);
  const aMitad = await page.evaluate(() => window.scrollY);
  await page.waitForTimeout(1200);
  const asentado = await page.evaluate(() => window.scrollY);
  await ctx.close();
  return { aMitad, asentado };
}

async function checkReducedMotion(browser, base) {
  console.log('\nG. Con prefers-reduced-motion, el scroll no se anima');

  /*
   * Se miden LOS DOS casos a propósito. Comprobar solo el de la preferencia
   * activa daría verde también si el scroll dejara de moverse por cualquier
   * otro motivo, y el cepo no valdría nada — es el error que tuvo la primera
   * versión de la comprobación E.
   */
  const conPreferencia = await medirSalto(browser, { base, reducedMotion: 'reduce' });
  const sinPreferencia = await medirSalto(browser, { base, reducedMotion: 'no-preference' });

  const instantaneo = conPreferencia.aMitad === conPreferencia.asentado;
  const animadoSinElla = sinPreferencia.aMitad !== sinPreferencia.asentado;

  if (!instantaneo)
    fail(`con reduce-motion el scroll se anima igual (${conPreferencia.aMitad} → ${conPreferencia.asentado})`);
  if (!animadoSinElla)
    fail('sin la preferencia el scroll tampoco se anima: la comprobación de reduce-motion no prueba nada');

  console.log(
    `   con reduce-motion   ${String(conPreferencia.aMitad).padStart(5)} → ${String(conPreferencia.asentado).padEnd(6)} instantáneo  ${mark(instantaneo)}`
  );
  console.log(
    `   sin la preferencia  ${String(sinPreferencia.aMitad).padStart(5)} → ${String(sinPreferencia.asentado).padEnd(6)} animado      ${mark(animadoSinElla)}`
  );
}

/* ------------------------------------------------------------------ *
 * H · Salidas del resultado
 * ------------------------------------------------------------------ */
async function checkSalidas(browser, base) {
  console.log('\nH. Desde el resultado se puede corregir sin perderlo todo');
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await recorrer(page, base, {
    objetivo: 'nuevo',
    alcance: 'una',
    capacidades: ['reservas'],
    urgencia: 'ya',
  });

  await page.locator('[data-edit]').click();
  await page.waitForTimeout(200);
  const conservadas = await page.locator('input:checked').count();
  const okEditar = conservadas === 4; // objetivo, alcance, una capacidad y urgencia

  // De vuelta al resultado: cuatro pasos, porque "Empezar de nuevo" vive allí.
  for (let i = 0; i < 4; i++) await siguiente(page);
  await page.locator('[data-restart]').click();
  await page.waitForTimeout(200);
  const trasReiniciar = await page.locator('input:checked').count();
  const okReiniciar = trasReiniciar === 0;

  if (!okEditar) fail(`"Cambiar una respuesta" conservó ${conservadas} de 4 respuestas`);
  if (!okReiniciar) fail(`"Empezar de nuevo" dejó ${trasReiniciar} respuestas marcadas`);

  console.log(`   cambiar una respuesta  conserva ${conservadas}/4   ${mark(okEditar)}`);
  console.log(`   empezar de nuevo       deja ${trasReiniciar}/4      ${mark(okReiniciar)}`);
  await ctx.close();
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

  const browser = await chromium.launch();
  try {
    await checkEnvio(browser, base);
    await checkNinguna(browser, base);
    await checkCifraEstable(browser, base);
    await checkPrecios(browser, base);
    await checkBloqueadas(browser, base);
    await checkEtiquetasHonestas(browser, base);
    await checkReducedMotion(browser, base);
    await checkSalidas(browser, base);
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n' + '─'.repeat(60));
  if (fails.length === 0) {
    console.log('✅ El cotizador cuenta lo mismo por los tres caminos.');
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
