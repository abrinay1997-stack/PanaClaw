# Salir de Netlify: el sitio en Cloudflare

> Meta del dueño: que el sitio, el hub y el CRM vivan todos en Cloudflare, y salir
> de Netlify. El hub y el CRM ya están allí. Este documento deja el sitio listo
> para el día del cambio, y dice con franqueza qué está probado y qué no.

**Hoy nada cambia para quien visita.** `panaclaw.com` sigue en Netlify. Lo que hay
en el repositorio es el terreno: se puede ensayar en `workers.dev` sin tocar el
dominio, y el cambio real son cinco pasos al final.

---

## Qué hace Netlify hoy, y su equivalente

| Netlify hoy | En Cloudflare | Estado |
|---|---|---|
| Sirve `dist/` (Astro estático) | Workers con archivos estáticos, `assets.directory: ./dist` | **Listo**, probado en local |
| URLs de directorio (`/contacto/`) | `html_handling: auto-trailing-slash` | **Listo**, probado en local |
| `/contacto` → `/contacto/` con 301 | `dist/_redirects`, generado en el build (38 reglas) | **Listo**, probado en local. Sin esto Cloudflare usa 307 |
| Cabeceras de seguridad y de caché (`netlify.toml`) | `cloudflare/_headers` → `dist/_headers` | **Listo**, probado en local |
| Página 404 | `not_found_handling: 404-page` | **Listo**, probado en local |
| Función del chat `/api/chat` | `worker/index.ts`, que importa la **misma** lógica | **Listo**, probado en local sin claves |
| Claves del chat (`ANTHROPIC_API_KEY`…) | Secretos del Worker (`wrangler secret put`) | **Falta** cargarlos |
| Formulario de contacto (Netlify Forms) | — | **Decisión pendiente**, ver abajo |
| Despliegue al empujar a `main` | `Desplegar el sitio en Cloudflare` (manual) | **Listo**, falta el token en GitHub |
| `panaclaw.netlify.app` → dominio con 301 | No existe | Se pierde al salir. Ver «Riesgos» |
| Vista previa por PR (Deploy Preview) | — | **Falta**, ver «Vistas previas» |

## Cómo se ensaya

```bash
npm ci
npm run cloudflare:probar    # construye y simula el despliegue, sin credenciales
npm run cloudflare:dev       # el sitio y el chat en local, en :8787
```

`cloudflare:probar` también corre en CI en cada PR, así que una configuración rota
no llega a `main`.

**`wrangler` no es una dependencia del sitio, a propósito.** Se baja con `npx` en la
versión fijada de `package.json`. Mientras el sitio siga en Netlify, su instalación
tiene que ser idéntica a la de siempre: añadir `wrangler` a las dependencias
cambiaba el `package-lock.json` entero y la instalación de cada build de Netlify,
y la vista previa de este mismo PR falló por ello. El día que salga de Netlify, se
puede pasar a `devDependencies`.

Para publicar el ensayo en `panaclaw-sitio.<cuenta>.workers.dev`: pestaña Actions →
«Desplegar el sitio en Cloudflare» → Run workflow. Necesita `CLOUDFLARE_API_TOKEN`.

## El chat: una sola copia de la lógica

`netlify/functions/chat.mts` ya no mezcla lógica y plataforma:

- `atender(peticion, { ip, cargarKb })` es el chat. No sabe dónde corre.
- El `export default` es el adaptador de Netlify: le pasa la IP que Netlify entrega.
- `worker/index.ts` es el adaptador de Cloudflare: le pasa `cf-connecting-ip` y
  carga `kb.json` del binding de los estáticos.

Mientras el sitio viva en las dos plataformas, un cambio al chat llega a las dos.
Cuando se salga de Netlify, el adaptador de Netlify y `@netlify/functions` se
borran y la lógica se queda donde está.

**El tope diario del chat** (`CHAT_MAX_PER_DAY`) y el límite por visitante viven en
memoria de cada instancia, como ya pasaba en Netlify, y en Cloudflare también se
multiplican por instancia. Es un tope aproximado. Si el chat pesa más, el paso
siguiente es un Durable Object con un contador; no hace falta antes.

## El formulario de contacto: decisión pendiente

Netlify Forms captura el envío y lo muestra en el panel de Netlify. **No tiene
equivalente directo en Cloudflare**, y no quise inventar uno. Hay dos caminos y
elige el dueño:

1. **Pasarlo a WhatsApp.** `src/data/site.ts` ya soporta `formDestination:
   'whatsapp'`: arma el mensaje y abre el chat. No guarda nada. Es el cambio de una
   línea y no hay nada que migrar.
2. **Mandarlo al CRM.** El CRM ya vive en Cloudflare y recibe conversaciones. Un
   `POST /api/contacto` en este Worker que reenvíe al CRM guardaría cada contacto
   donde ya se atiende. Es trabajo de otro PR, y depende de cómo el CRM reciba un
   lead de formulario.

**Antes de apagar Netlify, exporta los envíos que haya** (panel de Netlify → Forms)
si importan: se pierden con el sitio.

## El día del cambio

1. **Secretos del Worker**, una vez:
   `npx wrangler secret put ANTHROPIC_API_KEY` (y `GROQ_API_KEY` o `META_API_KEY` si se usan). Probar
   el chat en la dirección de `workers.dev` antes de seguir.
2. **Formulario**: decidir el camino de arriba y dejarlo hecho.
3. **Dominio** (por rutas de zona; no se borra ningún registro):
   1. `wrangler.jsonc` ya trae `routes` para `panaclaw.com/*` y
      `www.panaclaw.com/*`. Desplegarlo no cambia nada para los visitantes
      mientras los registros sigan en nube gris.
   2. En Cloudflare → SSL/TLS: modo **Full (strict)** y **Always Use HTTPS**.
   3. Crear la regla de redirección del paso 4.
   4. **El cambio:** en DNS, poner `A @` y `CNAME www` en **Proxied** (nube
      naranja). Desde ahí atiende el Worker.
   5. **Volver atrás:** ponerlos otra vez en **DNS only** (nube gris); el tráfico
      regresa a Netlify en cuanto caduca el TTL.
4. **`www` → dominio principal**: una regla de redirección (Rules → Redirect Rules)
   de `www.panaclaw.com/*` a `https://panaclaw.com/${1}`, 301. `astro.config.mjs`
   declara el dominio **sin** `www`, así que el canonical apunta al apex.
5. **Apagar Netlify**: quitar el sitio, borrar `netlify.toml` y `netlify/`, y quitar
   `@netlify/functions` de las dependencias.

Cada paso se puede deshacer hasta el 5, y mientras tanto el dominio puede volver a
Netlify cambiando el DNS.

## Riesgos que conviene tener presentes

- **No se probó contra Cloudflare real.** Todo lo de arriba se verificó con el
  motor local de Workers (`wrangler dev`) y con `wrangler deploy --dry-run`. Esta
  sesión no tiene acceso a la cuenta. La primera vez, ensayar en `workers.dev`.
- **SEO**: el sitio está indexado con barra final y Cloudflare la respeta; las
  redirecciones sin barra son 301, como en Netlify. Tras el cambio, revisar en
  Search Console que las páginas siguen respondiendo 200 y que no aparece un
  aumento de redirecciones.
- **`panaclaw.netlify.app`** deja de redirigir al dominio. Si Google la indexó, lo
  correcto es dejarla redirigiendo unas semanas antes de borrar el sitio de Netlify.
- **Cabeceras**: Cloudflare junta las reglas que coinciden en vez de quedarse con la
  más específica. `cloudflare/_headers` está escrito para eso, con `! Cache-Control`
  en cada excepción, y `scripts/cloudflare-assets.mjs` falla el build si esa regla se
  pierde. No se edite una sin la otra.

## Vistas previas

Netlify da una dirección por PR. En Cloudflare el equivalente son las *versiones*
del Worker (`wrangler versions upload`, con su dirección de vista previa), pero hace
falta el token en el flujo de CI y decidir si cada PR publica una. Queda como
siguiente paso, después de que el sitio esté en Cloudflare.

## El hub y el CRM

- **El hub** (`PanaClaw-WorkSpace`) ya sirve desde Cloudflare, con su base D1 y
  Cloudflare Access. Su `netlify.toml` es solo la vista previa en modo demostración
  y se puede apagar sin perder nada.
- **El CRM** (`CRM-PANACLAW`) es un Worker de Cloudflare.
