/**
 * Content Collections de PanaClaw — hoy solo `blog`.
 *
 * ¿Por qué Content Collections y no un CMS?
 *   Un CMS externo (Contentful, Sanity, WordPress headless) añade una segunda
 *   fuente de verdad, un panel de admin que hay que actualizar, credenciales
 *   que rotar, y un servicio cuyo precio o disponibilidad puede cambiar. Todo
 *   eso, para lo que aquí es un archivo `.md` a la semana. El historial de git
 *   es el historial editorial —quién cambió qué y cuándo—, y publicar es un
 *   push que Netlify redeployea en ~30 s. No hay CMS que compita con eso a
 *   este volumen.
 *
 * El schema es estricto a propósito: si un post nuevo se olvida del `date` o
 * mete una fecha inválida, `astro build` FALLA en vez de publicar un post con
 * "Invalid Date" en la fecha. La UX del sitio la valida el build.
 */
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  // Loader del Content Layer (Astro 5+): recoge los .md de content/blog/ como
  // entradas de la colección. El id de cada entrada es el nombre del archivo
  // sin extensión (ej. "cuanto-cuesta-pagina-web-panama"), que es lo que la
  // ruta [slug].astro usa como slug.
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    /** Titular del post, tal cual sale como `<h1>` y `<title>`. */
    title: z.string().min(15).max(90),

    /** Resumen que sale en el listado y en la meta description. */
    description: z.string().min(60).max(200),

    /**
     * Fecha de publicación. Se compara para ordenar y se muestra en el post.
     * Zod la reifica desde string ISO en el frontmatter.
     */
    date: z.coerce.date(),

    /**
     * Categoría única, para ordenar y filtrar más adelante. Cerrada a un
     * conjunto: si aparece una nueva, hay que darla de alta aquí antes de
     * publicar el post. Evita "Guía", "guias", "guías" viviendo como tres.
     */
    category: z.enum(['precios', 'guias', 'comparativas', 'casos', 'panama']),

    /**
     * Palabras clave. NO son para SEO directo (Google ya no las mira desde
     * hace años), sino para el bloque «Posts relacionados» del final: se
     * consideran relacionados los que comparten al menos una keyword.
     */
    keywords: z.array(z.string()).min(1).max(6),

    /**
     * Tiempo estimado de lectura, en minutos. Se pone a mano para no depender
     * de una librería más: el autor sabe cuánto leyó al releerlo, y la cifra
     * exacta importa poco (5 min vs. 7 min).
     */
    readingTime: z.number().int().min(2).max(30),

    /**
     * Post oculto del listado pero accesible por URL. Sirve para borradores
     * publicados en beta o para posts atemporales que no queremos empujar al
     * top de la lista cada vez.
     */
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
