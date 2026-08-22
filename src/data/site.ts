export const site = {
  name: 'PanaClaw',
  tagline: 'Sitios rápidos. Código tuyo.',
  description:
    'Agencia web en Panamá. Sitios que abren en menos de un segundo, entregados en días y que quedan a tu nombre. Desde $295.',
  descriptionShort: 'Webs en Panamá. Abren en menos de 1 s, listas en días y quedan a tu nombre. Desde $295.',
  locale: 'es_PA',
  lang: 'es',
  themeColor: '#100101',
  accentColor: '#FF5100',
  year: 2026,
  location: 'Panamá',
} as const;

export const contact = {
  /*
   * El número queda en un solo lugar del proyecto — `waLink()` y todos los
   * botones lo componen desde acá. Cambiarlo aquí lo cambia en las 13 páginas
   * a la vez, en el chat, en el cotizador y en el schema JSON-LD.
   *
   * NO SE MUESTRA EN LA UI. La `whatsapp` con formato legible queda por si
   * hace falta para un panel administrativo o un correo interno, pero el
   * sitio no la imprime a la vista en ningún sitio: los botones dicen
   * «WhatsApp» sin dígitos. Decisión de marca — el número solo aparece
   * cuando el usuario ya está adentro del chat, no como reclamo público.
   */
  /*
   * Cambiado el 2026-08-22 al número panameño oficial. El anterior era de
   * EE.UU. y contradecía el «agencia web en Panamá» que dice todo el sitio.
   *
   * Las dos formas del mismo número: la legible es la que se emite en el
   * JSON-LD y la que ve el chat; la cruda es la que compone cada `wa.me`, y va
   * SIN símbolos —ni +, ni espacios, ni guiones— porque WhatsApp los rechaza y
   * el enlace fallaría en silencio, abriendo una conversación con nadie.
   */
  whatsapp: '+507 6531-0721',
  whatsappRaw: '50765310721',
  whatsappDefaultMsg: 'Hola PanaClaw, quiero cotizar mi sitio web',
  horario: 'Lun–Vie · 9:00 – 18:00',
  timezone: 'Hora de Panamá (GMT-5)',
} as const;

export function waLink(msg: string = contact.whatsappDefaultMsg): string {
  return `https://wa.me/${contact.whatsappRaw}?text=${encodeURIComponent(msg)}`;
}

/**
 * A dónde va el formulario de /contacto.
 *
 *   'netlify'  → Netlify Forms recibe el POST y los envíos aparecen en el panel
 *                de Netlify. Solo funciona sobre un despliegue de Netlify.
 *   'whatsapp' → El navegador compone el mensaje con lo escrito y abre WhatsApp.
 *                Funciona en cualquier alojamiento estático.
 *
 * Es una decisión declarada, no deducida. Antes se miraba `location.hostname` y
 * se daba por Netlify todo lo que terminara en `netlify.app`: el día que el
 * sitio estrenara dominio propio, el formulario habría vuelto a WhatsApp solo y
 * en silencio, y los envíos habrían dejado de llegar sin que nadie lo notara.
 *
 * Este valor manda sobre TODO lo que depende del destino: los atributos del
 * `<form>`, el texto de la tarjeta y del botón, y lo que declara la política de
 * privacidad. Cambiarlo aquí cambia las tres cosas a la vez, así que el sitio no
 * puede prometer WhatsApp mientras envía a otro sitio.
 *
 * Al cambiarlo a 'netlify', comprobar que el formulario esté dado de alta en
 * Netlify (Forms → Active forms) y que llegue la notificación del primer envío.
 */
export type FormDestination = 'netlify' | 'whatsapp';

export const formDestination: FormDestination = 'netlify';
