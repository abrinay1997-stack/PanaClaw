# Estado del repositorio

**El único sitio donde viven los hallazgos y los pendientes.** Si quieres saber
cómo está el sitio y qué falta, se lee esto y nada más.

Reglas de este documento:

- **Lo que se cierra se borra.** Un listado donde conviven tareas hechas y
  pendientes deja de leerse a los dos meses. El historial de git guarda lo
  cerrado; aquí solo entra lo que sigue abierto.
- **Ninguna cifra sin fecha de medición.** Es la misma regla que `projects.ts`
  aplica al contenido de cara al cliente, y vale igual para el diagnóstico
  interno: un número sin fecha deja de ser cierto sin que nadie lo toque.
- **Esto no es el manual.** Las reglas del proyecto y el troubleshooting están en
  [`convenciones.md`](convenciones.md); cómo funciona el chat, en
  [`chat.md`](chat.md). Aquí solo está el estado.

**Dónde está el sitio hoy:** en beta. Publicado pero sin anunciar, sin dominio
propio y sin buscar clientes todavía. El dominio se compra cuando lo de abajo
esté hecho, no antes — y hay un punto (el 1) que **hay que hacer antes de
comprarlo** o se vuelve caro.

Cada pendiente lleva quién lo desbloquea:

| Marca | Significa |
|---|---|
| `[código]` | Se hace entero desde el repo. Cero dinero, cero cuentas nuevas |
| `[tuyo]` | Necesita contenido, una decisión o una gestión que solo puedes hacer tú |
| `[cuenta]` | Gratis en dinero, pero exige abrir una cuenta en un servicio externo |
| `[$]` | Cuesta dinero. Fuera de alcance mientras no haya presupuesto |

---

## Lo medido — 2026-08-06

Sobre el build de producción servido en local, Chromium headless a 1440×900 y
390×844. **Acción** = un `<a href>` o un `<button>` dentro de `<main>` con caja
visible; **sin scroll** = las que caen por encima del borde inferior de la
primera pantalla.

| Página | Alto (escritorio / móvil) | Acciones en `<main>` | Sin scroll (escr. / móv.) |
|---|---|---|---|
| `/` | 3 602 / 4 991 px | 17 | 3 / 5 |
| `/servicios` | 4 777 / 5 733 px | 1 | 0 / 0 |
| `/planes` | 5 394 / **8 195** px | 16 | 0 / 1 |
| `/proceso` | 6 028 / 6 743 px | 2 | 0 / 0 |
| `/proyectos` | 3 316 / 4 451 px | 10 | 2 / 1 |
| `/contacto` | 1 761 / 3 111 px | 4 | 3 / 1 |
| `/cotizador` | 2 015 / 2 411 px | 1 | 0 / 0 |
| `/ayuda` | 3 616 / 4 703 px | 6 | 4 / 4 |

**Estos números no se comparan uno a uno con los del 2026-08-03.** Aquella
medición no dejó escrito qué contaba como acción, así que las diferencias
pequeñas —`/planes` de 13 a 16— pueden ser de método y no del sitio. La regla de
conteo queda arriba justamente para que la próxima sí sea comparable. Lo que no
cambia: `/planes` sigue siendo la página con más acciones compitiendo y la más
larga en móvil, que es lo que dice el punto 15.

Lo que sigue verde y conviene no romper:

- **Un solo `<h1>` por página** en las ocho, y **cero saltos de nivel** de
  encabezado.
- **Cero imágenes sin `alt`.** Las decorativas van con `alt=""` y `aria-hidden`.
- **Ningún objetivo táctil por debajo de 24 px** (WCAG 2.5.8 AA) en las diez
  páginas, a 1440 y a 390. Lo que el barrido sigue señalando y **no** es fallo:
  el honeypot de `/contacto` (oculto a propósito, inalcanzable con puntero y con
  teclado), los cuatro `input` de 1×1 del cotizador —el objetivo real es la
  etiqueta que los envuelve, que sí mide de sobra— y los enlaces de WhatsApp de
  `/privacidad` y `/terminos`, que caen en la excepción explícita de la norma
  para enlaces dentro de una frase.
- **`prefers-reduced-motion: reduce` → 0 animaciones** en la home, ni al cargar
  ni pasados trece segundos. No es que se aceleren: el navegador no reporta
  ninguna. Sin la preferencia, en el segundo 13 son 15 declaradas y **3
  corriendo**: la flecha de «Scroll» y las dos del lanzador del chat, que se
  para solo tras dos tandas.
- **Solo se animan `transform` y `opacity`** en todo el sitio.
- **Ninguna página deja al visitante sin salida:** el CTA del nav está en las
  doce, también en móvil.
- **Datos estructurados ya emitidos:** `Organization` en todas las páginas
  (`BaseLayout`), `FAQPage` en `/ayuda`, `Service` + `Offer` en `/planes` y
  `CollectionPage` + `ItemList` en `/proyectos`.

### Cómo repetir esta medición

Playwright **no** es dependencia del proyecto a propósito: arrastra la descarga
de un navegador y encarecería cada build de Netlify para algo que solo se corre
a mano.

```bash
npm i -D playwright && npx playwright install chromium
npm run build && npm run medir:movil && npm run medir:cotizador
```

`npm run medir:movil` vigila el navbar —dónde está y, desde el 2026-08-11,
también si su contenido cabe dentro—, el espacio muerto tras el footer, el
alto del footer en móvil y que el panel del chat no se corte — los cuatro
nacieron de fallos reales. Las medidas de la tabla de arriba (altos, acciones,
encabezados, animaciones) salen de `document.getAnimations()` y
`getBoundingClientRect()` sobre las mismas páginas ya construidas.

`npm run medir:cotizador` (nuevo el 2026-08-06) vigila el recorrido completo:
que el envío pase por `/gracias/`, que la cifra sea la misma en el total
corriente, el resultado y el mensaje de WhatsApp, que los precios coincidan con
`/planes`, que lo que el plan ya trae salga bloqueado, y que **cada etiqueta
mueva el total exactamente lo que anuncia** (38 combinaciones de capacidad ×
plan). Mientras esa última pase, ninguna etiqueta del cotizador puede mentir.
Desde el 2026-08-11 son **dos** cifras las que vigila —la de una vez y la
mensual— y las compara por separado: sumarlas daría un número creíble y falso.

La regla al añadir una comprobación a cualquiera de las dos: **romper lo que
vigila y ver que salta.** Dos de las de `medir:cotizador` pasaban en verde con
la función que vigilaban desactivada; una comprobación así no es una red, es un
adorno que da confianza falsa.

---

# El plan hasta salir de beta

Ordenado por lo que de verdad mueve la aguja, no por lo que es fácil. El orden
de los bloques 1 a 5 es el orden de ejecución: el 1 tenía fecha límite y el 2
es el que decide si el sitio convence o no. Los bloques 6 y 7 van aparte y no
compiten con los otros: al 6 lo dispara la decisión de empezar a trabajar las
redes, y el 7 —el chat— depende de que haya una clave conectada en Netlify,
sin la cual el widget deriva a WhatsApp y nada de lo que hay ahí se nota.

## Bloque 1 — Antes de comprar el dominio

Hecho el 2026-08-03. El sitio ya sirve `/contacto/` en vez de `/contacto.html`,
con el canonical, el sitemap y `robots.txt` diciendo lo mismo.

**Queda una comprobación que solo se puede hacer en producción:** que el
formulario de `/contacto` siga apareciendo en *Netlify → Forms → Active forms*
después del primer despliegue con las rutas nuevas. Netlify detecta los
formularios leyendo el HTML publicado, y ese HTML ahora vive en
`contacto/index.html` en vez de `contacto.html`. En local el `<form>` conserva
`data-netlify`, el honeypot y el `action="/gracias/"`, así que no hay motivo
para que falle — pero es el punto 19 y conviene verificarlo antes que ningún
otro: si se rompe, se rompe en silencio y sin síntoma visible.

## Bloque 2 — Convertir promesa en prueba

Es el bloque que más pesa en la probabilidad de éxito, y casi todo es gratis.
Hoy el sitio afirma que es rápido y seguro, pero **no enseña una sola cifra
propia**. Todo lo de aquí convierte afirmación en evidencia.

| # | Pendiente | Quién |
|---|---|---|
| 2 | **Medir el propio sitio y publicarlo.** El sitio vende velocidad y no enseña la suya. Apuntar `npm run medir` a `panaclaw.netlify.app` y poner la cifra donde se lee. Es autoevidencia y ya la tienes. | `[código]` |
| 3 | **Estructura de testimonios.** Hoy no existe ni el sitio donde ponerlos. Se puede dejar montado —tipo, componente, tarjeta— para que publicar uno sea añadir un objeto a un array. Los textos y los permisos son tuyos. | `[código]` + `[tuyo]` |
| 4 | **Quién está detrás.** El bloque vive en `/proceso` y está vacío. En un servicio de confianza el anonimato es una barrera de compra: la objeción real del comprador no es el precio, es «¿y este quién es?». | `[tuyo]` |
| 5 | **Qué significa «PanaClaw».** El nombre no se explica en ninguna página. Es una línea de origen de marca y hoy es storytelling desaprovechado. | `[tuyo]` |
| 6 | **Reversión de riesgo.** La palabra «garantizado» aparece una vez en todo el sitio y es sobre PageSpeed ≥ 90: una especificación técnica, no una promesa comercial. Hoy el cliente pone el 50 % por adelantado y asume el 100 % del riesgo. Algo acotado y cumplible («si el primer diseño no te convence, devolvemos el adelanto») elimina de golpe la objeción más cara. | `[tuyo]` |
| 7 | **La estadística sin fuente.** «Cuatro de cada diez personas se van de una página que tarda más de tres segundos» (`services.ts`). No lleva fuente, y el sitio entero se vende sobre no publicar datos sin verificar. O se cita, o se suaviza. | `[código]` |
| 8 | **Datos legales visibles** (aviso de operación, RUC). Para un pago de $850–$1 200 por adelantado, la formalidad se lee como seguridad. | `[tuyo]` |
| 9 | **Fichas de `/proyectos` completas.** Ya tienen sector, resumen y captura; faltan año, reto, solución y capacidades. Marcado con `TODO` en `src/data/projects.ts`. Sin métricas: ver la decisión de abajo. | `[tuyo]` |

## Bloque 3 — Que quien llegue no se vaya

Todo esto es programable aquí y ninguna pieza necesita dinero.

| # | Pendiente | Quién |
|---|---|---|
| 10 | **Tabla comparativa de planes.** Cuatro listas distintas sin filas comunes; `Commerce` dice «Todo lo de Corporate» y obliga a subir con la vista, leer otra tarjeta y recordar. Aburrida, sí: es el formato que la gente sabe leer cuando decide. | `[código]` |
| 11 | **Care en el resultado del cotizador**, marcado por defecto. Es el ingreso recurrente y hoy aparece pasado el 70 % del scroll de `/planes`, nunca en el momento de decidir. Un mantenimiento no se vende aparte: se adjunta. | `[código]` |
| 12 | **Fila de comparación contra el WordPress barato en `/planes`.** El argumento está solo en la home, pero la comparación se decide mirando el precio. Quien llega directo a `/planes` lee $295 contra nada. | `[código]` |
| 13 | **Página propia para el Diagnóstico de $49.** Es la única oferta de fricción baja del sitio y vive como una banda debajo de la tabla, aplastada por cuatro planes de $295 a $1 200. Es el producto que debería recibir al tráfico frío. | `[código]` |
| 14 | **Captura de quien no está listo hoy.** El imán ya está escrito en la home —«te enviamos un reporte de velocidad de tu sitio actual»— y no está implementado: falta el campo donde pegar la URL. Se puede construir con la misma API de PageSpeed del punto 2 y la función de Netlify que ya existe para el chat. Sin coste. | `[código]` |
| 15 | **`/planes` tiene 13 acciones compitiendo** en el cuerpo (medido 2026-08-03). Cuando todo es prioritario, nada lo es. Que las 7 tarjetas de capacidad sean una lista con un solo CTA al cierre. | `[código]` |
| 16 | **Sin señal de progreso en `/proceso`** (6 713 px en móvil). `/planes` y `/ayuda` ya llevan índice con `<SectionNav>`. En `/proceso` se dejó a propósito para después: su destino más buscado es el bloque de quiénes están detrás, que sigue vacío (punto 4), y un índice que lleva a una sección en blanco resta en vez de sumar. | `[código]` |
| 17 | **El envío del cotizador solo sale por WhatsApp.** En escritorio sin WhatsApp Web el flujo se corta. `/contacto` ya no depende de eso. | `[tuyo]` + `[cuenta]` |
| 18 | **Revisar el mapeo respuesta → plan del cotizador.** Los precios son tuyos; las reglas que deciden qué plan corresponde a cada respuesta son una propuesta mía, no una decisión tomada. Vive entero en `src/data/quote.ts`. Desde el 2026-08-11 esas reglas además APAGAN opciones —«Rehacer el que tengo» deja fuera «Una sola página», por ejemplo—, así que revisarlas ya no es solo cosmético. | `[tuyo]` |
| 19 | **Comprobar que los envíos del formulario llegan.** `formDestination` vale `'netlify'`: los envíos caen en Netlify Forms. Falta verlo en el panel, activar la notificación por correo y hacer un envío de prueba. | `[tuyo]` |
| 31 | **Commerce cobra $650 por el panel que `/planes` dice que incluye.** El plan se vende con «Panel para gestionar tus pedidos» y el módulo «Panel de control» se cobra igual: Commerce + panel = $1,850. Rompe la regla 2. **Decisión tuya:** ¿son la misma cosa? Si lo son, `panel` gana `includedFrom: 'commerce'`; si no, los dos nombres tienen que dejar de ser la misma palabra. | `[tuyo]` |
| 32 | **«Un sistema a medida» cotiza $850 pelado.** Su propio texto promete reservas, portal y panel —$2,000 en módulos— y si no se marcan en el paso 3 sale Corporate a secas, con la etiqueta «Total estimado». **Decisión tuya:** ¿premarcar esas tres capacidades al elegirlo, o solo advertir? | `[tuyo]` |
| 33 | **«Salir en Google» exige Corporate mientras Launch se vende como «preparada para salir en Google».** Lo que de verdad exige Corporate es el blog. O se renombra la capacidad, o Launch deja de prometerlo: hoy `/planes` y el cotizador dan dos respuestas distintas a la misma pregunta. | `[código]` |
| 34 | **Las etiquetas «Desde $X» del paso 2 mienten en cuanto el paso 1 sube el plan.** Con «Vender en línea» marcado, las cuatro opciones de tamaño anuncian $295, $450, $850 y $1,200 — y las cuatro dan $1,200. Las capacidades ya enseñan su delta real desde el 2026-08-06; los pasos de plan siguen sin hacerlo. | `[código]` |
| 35 | **«Recibir mensajes por WhatsApp» es una opción que no puede hacer nada.** Está incluida en los cuatro planes, así que siempre sale bloqueada. Sacarla del paso y dejarla como línea fija acorta el paso más largo del cotizador. | `[código]` |

**Hecho el 2026-08-06 (auditoría del cotizador).** Cerrados: el envío vuelve a
pasar por `/gracias/`; «Ninguna de estas» desmarca en vez de solo avanzar —
cobraba hasta $1,050 de lo que la persona acababa de rechazar—; las capacidades
que el plan ya trae salen apagadas y no se pueden marcar; cada etiqueta dice lo
que cuesta marcarla, incluido el salto de plan («+$350 · pasa a Commerce» donde
antes decía «Incluido en Commerce», que se lee como gratis); desde el resultado
se puede corregir una respuesta sin perder las otras; `reduce-motion` apaga el
scroll; hay `noscript`; el contacto se valida; y pedir «Ya» con un plan de 15–20
días ya no se calla. El cálculo dejó de estar escrito dos veces: `computeQuote`
era código muerto mientras una copia a mano hacía el trabajo en el navegador.

**El bloqueo mira el plan de los pasos 1 y 2, no el final, y no es un detalle:**
tres capacidades suben de plan al marcarlas, así que bloquear por el plan final
dejaría «Cobrar en línea» marcada, incluida y sin poder desmarcarse — encerrando
a la persona en $1,200. Con blog y CMS, que se justifican mutuamente, el enredo
es peor. Si algún día se toca esa regla, esto es lo que hay que volver a pensar.

## Bloque 4 — Que te encuentren

| # | Pendiente | Quién |
|---|---|---|
| 20 | **Blog con Content Collections de Astro.** El motor se monta aquí y no cuesta nada; los artículos los escribes tú. Un competidor ya ranquea con «cuánto cuesta una página web en Panamá», que es exactamente la búsqueda de mayor intención del mercado. **Cero blogs vacíos:** el motor solo tiene sentido si van a existir posts. | `[código]` + `[tuyo]` |
| 21 | **`LocalBusiness` además de `Organization`.** El schema que ya se emite es correcto pero genérico; `LocalBusiness` con área de servicio es el que compite en búsquedas locales. | `[código]` |
| 22 | **Search Console.** Sitemap y canonical ya se emiten bien; falta darlos de alta y verificar. Hacerlo **después** del punto 1, no antes. | `[cuenta]` |

## Bloque 5 — Técnico y marca

| # | Pendiente | Quién |
|---|---|---|
| 23 | **Prueba con lector de pantalla real** (NVDA / VoiceOver). Lo auditado es estructura, no experiencia. Es el único hueco de accesibilidad que queda y no se puede cerrar desde el repo. | `[tuyo]` |
| 24 | **El `<select>` de `/contacto` usa `appearance:none`** con la flecha en `background-image`. En Windows con alto contraste puede desaparecer. Riesgo bajo. | `[código]` |
| 25 | **La marca es solo tipográfica.** El rayo del favicon no aparece en el nav, ni en el footer, ni en la imagen social, y no hay versión sobre fondo claro para facturas o propuestas. | `[código]` |
| 26 | **El shader es un `requestAnimationFrame` permanente** mientras el hero está en pantalla. Es la única animación corriendo del sitio. Ya se pausa fuera del viewport y no arranca con reduce-motion; si algún día importa la batería, baja a 30 fps sin que se note. | `[código]` |
| 27 | **Los 9 PNG de origen pesan 11,2 MB** y en WebP q90 pesarían 0,87 MB — un 92 % menos, imperceptible en pantalla porque se muestran al 32–50 % de opacidad bajo un velo. No afecta a lo que se sirve (Astro ya emite 1,19 MB de WebP), solo al peso del repo. | `[código]` |

## Bloque 6 — Smartlink para redes sociales

Una página nueva que no se enlaza desde ninguna parte del sitio pero forma
parte de él: el enlace único que va en la bio de Instagram y reparte hacia
WhatsApp, el cotizador, los planes y los proyectos. La idea es tenerlo en el
dominio propio en vez de en un acortador ajeno, y medir desde ahí en adelante.

**Lo que hay que entender antes de empezar**, porque cambia el orden de las
tareas:

- **El Smartlink solo no mide el recorrido.** Con la analítica únicamente en esa
  página se ve quién llega y qué botón toca, y ahí se acaba: en cuanto pasan a
  `/planes` o al cotizador se vuelven invisibles. Para ver el camino completo
  —red social → Smartlink → planes → cotizador → contacto— el tag tiene que
  estar en todo el sitio. Por eso GA4 se instala en todo el sitio (punto 28) y no
  solo aquí: es la única forma de que el recorrido se vea entero.
- **En el Smartlink no hay ninguna conversión que medir.** Solo un clic de
  salida. El píxel de Meta únicamente sirve para retargeting si dispara donde
  alguien completó algo, y eso es `/gracias/`.
- **Hoy el sitio carga cero scripts de terceros.** GA4 y el píxel serían los
  primeros. No es motivo para no hacerlo, sí para medir el antes y el después.

| # | Pendiente | Quién |
|---|---|---|
| 28 | **GA4 en todo el sitio.** Falta solo el identificador de medición (`G-…`), de Analytics → Administrar → Flujos de datos. Se pega en `ga4MeasurementId` (`src/data/analytics.ts`) y el resto ya está resuelto: la etiqueta se emite sola, `/privacidad` y la respuesta del chat se redactan del mismo valor, y el disparo por navegación usa el mismo `astro:after-swap` que ya funciona con el píxel. Hasta entonces el recorrido solo se ve en Meta. | `[tuyo]` + `[código]` |
| 29 | **Decidir si hace falta banner de consentimiento.** El píxel de Meta pone cookies. Panamá (Ley 81 de 2019) es menos exigente que la UE, pero el tráfico de redes puede llegar de cualquier país. Un banner añade fricción y peso justo en la página que vende velocidad; no ponerlo es un riesgo acotado. Es decisión tuya, no técnica. | `[tuyo]` |
| 30 | **Medir el coste en velocidad.** GA4 y el píxel rondan los 50 y 70 KB. El sitio vende abrir en menos de un segundo, así que la decisión de dejarlos se toma con el dato delante, no con la intuición: medir antes, medir después y comparar. | `[código]` |

**Hecho el 2026-08-03:** la página existe en `/smark/`, con `noindex`, fuera del
sitemap y sin un solo enlace desde el resto del sitio. Va sin nav, sin pie, sin
chat y sin scroll suave: 6,9 KB de HTML y 15,7 KB de JavaScript, contra 33,5 y
39,7 de la home. Cuatro destinos y ni uno más — cada botón que se añada reparte
peor los clics entre todos los demás.

**Hecho el 2026-08-03 (segunda pasada, la visual):** la página se veía como una
lista de botones sobre negro, que es exactamente lo que ya ofrece cualquier
Linktree gratis. Ahora lleva la escena de `interfaz.png` a pantalla completa
—con su propio encuadre y brillo en `smarkVisual`, porque el velo genérico de
`<SceneBg>` la apagaba hasta hacerla invisible en vertical—, una tarjeta de
vidrio encima, el rayo de la marca como avatar y el botón principal en naranja
lleno desde el reposo: en un teléfono no hay hover, así que el estado apetecible
tiene que ser el primero. El texto bajó de frases a datos: tres credenciales
(`Panamá · Desde $295 · Listo en días`) y una línea por destino, con el precio
de entrada sacado de `plans.ts` y el número de sitios de `projects.ts`, para que
ningún dato de la bio pueda quedarse viejo. Cuesta 8,0 KB de HTML (antes 6,9) y
entre 17 y 36 KB de imagen según la pantalla; el JavaScript sigue en cero
propio. Sin desbordes horizontales entre 320 y 1440px.

**Hecho el 2026-08-03 (tercera pasada, el copy):** revisados los cuatro botones
por dónde termina cada uno, no por lo que prometen. El hallazgo que ordena el
resto: **el cotizador no es un desvío del WhatsApp, es su mejor versión** —
termina abriendo el mismo chat, pero con plan, extras, total, plazo, nombre y
contacto ya escritos, así que llega alguien que ya aceptó una cifra en vez de un
«hola». Por eso se queda de primero. Cambios: el horario sale de debajo del
botón de WhatsApp (un sábado le decía «cerrado» a quien ya iba a escribir) y lo
sustituye lo que gana quien escribe; el mensaje precargado termina en `Mi
negocio es:`, un hueco que se rellena solo al escribir y hace que la primera
respuesta pueda llevar precio; la tercera credencial deja de ser «Listo en días»
—vaga e imposible de concretar sin mentir, los plazos van de 72 h a 20 días— y
pasa a «Precio y fecha cerrados»; y «Trabajo publicado» pasa a «Sitios que
hicimos», porque lo primero es como lo llama una agencia y lo segundo como lo
llama el cliente.

**Hecho el 2026-08-03 y REALMENTE cerrado el 2026-08-06 (el `Lead` del
cotizador):** terminar el cotizador abría `wa.me` y ahí se acababa todo, sin
pasar por `/gracias/`, que es el único punto del sitio donde el píxel cuenta una
conversión. O sea: el camino que mejor convierte —cuatro respuestas, una cifra
aceptada y un mensaje ya redactado— era invisible para Meta, que solo veía el
formulario de `/contacto`. Con publicidad encendida, eso es optimizar hacia
visitas en vez de hacia clientes. Ahora el envío hace lo mismo que `/contacto`:
WhatsApp en una pestaña nueva y esta se va a `/gracias/`. El evento **no** se
dispara a mano en el cotizador a propósito — qué cuenta como `Lead` se decide en
un solo sitio, el fragmento del píxel de `BaseLayout`, que mira la ruta;
dispararlo también aquí contaría dos veces el mismo lead, y una conversión
inflada engaña peor que una que falta. De paso, `/gracias/` deja de decir «acabo
de enviar el formulario» en su botón de WhatsApp, porque ahora se llega por dos
caminos y ese texto solo describía uno.

**Lo que aquí decía «comprobado de punta a punta» era falso, y conviene no
borrarlo:** la redirección se pedía con `window.open(url, '_blank', 'noopener')`
y se usaba el valor devuelto para decidir el destino. Esa llamada devuelve
`null` SIEMPRE por especificación, así que durante tres días el recorrido
terminó en dos pestañas de WhatsApp, sin pasar por `/gracias/` y sin contar un
solo `Lead` — exactamente el fallo que este párrafo daba por resuelto. No fue
descuido al escribirlo: leyendo el código parecía correcto, y solo se ve
abriendo un navegador. De ahí sale `npm run medir:cotizador`, y de ahí sale la
regla de que lo que se declare comprobado en este documento tenga un cepo
detrás.

**Lo que sigue sin hacer:** los cuatro botones de `/smark/` son indistinguibles
en la analítica — no hay forma de saber cuál se toca, así que cualquier
discusión sobre esos textos es criterio, no dato.

**Hecho el 2026-08-03:** el píxel de Meta está activo en las trece páginas, con
`PageView` una vez por página —también al navegar sin recargar— y `Lead` en
`/gracias/`. `/privacidad` y la respuesta del chat sobre privacidad se redactan
ahora desde `data/analytics.ts`, así que no pueden quedarse diciendo que no hay
analítica mientras la haya.

**Lo que queda:** el identificador de GA4 (punto 28), decidir lo del banner
(29) y medir el coste en velocidad (30).

**Cuándo pegarla en la bio:** cuando haya dominio propio. La página se construye
ahora y vive en `panaclaw.netlify.app/…`; el día que cambie `site` en
`astro.config.mjs` funciona sin tocar nada más. Pero repartir un `.netlify.app`
en redes es exactamente el problema de credibilidad que se quiere evitar.

## Bloque 7 — El chat

Lo que el chat sabe se genera en el build desde los mismos archivos que dibujan
el sitio, así que **precios, planes, módulos, Care, plazos, proceso, proyectos,
FAQ y privacidad no pueden desincronizarse**: cambiar `$850` en `plans.ts` lo
cambia en `/planes`, en el cotizador y en lo que responde el bot, en el mismo
build. Eso ya está resuelto y no hay que volver a mirarlo.

**El hallazgo del 2026-08-06, medido contra 24 preguntas de cliente:** las 15
sobre el negocio se responden bien. El problema es el contrario del que se
esperaba — **no es que falte información, es que la recuperación siempre
devuelve algo**. Para lo que el sitio no cubre devuelve el hecho que más
palabras comparta, y el modelo lo usa: «¿Tienen testimonios?» contestaba con el
módulo *Portal de clientes*, porque comparten la palabra «clientes». La regla 1
del prompt («responde solo con el contexto») solo salta cuando el contexto viene
vacío, y casi nunca viene vacío.

Un umbral de puntuación **no** lo arregla, y está medido: los aciertos y los
falsos positivos se solapan, así que el corte rompería respuestas correctas
antes que las malas. Lo que funciona es escribir el hecho, aunque diga «todavía
no». El método completo está en [`chat.md`](chat.md).

Por eso los cuatro primeros pendientes de aquí **son los mismos que los puntos 4,
5, 6 y 8**: mientras el sitio no tenga esa información, el chat tampoco puede
tenerla, y hoy responde a esas preguntas con cualquier cosa.

| # | Pendiente | Quién |
|---|---|---|
| 36 | **«¿Quiénes son ustedes?» responde «Listo en días, no en meses».** Es el punto 4 visto desde el chat. En cuanto exista el bloque de quién está detrás, se convierte en un hecho de la KB. | `[tuyo]` |
| 37 | **«¿Qué significa PanaClaw?» responde con el plan Start** (comparten la palabra). Es el punto 5. | `[tuyo]` |
| 38 | **«¿Dan garantía?» responde con las rondas de cambios.** Adyacente, pero no es la pregunta. Es el punto 6. | `[tuyo]` |
| 39 | **«¿Tienen RUC?» no recupera nada.** Es el punto 8, y es la única de las cuatro donde el silencio es mejor que la respuesta de hoy. | `[tuyo]` |
| 40 | **Decidir qué NO se hace, y escribirlo.** «¿Hacen aplicaciones móviles?», «¿manejan mis redes sociales?» — hoy contestan con la lista de módulos y con el plan Corporate. No lo escribo yo porque es una decisión comercial: decir «no lo hacemos» cierra una puerta, y esa puerta es tuya. | `[tuyo]` |
| 41 | **Registrar las preguntas que recuperan poco o nada.** Hoy no se guardan. Y no basta con las de cero hechos, que son pocas: hay que guardar también las que puntúan bajo, porque son las que producen los aciertos falsos. Es la lista de la compra de la KB, escrita por los clientes. | `[código]` |
| 42 | **El chat no sabe nada del cotizador nuevo.** Tiene un hecho genérico («cuatro preguntas, sin dejar tus datos») que sigue siendo cierto, pero no sabe que las capacidades incluidas salen bloqueadas ni que una capacidad puede subirte de plan. Si alguien pregunta «¿me cobran el blog si voy con Corporate?», no lo puede responder. | `[código]` |
| 43 | **Confirmar que el chat responde hoy en producción.** No se puede saber desde el repo: las claves viven solo en el panel de Netlify. `chat.md` documenta un incidente real con `GROQ_API_KEY`, así que alguna hubo configurada. Si hoy no hay ninguna válida, el widget deriva a WhatsApp **sin avisar de nada** — se ve igual de bien roto que funcionando. Un mensaje de prueba en el sitio publicado lo resuelve. | `[tuyo]` |

El 43 va primero: el resto de esta lista describe cómo responde algo que quizá
no esté respondiendo, y desde aquí no hay forma de saberlo.

## Bloque 8 — eBot, el bot multicanal

**Hecho el 2026-08-09.** El sitio ya vende algo que no es una web: `/ebot/`, con
entrada propia en la barra (entre *Servicios* y *Proyectos*), en el pie, en el
desplegable de `/contacto` y en la base del chat. Todo el contenido sale de
`src/data/ebot.ts` — precio, canales, las 13 pantallas del panel, los dos gastos
que paga el cliente, lo que incluye, lo que no y las seis preguntas—, así que la
página, el formulario y lo que responde el bot no pueden desincronizarse. Emite
`Service` + `Offer` y `FAQPage`.

Dos decisiones que conviene no deshacer:

- **Los dos gastos mensuales del cliente van publicados con el mismo tamaño que
  los $70**, no en una nota al pie. Un producto que anuncia $70 y calla la nube y
  la llave de IA es exactamente la letra chica que el resto del sitio dice no
  tener, y aquí duele más porque el argumento entero es «no te alquilamos nada».
- **eBot no entró en `plans.ts` ni en `modules.ts`.** No se entrega en días de
  diseño, no lleva rondas de revisión y su precio no se compone como el de una
  web; mezclarlo habría obligado a poner asteriscos en los cuatro planes.

**Medido el 2026-08-09** sobre el build de producción, mismo método que la tabla
de arriba:

| Página | Alto (escritorio / móvil) | Acciones en `<main>` |
|---|---|---|
| `/ebot` | 8 276 / 11 368 px | 8 |

Es la página más larga del sitio, por delante de `/planes` (5 394 / 8 195). Es
contenido, no relleno: un producto que nadie conoce necesita que le enseñen los
canales, el panel por dentro, el precio real y las objeciones. Por eso el índice
va arriba del todo y no al final de la primera sección, y por eso en el teléfono
se recortó el aire —relleno de tarjeta y huecos, unos 1 200 px— sin quitar una
sola frase. Las acciones (8) están muy por debajo de las 16 de `/planes`: aquí
solo se puede hacer una cosa.

**Hecho el 2026-08-09 (el cotizador y el choque de precios).** El paso 3 ya
ofrece eBot: la capacidad «Contestar tus mensajes solo» suma **+$70 fijos** y su
línea del desglose dice, ahí mismo, que aparte se pagan la nube y la llave de IA
—compuesto de `ebotCostos`, no escrito a mano—, para que un total de $920 no se
lea como «y nada más nunca».

Con eso hubo que resolver el choque que quedaba abierto: la capacidad cotizaba
el módulo **«Respuestas automáticas con IA» ($250–$900)**, cuya descripción era
«Contesta las preguntas de siempre por WhatsApp, a cualquier hora» — palabra por
palabra lo que eBot hace por $70. Publicar los dos era ofrecer dos precios para
lo que el cliente lee como una sola cosa. **El módulo se quitó de `modules.ts`**,
así que desaparece también de `/planes` y del chat, y todo lo de contestar
mensajes pasa por eBot.

Cómo revertirlo, si la decisión fuera otra: el objeto está escrito entero en el
comentario que dejó en `modules.ts`, y volver a apuntarle la capacidad es una
línea en `CAPABILITIES.ebot` (`quote.ts`). Pero antes conviene que las dos cosas
dejen de prometer lo mismo — si de verdad se vende IA hecha a medida **dentro**
del sistema del cliente, ese es otro producto y necesita otro nombre.

**Lo que ese cambio se llevó por delante, y ya está devuelto:** era el único
precio de rango del cotizador, y la comprobación C de `medir:cotizador` lo usaba
para ejercitar el formato «$X – $Y» en los tres caminos. Quedó sin ejercer desde
el 2026-08-09 hasta el 2026-08-11, cuando la capacidad de seguridad
($80–$150 y $30–$60/mes) volvió a meter rangos en ese caso.

**Hecho el 2026-08-09 (el chat lo sugiere).** Las pastillas iniciales del chat
pasan de cuatro a cinco: la segunda es «¿Tienen bot para WhatsApp?». Va escrita
como se pregunta y no como se llama el producto —quien no conoce el nombre no
puede pulsar una pastilla que diga «eBot»— y va segunda porque el precio de un
sitio sigue siendo lo que trae a la gente. Comprobado contra la recuperación
real de `_retrieval.mts` sobre la base ya construida: devuelve `ebot-que-es` en
primer lugar, igual que «¿pueden contestar mis mensajes de Instagram?».

**El navbar se desbordaba y nadie lo sabía.** Con siete enlaces el pill ya se
salía 18 px a 901 px de ancho; con el octavo el desborde llegó a 77 px en toda
la franja 901–999 px. No se veía porque `body{overflow-x:hidden}` se traga el
sobrante y `medir:movil` medía el centrado del pill, no lo que pasa dentro. El
nav colapsó entonces a 1000 px en vez de a 900, y quedó escrito que un noveno
enlace obligaría a medir esa franja otra vez a mano. **Pasó el 2026-08-11 con
Seguridad, y ya no depende de que nadie se acuerde:** la comprobación A2 de
`medir:movil` mide lo que pasa dentro del pill.

| # | Pendiente | Quién |
|---|---|---|
| 46 | **El alcance y el plazo de eBot son una propuesta mía, no una decisión tomada.** «Entrega en 48 horas», qué entra por los $70 y qué no (las cinco líneas de cada lista) salieron de lo que el producto hace, no de lo que tú te comprometes a hacer. Se revisan enteros en `src/data/ebot.ts`; una promesa que no puedas cumplir un martes ocupado es peor que no publicarla. | `[tuyo]` |
| 48 | **En un iPhone SE, la pastilla de eBot queda bajo el pliegue del propio chat.** El panel abierto solo deja ver la primera —le pasaba igual a las cuatro de antes, así que no lo trajo eBot—, y quien no desplaza dentro del chat solo ve «¿Cuánto cuesta un sitio?». Cabrían las cinco recortando el mensaje de bienvenida, que ocupa cuatro líneas en esa pantalla. Medido el 2026-08-09 con `medir:movil` (el panel entero entra y no se corta; lo que no entra es el contenido de su lista). | `[código]` |

## Bloque 9 — Seguridad web, el servicio para sitios ajenos

**Hecho el 2026-08-11.** El sitio vende un tercer producto que no es «hacerte una
web»: `/seguridad/`, con tres planes que salen del documento *Planes de
Servicios: Web y Ciberseguridad* — Revisión de Seguridad ($80–$150, pago único),
Web Protegida ($30–$60/mes) y Web Protegida Total ($70–$120/mes). Todo sale de
`src/data/seguridad.ts`: los tres planes, las 14 filas de la comparativa, los
cuatro pasos de la revisión, lo que no cubre y las seis preguntas. Está en el
pie, en el desplegable de `/contacto` (los tres, uno a uno), en el índice de
`/planes`, bajo Care en `/servicios`, en el cotizador y en la base del chat.
Emite `Service` + tres `Offer` con `priceSpecification` —los rangos se publican
como rango, no aplastados a un número— y `FAQPage`.

**Dos adaptaciones del documento original, y conviene saber que se hicieron:**
los precios venían en euros y aquí se publican en dólares con las mismas cifras
(son números de venta, no una conversión contable), y la fila de RGPD pasó a la
ley panameña de datos personales, que es la que le aplica a un cliente de aquí.

**Tres decisiones que conviene no deshacer:**

- **Este servicio es para el sitio que el cliente YA tiene**, lo hayamos hecho
  nosotros o no. Es lo que lo separa de Care, y por eso `/servicios` dice en
  texto que Care no cubre sitios ajenos y `/seguridad` dice que a un cliente
  nuestro media lista no le hace falta. Un servicio de seguridad que no admite
  qué no necesitas se lee como el que te llama para decirte que tu computadora
  tiene un virus.
- **La revisión de pago único va primera**, al revés que el anclaje de
  `/planes`. Nadie se suscribe a proteger algo que no sabe si está roto: el paso
  barato es el que convierte la duda en una lista de fallos con nombre.
- **«Lo que no incluye» empieza por la garantía que no existe.** Nadie puede
  firmar que no te van a hackear; publicarlo cuesta una venta y ahorra la
  discusión que viene después de la única vez que importa.

**Hecho el 2026-08-11 (el cotizador aprende a llevar dos cifras).** El paso 3
ofrece «Que no te lo hackeen», que suma **$80–$150 de una vez** y **$30–$60 al
mes**, en dos líneas de desglose y en **dos totales que nunca se funden**: uno
de pago único y otro mensual, en el total corriente, en el resultado y en el
mensaje de WhatsApp. Proyectar la mensualidad a doce meses para enseñar un solo
número habría sido anunciar un compromiso que nadie ha firmado.

`medir:cotizador` vigila las dos por separado (comprobación C) y comprueba que
la parte mensual de una etiqueta mueva el total mensual y **cero** el otro —y al
revés— en las 38 combinaciones de capacidad × plan (antes 34). Las dos
comprobaciones nuevas se verificaron rompiendo lo que vigilan: pasar la línea
mensual al total de una vez tumba C y las cuatro combinaciones de seguridad de
F; quitar la mensualidad del mensaje de WhatsApp tumba C sola.

**Medido el 2026-08-11** sobre el build de producción, mismo método que la tabla
de arriba:

| Página | Alto (escritorio / móvil) | Acciones en `<main>` |
|---|---|---|
| `/seguridad` | 7 146 / 9 957 px | 11 |

Es la segunda página más larga del sitio, por detrás de `/ebot` (8 276 / 11 368)
y por delante de `/planes`. Un `<h1>`, cero saltos de encabezado, cero imágenes
sin `alt`. Los dos únicos objetivos táctiles por debajo de 24 px son enlaces
dentro de una frase, que caen en la excepción explícita de WCAG 2.5.8 — los
mismos que ya tenían `/privacidad` y `/terminos`.

**El pie se pasó de presupuesto y el cepo lo cazó.** El séptimo enlace de la
columna de Servicios subió el footer a 1 337 px en un iPhone SE, con el tope en
1 300. Se arregló recortando el respiro entre enlaces en `Footer.astro`, no
quitando un enlace: el objetivo táctil queda en 29 px, por encima de los 24 que
pide la norma, y el pie baja a 1 249. `medir:movil` en verde.

**Hecho el 2026-08-11 (entra en la barra, y el nav deja de vigilarse a mano).**
Seguridad es el noveno enlace del nav, pegado a eBot: los dos son productos que
no son una web, y quien llega buscando «sitios» no los encuentra si están al
final. Con nueve enlaces el pill se desbordaba **75 px entre 1001 y 1079 px** —
otra vez invisible, porque `body{overflow-x:hidden}` se lo traga— así que el nav
colapsa ahora a **1100 px** en vez de a 1000. Medido enlace a enlace en 17
anchos de 1000 a 1920: el contenido deja de desbordarse a partir de 1080 con los
mismos 14 px de holgura que el sitio ya aceptaba; el colapso se pone 20 px por
encima para no vivir pegado al límite.

Y lo que importa más que el arreglo: **la comprobación A2 de `medir:movil` ya
mide lo que pasa DENTRO del pill**, que es lo que las tres veces anteriores no
miraba nadie. Verificada rompiéndola —devolver el colapso a 1000 px la tumba en
1001, 1024 y 1060— y con un cepo propio para que no se vuelva un adorno: si
todos los anchos salieran colapsados, falla en vez de pasar en verde sin haber
medido nada. El menú desplegable con nueve entradas mide 438 px y entra en un
iPhone SE (568 px) sin recortarse.

**Hecho el 2026-08-11 (las tres fronteras del catálogo).** El repaso de claridad
encontró que Seguridad, Care y el Diagnóstico se leían como el mismo producto
contado tres veces. Las fronteras están decididas y ahora se publican con las
**mismas palabras** en `/seguridad`, en `/servicios` y en lo que responde el
chat, compuestas de `seguridad.fronteras` y no reescritas en cada sitio:

- **Seguridad no es Care.** Care mantiene la infraestructura (dominio, copias,
  actualizaciones, uptime, cambios); Seguridad es ciberseguridad (quién entra,
  por dónde, y qué se hace para impedirlo). Ningún plan de seguridad ofrece ya
  actualizaciones ni copias: el tercero las tenía y era exactamente lo que hacía
  ilegible la diferencia. La tabla comparativa lo dice en una fila propia
  («Mantenimiento, copias y actualizaciones → Eso es Care»).
- **Seguridad no es el Diagnóstico.** El Diagnóstico de $49 mira el negocio; la
  Auditoría mira la seguridad. Se parecen en la forma —los dos son «te revisamos
  el sitio»— y en nada más. (Desde el 2026-08-11 los nombres también se
  distinguen solos: ver el bloque de abajo.)
- **La Auditoría no va incluida en ningún plan mensual, y es obligatoria.** Se
  paga siempre y aparte, y hay que pasar por ella antes de contratar un mensual.
  Regalarla dentro del plan significa revisar gratis a quien luego no contrata;
  proteger sin revisar es proteger a ciegas. Las tarjetas mensuales llevan el
  requisito debajo del precio, no en la letra pequeña.

Con eso, el tercer plan pasa a llamarse **Web Blindada** (antes «Web Protegida
Total»): dos nombres que se distinguían en una palabra, y el que más prometía
—«Total»— añadía mantenimiento, o sea lo que ya no vende. Ahora añade lo que sí
es suyo: revisión mensual en vez de trimestral, vigilancia de cambios y
respuesta ante incidente.

| # | Pendiente | Quién |
|---|---|---|
| 54 | **El precio de Web Blindada no se ha revisado después de perder el mantenimiento.** Sigue en $70–$120/mes, que era el precio cuando incluía actualizaciones, uptime y soporte. Hoy lo que añade sobre Web Protegida es revisión mensual, vigilancia de cambios y respuesta ante incidente. **Decisión tuya:** o el precio baja, o el plan gana algo más. | `[tuyo]` |
| 49 | **Los precios, el alcance y los plazos de seguridad son una propuesta mía, no una decisión tomada.** Las cifras salen del documento tal cual (en dólares en vez de euros) y «informe en 5 días» o «respuesta en 24–48 h» son promesas que tienes que poder cumplir un martes ocupado. Se revisan enteras en `src/data/seguridad.ts`. Es el mismo pendiente que el 46 tiene para eBot. | `[tuyo]` |

**Hecho el 2026-08-11 (Planes va delante, y el CTA cambia de color).** En el
nav, **Planes** pasa por delante de Proyectos y lleva una corona. Estaba al
revés con este argumento: quien duda del precio suele estar dudando de si
sabemos hacerlo, así que la prueba tiene que llegar antes que la cifra. Sigue
siendo verdad para quien lee la barra de izquierda a derecha, y casi nadie la
lee así — a la barra se viene a buscar, y lo que se busca es el precio. La
corona hace lo mismo con menos palabras: entre nueve enlaces del mismo tamaño no
hay ninguno que llame, y este tiene que llamar.

El botón «Cotizar» pasa a llevar la letra **blanca** sobre el naranja, y negra
solo cuando el botón se pone blanco (que es como el nav dice que ya estás en el
cotizador). Queda anotado que el blanco sobre `#FF5100` da 3.1:1 y AA pide 4.5:1
a ese cuerpo de letra: es una decisión de marca tomada a sabiendas. Cumplirlo con
blanco exigiría bajar el naranja del botón a ~`#D64200`, o sea tocar el acento de
la marca; el estado activo (negro sobre blanco) cumple de sobra.

**Probado y descartado el 2026-08-11: el contorno del nav abombándose sobre la
pestaña activa.** Estuvo hecho y funcionando —un solo `<path>` con la cápsula y
el bulto dentro, el desenfoque en una capa recortada con ese mismo contorno, y el
bulto persiguiendo la pestaña con suavizado exponencial— y se quitó entero
porque no gustó cómo se veía. La marca de la pestaña activa vuelve a ser el fondo
gris de siempre. Queda escrito para que no se vuelva a proponer como idea nueva:
el problema no era técnico. Está en el historial de git si algún día se retoma.

**Hecho el 2026-08-11 (los dos nombres, y el cotizador para quien ya tiene
sitio).** Cierra el pendiente 52 y la mitad del 18.

Los dos servicios que empiezan por «te revisamos el sitio» se llamaban
«Diagnóstico PanaClaw» y «Revisión de Seguridad»: ninguno de los dos nombres
decía qué miraba, así que la diferencia había que explicarla cada vez que se
nombraban —y se nombran en seis sitios—. Ahora son **Diagnóstico de Ventas** y
**Auditoría de Seguridad**: ni la palabra ni el complemento se repiten, y no
queda nada que desambiguar. Los `slug` no cambian (`diagnostico`, `revision`):
son lo que viaja en `?plan=` y en el ancla de `/servicios`, y tocarlos rompería
los enlaces ya repartidos.

Y la auditoría ya tiene su camino de compra: la primera pregunta del cotizador
tiene una quinta respuesta, **«Revisar el que ya tengo»**, que abre una rama
propia de cuatro preguntas (tamaño del sitio → protección mensual y diagnóstico
→ para cuándo). El precio sale de tres tramos nuevos en `seguridad.ts`, y el
rango publicado en `/seguridad` (`$80–$150`) se COMPONE de esos tramos en vez de
escribirse: la cifra de la página y la del cotizador no pueden divergir. Web
Protegida y Web Blindada se excluyen entre sí —Blindada ya lleva dentro todo lo
de Protegida— y marcar una desmarca la otra.

El cotizador tenía además dos baches que se veían pero no se medían:

- **El paso 2 anunciaba precios imposibles.** «Vender en línea» + «Una sola
  página · Desde $295» cotizaba $1,200. El motor siempre acertó el plan; era la
  etiqueta la que prometía otra cosa, porque los pasos 1 y 2 enseñaban un precio
  escrito en el render mientras el paso 3 ya sabía calcular el suyo en contexto.
  Ahora los cuatro pasos pasan por el mismo `optionState`: lo que se queda por
  debajo de lo que pidió el paso 1 sale apagado, y el porqué se dice **una vez**
  debajo de la pregunta (repetido opción por opción era un muro naranja que
  tapaba lo que sí se podía elegir).
- **El paso 4 dejaba pedir lo imposible.** Se podía marcar «Ya, esta semana»
  sobre un Corporate de 8–12 días y lo único que pasaba era una nota al pie.
  Ahora esa opción sale apagada cuando el plazo no cabe, y el paso traduce el
  plazo a fechas de calendario («Entrega 8–12 días. Si arrancamos hoy, del 21 al
  25 de agosto») — que es contra lo que de verdad se elige, porque nadie
  descuenta los fines de semana de cabeza. La fecha la calcula solo el navegador:
  una calculada en el build se congelaría en el HTML y el sitio prometería,
  semanas después, una entrega ya vencida.

`medir:cotizador` sube de ocho comprobaciones a once (I, J y K) y vigila las
tres cosas: que el paso 2 apague exactamente lo que debe y avise, que el paso 4
no acepte un plazo imposible y sí enseñe una fecha, y que la rama de auditoría
cuente la misma cifra por los tres caminos. Las listas de lo que debe salir
apagado están escritas a mano, igual que `BLOQUEADAS_ESPERADAS`: derivarlas de
los datos haría la comprobación circular.

| # | Pendiente | Quién |
|---|---|---|
| 55 | **Los módulos no declaran cuánto tiempo suman.** El cotizador ya da una fecha de entrega, pero solo del plan: si marcas tres capacidades, la fecha sigue siendo la del plan y debajo pone «más el plazo de cada capacidad, que va en la propuesta». Con un plazo por módulo en `modules.ts` la fecha sería la de verdad. **Decisión tuya:** cuántos días suma cada uno. | `[tuyo]` |
| 56 | **«Ya» apagado no ofrece salida.** Cuando el plan no cabe en una semana, la opción se apaga y se explica — pero no hay nada que ofrecer a quien de verdad tiene prisa. Una entrega express con recargo es la respuesta obvia y es una decisión comercial, no del cotizador. **Decisión tuya:** si existe, a qué precio y con qué plazo. | `[tuyo]` |

## Bloque 10 — El plan de claridad

**De dónde sale (2026-08-11).** Un repaso del sitio entero —las diez páginas,
mirando estructura, texto, acciones por página y el recorrido completo— dejó un
diagnóstico incómodo y útil: *el catálogo creció más rápido que la arquitectura
que tiene que ordenarlo.* Se vendían 18 cosas distintas, el desplegable de
`/contacto` tenía 12 opciones y la barra 9 enlaces, en un sitio que sigue en beta,
sin dominio propio y sin un solo testimonio. Lo que el visitante lee no es «estos
saben lo que hacen», es «estos hacen de todo».

Notas de aquel repaso, para poder comparar la próxima vez: coherencia visual 9,
claridad del texto 8, arquitectura 5, embudo 6, credibilidad 4.

**Ya hecho:** las tres fronteras del bloque 9 (Seguridad / Care / Diagnóstico),
que eran el nudo más caro, y la puerta del catálogo.

**Hecho el 2026-08-11 (punto 55, `/servicios` deja de ser Care disfrazada).** La
página abre con las **seis cosas que se venden**, cada una con su precio, su
forma de cobro y —lo que de verdad orienta— la situación del cliente en vez de
la categoría del producto: «ya tienes sitio y no sabes si está abierto de par en
par» encuentra a más gente que «auditoría de seguridad». Care baja de `<h1>` a
una entrada más de la lista, y eBot y Seguridad por fin están donde alguien los
busca. La lista sale de `catalogo.ts`, que **compone cada cifra de la fuente de
su producto**: es la única pantalla donde se ven todos los precios juntos, y una
lista comparativa con una cifra vieja hace más daño que no tener lista.

Con eso se cierra también el desequilibrio del viejo punto 59: `/servicios` pasa
de 563 palabras y **2** acciones a 935 y **10**. Sigue por debajo de las 16 de
`/planes`, que es lo que se buscaba — ahora es una página desde la que se puede
llegar a algo.

**Lo que queda, por orden de lo que rinde:**


**Hecho el 2026-08-11 (puntos 56, 57 y 58).** La portada baja de **17 acciones a
11** y por fin nombra eBot y Seguridad, en un bloque propio («No solo hacemos
webs») colocado después de los planes: primero lo que trae a la gente, y con el
precio de su sitio ya en la cabeza, lo que puede sumarle.

De dónde salieron las seis acciones que se fueron, porque ninguna era contenido:
los tres pilares eran tres enlaces a la misma página que su propio «Ver todo» —
cuatro clics para un destino, y un argumento no necesita ser un botón—; el
«Ver planes en detalle» repetía lo que ya hacen las cuatro tarjetas de precio; y
los cuatro dominios de la banda de prueba eran cuatro salidas a sitios ajenos en
la primera pantalla, sin ninguna vuelta. Los dominios siguen escritos —se pueden
teclear y comprobar, que es el argumento entero de esa banda— pero la puerta para
abrirlos es ahora `/proyectos`, donde cada ficha ya tiene su regreso.

**La acción principal de la portada pasa a ser cotizar** en vez de «Ver planes».
Las dos llevan al precio por caminos distintos: `/planes` enseña cuatro cifras y
deja a la persona decidiendo sola; el cotizador le da SU cifra en cuatro
respuestas y termina en un mensaje redactado. Es el camino que mejor convierte
(bloque 6) y la portada no lo ofrecía ni una vez. **Es una propuesta comercial
mía y se revierte en una línea** si prefieres lo contrario.

**Cada ficha de `/proyectos` tiene su vuelta** («¿Quieres uno así? →» al
cotizador), dentro de la tarjeta y no en el cierre de la página: quien se iba en
la primera tarjeta nunca llegaba al cierre. La página sube de 10 a 14 acciones y
está bien — son dos destinos por ficha, su sitio y el nuestro, y antes solo
existía el primero.

**Un solo verbo en todo el sitio:** «Pedir» para contratar algo concreto,
«Cotizar» para pedir precio a medida, «Hablar por WhatsApp» para escribir y
«Ver» para navegar. Se cambiaron «Quiero eBot» → «Pedir eBot», «Quiero la
revisión» → «Pedir la revisión», «Ver mi precio en 4 preguntas» → «Cotizar en
cuatro preguntas» y «Escribir por WhatsApp» → «Hablar por WhatsApp». De paso cayó
un voseo suelto en `/contacto` («Chateá con nosotros»), que era la única frase del
sitio que no hablaba de tú.

**Y lo que pesa más que los cinco juntos:** nada de esto se arregla programando.
Un desconocido que ve $850 por adelantado no duda del diseño — duda de quién está
detrás. Eso es el bloque 2 (quién eres, datos legales, testimonios, reversión de
riesgo) y sigue entero sin hacer. **El sitio está más pulido que respaldado.**

---

## Fuera de alcance mientras no haya presupuesto

No están olvidados: están descartados a propósito, y conviene no volver a
evaluarlos cada mes.

| Descartado | Por qué |
|---|---|
| Checkout / depósito en línea `[$]` | Exige cuenta de comercio y comisión por transacción. Hasta entonces el cierre es por WhatsApp o formulario |
| Panel de cliente `[$]` | Necesita servidor y base de datos con coste recurrente. Contradice el «$0 de infraestructura» que hoy sostiene el margen |
| BrowserStack o similar `[$]` | Ya cubierto gratis: `npm run medir:movil` mide el layout real en Chromium headless |
| Auditoría de seguridad formal **de este sitio** `[$]` | Un sitio estático sin panel ni base de datos tiene una superficie de ataque mínima. Cuando haya panel de cliente, se replantea. No confundir con el servicio de `/seguridad/`, que se le vende a sitios de clientes y sí está publicado |
| Community manager, producción de vídeo, patrocinios `[$]` | Plan de redes, no de repo |

---

## Sobre el análisis externo del 2026-08-03

Ese informe se hizo desde el navegador, sin acceso al código. Acierta en lo
grande —la falta de prueba social y de dominio propio son los dos agujeros
reales— pero conviene no actuar sobre estos cuatro puntos:

- **«No detecté datos estructurados (schema.org)».** Sí los hay, y desde hace
  tiempo: `Organization`, `FAQPage`, `Service` + `Offer` y `CollectionPage`. Lo
  que falta es matizar `Organization` a `LocalBusiness` (punto 21), que es otra
  cosa y mucho más pequeña.
- **«URLs limpias» como fortaleza.** Es justo al revés: el sitio sirve
  `/contacto.html`. Es el punto 1, y es el único con fecha límite.
- **«Ocultar los íconos de redes “próximamente”».** Ya no enlazan a ningún
  sitio: se dibujan apagados, fuera del orden de foco y con `aria-hidden`,
  precisamente para no llevar a un 404. Si aun así se prefiere no anunciarlos,
  es un filtro de una línea en `Footer.astro` — pero no es el bug que describe.
- **«No pude verificar el responsive» y «auditar el contraste».** Los dos están
  medidos: el layout móvil con `npm run medir:movil`, y el contraste del texto
  secundario dio 10,4 : 1 sobre fondo real, muy por encima del 4,5 que pide AA.

---

## Decisiones tomadas — no reabrir sin motivo nuevo

Esto no son pendientes: son cosas que se decidieron a propósito y que conviene
no deshacer por inercia.

- **Precios públicos.** Es la decisión estratégica más fuerte del sitio y la
  mayoría de la competencia no se atreve. Todo lo demás se apoya ahí.
- **El anclaje de `/planes` está bien ordenado.** Corporate ($850, «Recomendado»)
  primero y Start ($295) al final: el rango se lee de arriba abajo y $295
  aterriza como alivio, no como techo.
- **En el cotizador, el precio va ANTES de pedir los datos.** Es lo contrario de
  lo que hace casi todo el mundo, y es deliberado: pedir el correo para
  «revelar» el precio contradiría la promesa del resto del sitio.
- **El cotizador recomienda el plan más pequeño que cubre lo marcado**, y dice
  por qué. Recomendar de más se nota y quema la confianza que el resto
  construye.
- **Las imágenes van de fondo, nunca como pieza de producto.** Montadas como
  producto, el ojo iba primero a la foto y el titular quedaba de pie de imagen.
  Hoy el titular está 2× por encima del cuerpo en contraste efectivo, y ese
  salto es lo que fija el orden de lectura.
- **Sin librería de animación.** Aquí vivió GSAP + ScrollTrigger: 43 KB
  comprimidos, el 74 % de todo el JS del sitio, para poner un atributo cuando un
  elemento entraba en pantalla.
- **El bloque de cierre («¿Empezamos?») vive solo en `/proceso`.** Repetir la
  misma petición en cinco páginas la convierte en ruido.
- **No se miden los sitios de los clientes** (2026-08-03). `npm run medir` sigue
  existiendo y funcionando, pero las fichas de `/proyectos` se publican sin
  banda de métricas. El foco del trabajo es este sitio, no el rendimiento de
  proyectos ajenos que además pueden cambiar sin avisar y dejar publicada una
  cifra falsa. `publishedMetrics()` ya cubre ese caso: sin `measuredAt` no
  dibuja nada, así que no hay que tocar código para sostener esta decisión.

---

## Qué medir en cuanto haya analítica

Sin datos, todo lo de arriba es criterio informado, no certeza. Los cuatro
números que de verdad deciden:

1. **Terminación del cotizador por paso.** Dónde se cae la gente dice qué
   pregunta está mal formulada.
2. **Vieron el precio → dejaron sus datos.** Valida o tumba la decisión de
   enseñar el precio primero.
3. **Cotizador vs. formulario directo**, en leads que acaban en venta. No en
   leads: en ventas.
4. **Plan estimado vs. plan vendido.** Si divergen, las reglas de `quote.ts`
   están mal calibradas (punto 18).

---

## Fuera del repo por seguridad

Estos archivos existen en el disco local del owner y están bloqueados por
`.gitignore`. **Nunca commitearlos.**

- Documentos de estrategia comercial y metodología interna
- Prompts de trabajo
- Instrucciones internas del asistente
- `node_modules/`, `dist/`, `.astro/` — artefactos de build
