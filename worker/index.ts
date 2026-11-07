/**
 * El Worker del sitio en Cloudflare.
 *
 * El sitio es estático: Astro lo deja en `dist/` y Cloudflare lo sirve desde el
 * borde SIN ejecutar nada. Este Worker existe solo para lo que no es un archivo:
 * hoy, el chat (`/api/chat`). Por eso `wrangler.jsonc` lo llama únicamente para
 * `/api/*`; el resto de las visitas ni lo despiertan ni lo cobran.
 *
 * La lógica del chat NO está aquí: es la misma de Netlify
 * (`netlify/functions/chat.mts`, función `atender`), importada tal cual. Aquí solo
 * se le dice quién escribe y cómo llegar a `kb.json`. Así hay una sola copia del
 * chat mientras el sitio vive en las dos plataformas, y ninguna de las dos se
 * puede quedar con la versión vieja.
 *
 * Las claves (`ANTHROPIC_API_KEY`, `GROQ_API_KEY`…) llegan como secretos del
 * Worker y, con `nodejs_compat`, aparecen en `process.env`, que es donde el chat
 * ya las lee. No hay que tocar el chat para cambiar de plataforma.
 */

import { atender } from '../netlify/functions/chat.mts';

interface Env {
  /** Los archivos de `dist/`. */
  ASSETS: { fetch(peticion: Request): Promise<Response> };
}

const json = (datos: unknown, estado: number): Response =>
  new Response(JSON.stringify(datos), {
    status: estado,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

export default {
  async fetch(peticion: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(peticion.url);

    if (pathname === '/api/chat') {
      return atender(peticion, {
        // Cloudflare pone aquí la IP real de quien escribe. La cabecera no la
        // puede falsificar el visitante: Cloudflare la reescribe en el borde.
        ip: peticion.headers.get('cf-connecting-ip') || 'anon',
        // `kb.json` es un archivo estático del propio sitio: se pide al binding
        // y no a la red, que sería salir a internet para llegar a casa.
        cargarKb: async (origen) => {
          const respuesta = await env.ASSETS.fetch(new Request(`${origen}/kb.json`));
          if (!respuesta.ok) throw new Error(`kb.json devolvió ${respuesta.status}`);
          return respuesta.json();
        },
      });
    }

    return json({ error: 'Esa dirección no existe' }, 404);
  },
};
