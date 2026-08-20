# Convenciones y troubleshooting

Las reglas del proyecto y los errores que ya han mordido, con el porqué de cada
uno. El resumen de las cinco más importantes está en el
[README](../README.md#reglas-que-no-se-negocian).

---

## Reglas que no se negocian

1. **Rutas internas: nunca hardcodear `href="/..."`.** Usar `routes.*` o
   `withBase('...')` de `src/data/links.ts`. Hoy el sitio se sirve en la raíz del
   dominio, pero ese helper es lo único que hace falta tocar si algún día vuelve
   a servirse bajo un subpath. `npm run medir:enlaces` lo vigila en cada PR.
2. **Datos siempre en `src/data/*.ts`.** Cambiar el precio de un plan = una sola
   edición. Cero copy-paste entre páginas.
3. **Un solo `<h1>` por página.**
4. **Cero placeholders en producción:** nada de `#`, `lorem`, `G-XXXXXXXXXX`.
   `npm run medir:enlaces` falla si queda un `href="#"` o un `href=""` sueltos.
5. **Solo animar `transform` y `opacity`.** Todo lo demás provoca repintados.
6. **Sin librería de animación.** El movimiento se hace con transiciones CSS y
   JavaScript solo decide cuándo dispararlas (`IntersectionObserver` en
   `Reveal`). Aquí vivió GSAP + ScrollTrigger: pesaba 43 KB comprimidos —el 74 %
   de todo el JS del sitio— y lo único que hacía era poner un atributo cuando un
   elemento entraba en pantalla. En una página que vende abrir en menos de un
   segundo, eso no se sostiene. Si algún día hace falta una línea de tiempo de
   verdad (scrub, pin, morphing), se vuelve a evaluar entonces.
7. **Un solo acento cromático:** naranja `--flash-orange #FF5100` para UI y para
   los acentos de texto; rojo `--ember-red #FF1E1E` reservado a fondos (shader
   del hero, vetas de las imágenes). El ember no debe aparecer en ningún texto.
8. **`prefers-reduced-motion: reduce` desactiva todas las animaciones.**
   Implementado en `Reveal`, `SmoothScroll` y `HeroShader`.
9. **Las imágenes van de fondo, nunca como pieza de producto.** Se montan con
   `<SceneBg>`: a sangre, apagadas y bajo un velo que abre carril al texto. Lo
   que brilla es el titular.
10. **Nada duplica los precios.** El cotizador (`quote.ts`) y la base del chat
    (`kb.json.ts`) los componen de `plans.ts`, `modules.ts`, `ebot.ts` y
    `seguridad.ts`. Un cotizador o un bot que digan un número distinto al de
    `/planes` destruyen justo la confianza que el sitio vende. Corolario desde
    que hay servicios mensuales: **una cifra de una vez y una mensual no se
    suman jamás**, ni para enseñar un número más redondo. El cotizador lleva dos
    totales y `medir:cotizador` los vigila por separado.
11. **Estilos para nodos creados por JS: siempre `:global()`** colgando de un
    ancestro que sí esté en la plantilla. Ha mordido tres veces.
12. **Cero jerga en el copy de cara al cliente.** Nada de Supabase, Railway,
    Jamstack, CDN, LCP, Lighthouse ni "scope creep". Solo los nombres que el
    cliente ya reconoce: WordPress, Google, WhatsApp, GitHub, Yappy. Si una frase
    solo la entiende un programador, está mal escrita para esta página.
13. **El bloque de cierre ("¿Empezamos?") vive solo en `/proceso`.** Estaba
    repetido en cinco páginas pidiendo lo mismo con cinco titulares distintos;
    repetir la misma petición cinco veces la convierte en ruido. La salida en el
    resto la dan el CTA del nav y el del footer.
14. **Nada de datos inventados.** Métricas, testimonios y casos solo se publican
    medidos o verificados, y las cifras llevan la fecha de su medición
    (`measuredAt` en `projects.ts`). Un número sin fecha deja de ser cierto sin
    que nadie lo toque.
15. **Una sola fuente de verdad para cada medida de layout.** Dos reglas
    calculando el mismo ancho es el bug que más ha costado en este repo: pasó con
    el navbar (`min-width:95vw` peleando con el carril del contenedor) y con el
    panel del chat (`width:calc(100vw - 28px)` peleando con el desplazamiento del
    padre). Ambos se veían bien en escritorio y rotos en teléfono.
    `npm run medir:movil` vigila los dos.

---

## El formulario de contacto, explicado

Es el punto que más confusión ha generado, así que queda escrito.

El `<form>` de `src/pages/contacto.astro` tiene dos caminos, y **cuál se usa se
declara en un solo sitio**:

```ts
// src/data/site.ts
export const formDestination: FormDestination = 'netlify';
```

- **`'netlify'`** (hoy) — el `<form>` sale con los atributos `data-netlify` y
  **Netlify Forms recibe el `POST`**. Los envíos aparecen en el panel de Netlify.
  El script ni siquiera engancha el listener.
- **`'whatsapp'`** — el `<form>` sale sin atributos de Netlify, el script
  intercepta el `submit`, compone un mensaje con los campos y abre `wa.me` con el
  texto ya redactado, redirigiendo a `/gracias`. Si el navegador bloquea el
  pop-up, navega a `wa.me` en la misma pestaña.
- El honeypot `bot-field` se respeta en ambos caminos.

**Ese valor gobierna tres cosas a la vez**, y por eso vive en `site.ts` y no en la
página: los atributos del `<form>`, el copy visible (la bajada de la tarjeta y la
etiqueta del botón — no puede decir "Enviar por WhatsApp" si el POST se va a
Netlify) y lo que declara `/privacidad` sobre a dónde van tus datos. Cambiar el
destino y dejar el texto viejo convierte la política de privacidad en una
declaración falsa.

> **Trampa que esto cerró.** Antes el camino lo decidía
> `/(^|\.)netlify\.(app|com)$/.test(location.hostname)`. El día que el sitio
> estrenara dominio propio, el `test` habría dado `false` y el formulario habría
> vuelto solo al camino de WhatsApp: los envíos que llegaban por Netlify Forms
> habrían dejado de llegar sin que nadie tocara nada y sin ningún síntoma
> visible. La lección general es la regla 15 — una sola fuente de verdad — pero
> aplicada al comportamiento, no al layout: **nada crítico se deduce del entorno
> cuando se puede declarar.**

Para recibir los envíos por **correo** en vez de por WhatsApp, la vía limpia es
un endpoint externo (Formspree, Web3Forms): cambiar el `action` del form, añadir
el destino a `FormDestination` y tratarlo en la página como uno más.

---

## Troubleshooting

**"Los reveals no muestran contenido"** → Verifica que `Reveal.astro` conserve el
bootstrap `if (document.readyState !== 'loading') initReveals()` al final. Los
`<script type="module">` son diferidos y `astro:page-load` se dispara antes; sin
el bootstrap, el listener llega tarde.

**"El shader no aparece"** → Verifica que el navegador soporte WebGL
(`chrome://gpu`). Si no, se muestra la imagen fallback automáticamente.

**"Cambié un precio y no se actualiza en el formulario de contacto"** → Verifica
que estés editando `src/data/plans.ts`. El `<select>` de `/contacto` se genera de
`planOptions`, que se construye de `plans`.

**"El build falla por TypeScript"** → `tsconfig.json` extiende
`astro/tsconfigs/strict`. Ojo: `npm run build` **no** comprueba tipos — para eso
está `npm run check`.

**"Puse un estilo en la página y no se aplica al componente"** → Los estilos con
scope de Astro se compilan con el `data-astro-cid-*` de la página, y ese atributo
**no** llega a la raíz de un componente hijo. Escribe `.ancestro :global(.clase)`,
donde `.ancestro` sí sea un elemento de la página.

**"Cambié el logo o los colores y el favicon sigue igual"** → Los favicons y
`og.png` son archivos generados, no se recalculan en el build. Corre
`npm run brand` y commitea lo que cambie en `public/`.

**"El texto de una sección se me fue al centro en vez de al carril izquierdo"** →
Esa sección es `display:flex` o `grid` y `.container` se convirtió en item. Está
blindado con `width:100%` en `global.css`; si vuelve a pasar, alguien lo quitó.

**"Puse `hidden` en un elemento y sigue ahí"** → Si el elemento tiene
`display:flex` o `grid` propio, gana sobre el `display:none` del user agent. Está
blindado con `[hidden]{display:none !important}` en `global.css`.

**"Un `<section>` mío tiene un hueco enorme arriba y abajo"** → La regla global
`section{padding:120px 0}` aplica a **todo** `<section>`, incluidos los que son
chrome de interfaz (el panel del chat, por ejemplo). Ponle `padding:0` explícito.

**"El chat responde cosas raras o dice que no sabe algo que sí está"** → Mira
primero `sources` en la respuesta del endpoint: casi siempre la recuperación
trajo el hecho equivocado, y se arregla añadiendo frases de intención en
`kb.json.ts`, no cambiando de modelo. Ver [`chat.md`](chat.md).

**"Toqué un `padding` en `global.css` y se rompió otra cosa"** → `.container` usa
el shorthand `padding` y aparece dos veces (base y media query de 640 px).
Cualquier otra regla con la misma especificidad que use `padding` sobre un
`.container` va a perder por orden de aparición. Usa longhands (`padding-block`)
y sube la especificidad, como hace `.hero .hero-inner`.

**"Se ve bien en el navegador y roto en el teléfono"** → Corre
`npm run build && npm run medir:movil`. Si pasa y aun así se ve mal en un iPhone
real, sospecha de unidades de viewport: `100vw` y `100vh` en Safari de iOS no
siempre miden lo que se ve. La solución que ha funcionado las dos veces es no
calcular el tamaño con esas unidades, sino fijar `left`/`right` (o `top`/`bottom`)
y dejar que el navegador derive la medida.
