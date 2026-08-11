# PanaClaw

Sitio web de PanaClaw, agencia de sitios web en Panamá. Astro con salida
estática pura, desplegado en Netlify.

**En producción:** https://panaclaw.netlify.app

---

## Arranque rápido

```bash
npm install
npm run dev        # http://localhost:4321
```

Node 22. No hace falta nada más para trabajar en el sitio: no hay base de datos
ni servicios externos que levantar. El chat es lo único que necesita Netlify, y
cuando no lo encuentra degrada solo a WhatsApp (ver [`docs/chat.md`](docs/chat.md)).

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Genera `dist/` |
| `npm run preview` | Sirve `dist/` localmente |
| `npm run check` | `astro check` — tipos de TypeScript y diagnósticos de `.astro` |
| `npm run medir:movil` | Auditoría de layout en móvil sobre `dist/` (requiere `npm run build` antes) |
| `npm run medir:cotizador` | Auditoría del cotizador sobre `dist/`: recorrido, etiquetas y totales |
| `npm run medir` | Mide los proyectos publicados con Lighthouse |
| `npm run capturas` | Captura la portada de cada proyecto en `src/assets/proyectos/` |
| `npm run brand` | Regenera favicons y `og.png` en `public/` — solo al cambiar el branding |

`npm run build` **no** comprueba tipos. Para eso está `npm run check`.

### Las auditorías de navegador

`npm run medir:movil` comprueba sobre el sitio ya construido que el navbar quede
centrado **y que su contenido quepa dentro del pill** —son dos cosas distintas, y
la diferencia costó tres desbordes: el pill puede estar centrado al píxel
mientras sus enlaces se comprimen contra el CTA—, que ninguna página deje espacio
muerto tras el footer, que el footer no se coma media pantalla de más y que el
panel del chat no se corte. Nació de fallos
reales, y cada comprobación se verificó reintroduciendo el bug para confirmar que
salta. Sale con código 1 si algo se pasa de presupuesto.

`npm run medir:cotizador` hace lo mismo con el cotizador: que el envío pase por
`/gracias/` —el único punto donde el píxel cuenta una conversión—, que la cifra
sea la misma en el total corriente, en el resultado y en el mensaje de WhatsApp,
que los precios coincidan con `/planes`, y que **cada etiqueta mueva el total
exactamente lo que anuncia**, para las doce capacidades y los cuatro planes.
Nació de un fallo que se dio por comprobado durante semanas porque leyendo el
código parecía correcto.

Desde que existe el servicio de seguridad, el cotizador lleva **dos cifras** —lo
que se paga de una vez y lo que se paga cada mes— y el arnés las comprueba por
separado en los tres caminos. Es la parte que más fácil sería romper sin que se
notara: una mensualidad sumada al total de una vez sigue dando un número
creíble.

Las dos comparten `scripts/_harness.mjs` (cargar Playwright y servir `dist/`).
La regla al añadir una comprobación: **romper lo que vigila y ver que salta**.
Un cepo que también pasa con la función desactivada no vigila nada — le ocurrió
a la primera versión de dos de las que hay ahí.

Necesita Playwright, que **no** es dependencia del proyecto a propósito —
arrastra la descarga de un navegador y encarecería cada build de Netlify para
algo que solo se corre a mano:

```bash
npm i -D playwright && npx playwright install chromium
```

`npm run medir` necesita una API key gratuita de PageSpeed Insights; los pasos
están en la cabecera de `scripts/measure-projects.mjs`.

### Las capturas de `/proyectos`

`npm run capturas` abre cada sitio de `src/data/projects.ts` y guarda su portada
en `src/assets/proyectos/<slug>.jpg`. Usa el mismo Playwright que la auditoría de
móvil. Acepta slugs sueltos para rehacer solo uno:

```bash
npm run capturas -- livesync-pro
```

Deja dos pasos a mano a propósito: **mirar** cada captura antes de publicarla —el
script no distingue una portada de un aviso de cookies tapándola— y enlazarla en
`projects.ts`, que es lo que decide qué se publica. Al terminar, el script imprime
los imports listos para pegar.

---

## Estructura

```
src/
├── pages/          Una página = un archivo. kb.json.ts genera la base del chat.
├── layouts/        BaseLayout.astro — head, SEO, JSON-LD, nav y footer.
├── components/     Piezas reutilizables (.astro con estilos con scope).
├── data/           TODO el contenido y los precios. Ver abajo.
├── scripts/        motion.ts — utilidades de animación (sin librerías).
├── styles/         global.css — tokens de marca, navbar, hero, utilidades.
└── assets/         Imágenes procesadas por astro:assets.

netlify/functions/  chat.mts — endpoint del chat. Único código de servidor.
scripts/            Herramientas que se corren a mano, no en el build.
docs/               Arquitectura y decisiones. Ver el índice al final.
```

### `src/data/` es el centro de gravedad

Todo el contenido vive ahí, no en las páginas. Cambiar el precio de un plan es
**una sola edición** y se propaga a `/planes`, al cotizador, al formulario de
contacto y a lo que responde el chat.

| Archivo | Qué manda |
|---|---|
| `site.ts` | Nombre, descripción, WhatsApp, horario |
| `plans.ts` | Los cuatro planes y el diagnóstico |
| `ebot.ts` | eBot: el bot multicanal con panel — precio, canales, panel y costos del cliente |
| `seguridad.ts` | Seguridad web: los tres planes de protección, la comparativa y lo que no cubre |
| `modules.ts` | Capacidades que se suman a un plan |
| `care.ts` | Planes de mantenimiento |
| `services.ts` | Los tres pilares, el proceso y los enlaces del nav |
| `projects.ts` | Trabajo publicado |
| `quote.ts` | Motor del cotizador — **compone precios de `plans.ts`, no los repite** |
| `faq.ts`, `footer.ts`, `images.ts`, `links.ts` | Ayuda, pie, imágenes y rutas |

---

## Reglas que no se negocian

Las cinco que más han mordido. La lista completa, con el porqué de cada una,
está en [`docs/convenciones.md`](docs/convenciones.md).

1. **Nunca hardcodear rutas internas.** Usar `routes.*` o `withBase()` de
   `src/data/links.ts`.
2. **Los precios no se duplican.** El cotizador y la base del chat los componen
   de `plans.ts`, `modules.ts`, `ebot.ts` y `seguridad.ts`. Un cotizador que diga
   un número distinto al de `/planes` destruye justo la confianza que el sitio
   vende.
3. **Cero jerga en el copy de cara al cliente.** Solo los nombres que el cliente
   ya reconoce: WordPress, Google, WhatsApp, GitHub, Yappy. Si una frase solo la
   entiende un programador, está mal escrita para esta página.
4. **`prefers-reduced-motion: reduce` desactiva todas las animaciones.**
5. **Nada de datos inventados.** Métricas, testimonios y casos solo se publican
   medidos o verificados. Es el argumento entero del sitio: una cifra inflada en
   una página desmonta las otras once.

---

## Despliegue

Netlify construye y publica en cada push a `main`. `netlify.toml` define el
comando, las cabeceras de seguridad y la caché.

GitHub Actions **no** despliega: `.github/workflows/ci.yml` solo verifica que el
proyecto compile, en cada push a `main` y en cada pull request.

### Variables de entorno

Se configuran en el panel de Netlify, **nunca en el repo**:

| Variable | Para qué |
|---|---|
| `ANTHROPIC_API_KEY` | Chat con Claude (tiene prioridad si está) |
| `GROQ_API_KEY` | Alternativa más barata para el chat |
| `CHAT_PROVIDER` | Opcional, `groq` o `anthropic` para fijar cuál se usa. El entorno puede traer claves inyectadas por la plataforma que tú no pusiste — ver [`docs/chat.md`](docs/chat.md) |
| `CHAT_MODEL` | Opcional, para fijar el modelo |
| `CHAT_MAX_PER_DAY` | Opcional, techo diario de mensajes del chat (300 por defecto) |

Sin ninguna clave el endpoint sigue respondiendo: deriva a WhatsApp en vez de
fallar.

---

## Documentación

Tres documentos, sin solaparse. Si algo no cabe en ninguno, probablemente no
haga falta escribirlo.

| Documento | Qué contiene |
|---|---|
| [`docs/ESTADO.md`](docs/ESTADO.md) | **Hallazgos y pendientes.** El único sitio donde se mira qué falta y cómo está el sitio hoy |
| [`docs/convenciones.md`](docs/convenciones.md) | Las reglas del proyecto y el troubleshooting |
| [`docs/chat.md`](docs/chat.md) | Cómo está armado el chat y por qué |

`ESTADO.md` es un documento vivo: **lo que se cierra se borra**, no se archiva.
El historial de git guarda lo cerrado.
