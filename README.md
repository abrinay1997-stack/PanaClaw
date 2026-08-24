# PanaClaw

Sitio web de PanaClaw, agencia de sitios web en Panamá. Astro con salida
estática pura, desplegado en Netlify.

**En producción:** https://panaclaw.com

Este README es el **mapa del repositorio**. Está pensado para que cualquiera —
persona nueva en el equipo de PanaClaw, o un asistente de IA que llega sin contexto —
pueda orientarse en cinco minutos. Si algo del sitio no responde a lo que este
archivo dice, es un bug de la documentación y toca actualizarla.

---

## Los tres documentos que hay que leer

En orden. Si estás con prisa, lee solo el 1.

1. **Este README** — mapa del proyecto, comandos, dónde vive cada cosa.
2. **[`docs/ESTADO.md`](docs/ESTADO.md)** — diario del sitio: qué se hizo, qué
   falta, qué está descartado. Único sitio donde vive el pendiente.
3. **[`docs/convenciones.md`](docs/convenciones.md)** — reglas del proyecto y
   troubleshooting. Léelo antes del primer PR: casi todos los errores comunes
   están cazados ahí.

Para trabajar con el chat, ver también **[`docs/chat.md`](docs/chat.md)**.

---

## Arranque rápido

```bash
npm install
npm run dev        # http://localhost:4321
```

Node 22. No hace falta base de datos ni servicios externos: el sitio es
estático. El chat es lo único que necesita Netlify Functions, y cuando no las
encuentra (dev, GitHub Pages) degrada solo a WhatsApp.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Genera `dist/` |
| `npm run preview` | Sirve `dist/` localmente |
| `npm run check` | `astro check` — tipos y diagnósticos |
| `npm run medir:movil` | Auditoría de layout en móvil sobre `dist/` |
| `npm run medir:cotizador` | Auditoría del cotizador sobre `dist/` |
| `npm run medir:enlaces` | Enlaces internos y anclas rotas sobre `dist/` |
| `npm run medir` | Mide los proyectos publicados con Lighthouse |
| `npm run capturas` | Captura la portada de cada proyecto |
| `npm run brand` | Regenera favicons y `og.png` — solo al cambiar el branding |

`npm run build` **no** comprueba tipos. Para eso está `npm run check`.

**Las tres auditorías (`medir:movil`, `medir:cotizador`, `medir:enlaces`) corren
solas en cada PR** — ver [`.github/workflows/ci.yml`](.github/workflows/ci.yml).
Un PR con el CI en rojo no se mergea; así es como el sitio no se rompe cuando
varias personas lo tocan a la vez. Para reproducir localmente antes de subir:

```bash
npm run build
npm run medir:enlaces          # no necesita Playwright
npm i -D playwright && npx playwright install chromium
npm run medir:movil
npm run medir:cotizador
```

`medir:movil` y `medir:cotizador` necesitan Playwright — que **no** es
dependencia del proyecto a propósito para que no infle cada build de Netlify
(en CI se instala solo para ese job, sin tocar `package.json`). Ver
[`docs/convenciones.md`](docs/convenciones.md) para el porqué de cada
comprobación.

---

## Mapa del código

```
src/
├── pages/          Una página = un archivo. También sirve JSON (kb.json.ts, robots.txt.ts).
│   └── blog/       Listado (index.astro) y plantilla individual ([slug].astro).
├── content/        Content Collections. Todo el contenido tipado y validado.
│   └── blog/       Los posts en Markdown. Uno por archivo.
├── layouts/        BaseLayout.astro — <head>, SEO, JSON-LD, nav y footer.
├── components/     Piezas reutilizables (.astro con estilos con scope).
├── data/           TODO el contenido y los precios. Ver abajo.
├── scripts/        motion.ts — utilidades de animación sin librerías.
├── styles/         global.css — tokens de marca, navbar, hero, utilidades.
├── assets/         Imágenes procesadas por astro:assets (versiones responsive).
└── content.config.ts  Schema del blog. Zod valida cada post en el build.

public/             Archivos servidos tal cual (favicons, og.png, robots.txt).
netlify/functions/  chat.mts — endpoint del chat. Único código de servidor.
scripts/            Auditorías (algunas corren solas en CI, ver arriba) y capturas.
brand-assets/       Fuentes originales de logo (SVG y PNG del usuario). NO se sirven.
docs/               Estado, convenciones y chat.
netlify.toml        Comando de build, cabeceras de seguridad y política de caché.
astro.config.mjs    Dominio del sitio, formato de URLs, plugin del sitemap.
```

### `src/data/` es el centro de gravedad

Todo el contenido vive ahí, no en las páginas. Cambiar el precio de un plan es
**una sola edición** y se propaga a `/planes`, al cotizador, al formulario de
contacto y a lo que responde el chat. Es la regla 2 y la más importante.

| Archivo | Qué manda |
|---|---|
| `site.ts` | Nombre, tagline, descripción, WhatsApp, horario |
| `plans.ts` | Los cuatro planes de sitio web + el diagnóstico |
| `ebot.ts` | eBot: precio, canales, panel, costos externos del cliente |
| `seguridad.ts` | Los tres planes de ciberseguridad, comparativa y exclusiones |
| `modules.ts` | Capacidades adicionales que se suman a un plan |
| `care.ts` | Planes de mantenimiento |
| `catalogo.ts` | Lista unificada de todo lo que se vende. Compone precios de las fuentes anteriores |
| `services.ts` | Los tres pilares, el proceso y los enlaces del nav |
| `projects.ts` | Trabajo publicado |
| `quote.ts` | Motor del cotizador — **compone precios de `plans.ts`, no los repite** |
| `faq.ts`, `footer.ts`, `images.ts`, `links.ts`, `analytics.ts` | Ayuda, pie, imágenes, rutas, identificadores de píxel/GA |

### `src/content/blog/` — cómo se publica un post

Sin CMS. Sin panel. Un archivo `.md` por post. El schema
(`src/content.config.ts`) obliga a que cada post tenga título, descripción,
fecha, categoría, keywords y `readingTime` — si falta cualquiera, el build
falla en vez de publicar algo mal formado.

```md
---
title: "Cómo elegir agencia web en Panamá"
description: "Qué preguntar antes de firmar. Cinco señales que separan un..."
date: 2026-08-20
category: guias        # precios | guias | comparativas | casos | panama
keywords: ["agencia", "panamá", "elegir"]
readingTime: 6
draft: false           # opcional, oculta del listado si es true
---

Contenido en Markdown...
```

Publicar es hacer commit y push. Netlify redeployea en ~30 s. El listado en
`/blog/` ordena por fecha desc; cada post lleva breadcrumbs, JSON-LD `Article`,
posts relacionados (por keyword compartida) y CTA al cotizador al final.

**El blog NO está en el nav principal, solo en el footer.** Es una decisión
comercial: el nav es quirúrgico y comercial; el blog capta tráfico orgánico y
llega al embudo por enlaces internos + resultados de Google.

---

## Reglas que no se negocian

Las cinco que más han mordido. La lista completa, con el porqué de cada una,
está en [`docs/convenciones.md`](docs/convenciones.md).

1. **Nunca hardcodear rutas internas.** Usar `routes.*` o `withBase()` de
   `src/data/links.ts`.
2. **Los precios no se duplican.** El cotizador y la base del chat los componen
   de `plans.ts`, `modules.ts`, `ebot.ts` y `seguridad.ts`. Un cotizador que diga
   un número distinto al de `/planes` destruye la confianza que el sitio vende.
3. **Cero jerga en el copy de cara al cliente.** Solo los nombres que el cliente
   ya reconoce: WordPress, Google, WhatsApp, GitHub, Yappy. Si una frase solo la
   entiende un programador, está mal escrita para esta página.
4. **`prefers-reduced-motion: reduce` desactiva todas las animaciones.**
5. **Nada de datos inventados.** Métricas, testimonios y casos solo se publican
   medidos o verificados. Es el argumento entero del sitio: una cifra inflada en
   una página desmonta las otras once.

---

## Branding

El logo `[/]` vive en `public/favicon.svg` como **fuente única**. Los otros
formatos se derivan de él:

| Archivo | Tamaño | Para qué |
|---|---|---|
| `favicon.svg` | vector | Pestaña del navegador (moderno) |
| `favicon-32.png` | 32×32 | Fallback histórico |
| `icon-192.png` | 192×192 | Google Search prefiere este para el resultado |
| `icon-512.png` | 512×512 | Android/PWA + `logo` del JSON-LD |
| `apple-touch-icon.png` | 180×180 | iOS al añadir a inicio (fondo negro obligatorio) |

Se regeneran con `rsvg-convert` desde el SVG. El script está en el commit que
los introdujo — `git log --grep favicon` para verlo.

Los **originales del usuario** (PNG y SVG sin procesar) viven en
`brand-assets/` con su README explicando cómo se procesaron. No los sirve
nadie: son fuente, no producto.

Tokens de color en `src/styles/global.css`:

- `--deep-black: #100101` — fondo
- `--flash-orange: #FF5100` — acento principal, único color de acción
- `--ember-red: #FF1E1E` — solo para fondos ambientales, nunca en texto
- `--soft-white: #FFF7F7` — texto principal
- `--studio-gray: #BABABA` — texto secundario

Tipografía self-hosted: **Archivo** (300/400/500/600/700), del paquete
`@fontsource/archivo`. Los pesos 600 y 700 llevan `<link rel="preload">` en
`BaseLayout.astro` porque son los del H1/H2 above-the-fold.

---

## SEO — lo que ya está en su sitio

Auditado el 2026-08-20 (ver `docs/ESTADO.md` para el detalle del reporte y
qué se hizo):

- **Schema JSON-LD `LocalBusiness` + `ProfessionalService`** en la home, con
  `sameAs` (Facebook + Instagram), `priceRange`, `address` panameño,
  `contactPoint`. Es la señal fuerte para búsquedas locales en Panamá.
- **Sitemap con `lastmod`**, generado por `@astrojs/sitemap` en el build.
- **Canonical y OpenGraph** en todas las páginas, todos apuntando a
  `panaclaw.com` (fuente en `astro.config.mjs`).
- **Iconos declarados en 32, 192 y 512** para que Google Search muestre el
  favicon del sitio en resultados.
- **Píxel de Meta** activo en las 13 páginas, `Lead` en `/gracias/`.
- **GA4**: el código está listo, falta el identificador `G-…` en
  `src/data/analytics.ts` (pendiente en `ESTADO.md`).

---

## Despliegue

Netlify construye y publica en cada push a `main`. `netlify.toml` define el
comando, las cabeceras de seguridad y la caché.

GitHub Actions **no** despliega: `.github/workflows/ci.yml` solo verifica que
el proyecto compile, en cada push a `main` y en cada pull request.

### Variables de entorno

Se configuran en el panel de Netlify, **nunca en el repo**:

| Variable | Para qué |
|---|---|
| `ANTHROPIC_API_KEY` | Chat con Claude (tiene prioridad si está) |
| `GROQ_API_KEY` | Alternativa más barata para el chat |
| `CHAT_PROVIDER` | Opcional, `groq` o `anthropic`. Ver [`docs/chat.md`](docs/chat.md) |
| `CHAT_MODEL` | Opcional, para fijar el modelo (acepta varios separados por comas; los de por defecto quedan de repuesto) |
| `CHAT_MAX_PER_DAY` | Opcional, techo diario del chat (300 por defecto) |

Sin ninguna clave el endpoint sigue respondiendo: deriva a WhatsApp en vez de
fallar.

---

## Cómo se coordina el trabajo pendiente

- **Pendientes concretos y accionables** → **[Issues en GitHub](https://github.com/abrinay1997-stack/PanaClaw/issues)**. Cada uno con contexto suficiente para tomarlo sin preguntar.
- **Diagnóstico y decisiones** → [`docs/ESTADO.md`](docs/ESTADO.md). Es más
  narrativo: por qué se hizo cada cosa, qué se descartó y por qué. Cuando algo
  del ESTADO se vuelve una tarea concreta, se abre issue.
- **Reglas del proyecto** → [`docs/convenciones.md`](docs/convenciones.md).
- **Cómo funciona el chat** → [`docs/chat.md`](docs/chat.md).

`ESTADO.md` es un documento vivo: **lo que se cierra se borra**, no se archiva.
El historial de git guarda lo cerrado.

---

## Para asistentes de IA que trabajan en este repo

Cuatro cosas que ahorran vueltas:

1. **Todo lo que se ve en el sitio nace en `src/data/`.** Si te piden cambiar
   un precio, un plazo, un texto, o el número de teléfono, lo casi seguro es
   que vive ahí en una constante. Grepa el valor visible antes de editar
   páginas: cambiarlo en `data/` propaga a las 13 páginas + chat + cotizador +
   JSON-LD a la vez.
2. **`ESTADO.md` te dice si algo ya se decidió a propósito.** Antes de proponer
   un cambio grande (arquitectura, arte, orden del nav), busca el tema ahí. La
   sección *«Decisiones tomadas — no reabrir sin motivo nuevo»* del final es
   especialmente útil.
3. **Trabajá siempre en la rama designada del prompt inicial.** El proyecto
   usa esa convención — no crear branches nuevas por cada cambio.
4. **Antes de commitear, corre `npm run check`**. Los tipos son estrictos y
   `npm run build` no los valida.
