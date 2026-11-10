/**
 * Lógica determinista del chat: recuperación y verificación de precios.
 *
 * Vive fuera del handler para que se pueda probar sin levantar ni un Worker ni
 * llamar a ningún modelo. Es justamente la parte que NO puede fallar: si la
 * recuperación trae el hecho equivocado, da igual lo bueno que sea el modelo.
 */

export interface KbFact {
  id: string;
  topic: string;
  q: string[];
  text: string;
  /** Página del sitio donde vive el hecho. La usa el bot externo, no este chat. */
  url: string;
}

export interface Kb {
  generatedAt: string;
  site: {
    name: string;
    location: string;
    whatsapp: string;
    url: string;
    horario: string;
    timezone: string;
  };
  prices: string[];
  facts: KbFact[];
}

const STOP = new Set(
  ('de la que el en y a los del se las por un para con no una su al es lo como mas pero sus le ya o ' +
    'este si porque esta entre cuando muy sin sobre tambien me hasta hay donde quien desde todo nos ' +
    'durante ni contra ese eso ante ellos e esto mi antes algunos cual poco ella tiene tienen hacer ' +
    'quiero necesito puedo puede son esta estan')
    .split(' ')
);

/** Sin acentos ni signos: "cuánto" y "cuanto" tienen que puntuar igual. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokens(s: string): string[] {
  return normalize(s)
    .split(' ')
    .filter((t) => t.length > 2 && !STOP.has(t));
}

/**
 * Puntúa cada hecho contra la consulta.
 *
 * Las `q` pesan el triple que el cuerpo: son las formas concretas en que
 * sabemos que la gente pregunta por esa cosa. Es recuperación léxica y no
 * vectorial a propósito — con 55 hechos, los embeddings añadirían una
 * dependencia externa, latencia y coste para resolver un problema que no
 * tenemos.
 */
export function retrieve(kb: Kb, query: string, k = 6): KbFact[] {
  const qt = tokens(query);
  if (!qt.length) return kb.facts.slice(0, k);

  const scored = kb.facts.map((fact) => {
    const qText = normalize(fact.q.join(' '));
    const body = normalize(fact.text);
    let score = 0;
    for (const t of qt) {
      if (qText.includes(t)) score += 3;
      if (body.includes(t)) score += 1;
    }
    // A igual puntuación gana el hecho más corto: es el más específico.
    return { fact, score: score - fact.text.length / 20000 };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((s) => s.fact);
}

/**
 * Un importe escrito como se escribe en un chat: con puntos de miles, con
 * decimales en cero, con la coma de miles de la lista blanca. «1.200», «1,200» y
 * «1200.00» son la misma cifra y tienen que compararse como tal.
 */
function normalizaImporte(crudo: string): string {
  return crudo
    .replace(/[^0-9.,]/g, '')
    .replace(/[.,]0+$/, '')
    .replace(/\.(?=\d{3}(?!\d))/g, ',')
    .replace(/[^0-9,]/g, '')
    .replace(/,+$/, '');
}

/** Sin acentos ni mayúsculas, para comparar «días» con «dias» y «USD» con «usd». */
function plano(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

const NUMERO_EN_LETRAS =
  '(?:uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|' +
  'dieci\\w+|veinte|veinti\\w+|treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa|' +
  'cien|ciento|doscientos|trescientos|cuatrocientos|quinientos|seiscientos|setecientos|' +
  'ochocientos|novecientos|mil|millon|millones)';

/**
 * Importes de la respuesta que NO están en la lista blanca del build.
 *
 * Es la única defensa que no depende de que el modelo obedezca el prompt. En un
 * sitio cuya promesa es "precio público y fijo", una cifra inventada es el peor
 * fallo posible: contradice justo aquello que se vende.
 *
 * La primera versión solo miraba «$999». La prueba de ataque del 10-nov-2026 coló
 * «999 dólares», «999 USD», «999$», «B/. 999» y «novecientos noventa y nueve
 * dólares»: un modelo desviado no necesita el signo para dar un precio. Ahora se
 * miran todas las formas de decir dinero, y una cifra en letras seguida de
 * «dólares» o «balboas» se bloquea siempre (no hay forma segura de leerla; se
 * manda al cotizador, que es lo que se haría con un precio dudoso).
 */
export function invalidPrices(reply: string, allowed: string[]): string[] {
  const texto = plano(reply);
  const ok = new Set(allowed);
  const cifras: string[] = [];

  // «$295», «US$ 295»
  for (const m of texto.matchAll(/\$\s?(\d[\d.,]*)/g)) cifras.push(m[1]);
  // «295$», «295 dolares», «295 usd», «295 balboas», «295 b/.»
  for (const m of texto.matchAll(/(\d[\d.,]*)\s?(?:\$|dolares?|usd|balboas?|b\/\.?)/g)) cifras.push(m[1]);
  // «USD 295», «B/. 295», «balboas 295»
  for (const m of texto.matchAll(/(?:usd|b\/\.?|balboas?)\s?(\d[\d.,]*)/g)) cifras.push(m[1]);

  const malas = cifras.map(normalizaImporte).filter((n) => n && !ok.has(n));

  const enLetras = new RegExp(`\\b${NUMERO_EN_LETRAS}\\b(?:\\s+(?:y\\s+)?[a-z]+){0,3}\\s+(?:dolares?|balboas?)\\b`);
  const m = enLetras.exec(texto);
  if (m) malas.push(m[0]);

  return [...new Set(malas)];
}

/**
 * Promesas que no son un importe pero cuestan lo mismo: un descuento, un plazo,
 * un «gratis». Se permiten SOLO si el hecho que se le dio al modelo ese turno las
 * dice. Un modelo desviado (o un visitante que le puso palabras en la boca) no
 * puede regalar nada que el contexto no regale.
 *
 * Mira porcentajes, plazos con cifra («en 3 días») y palabras de regalo o
 * garantía. Lo que no comprueba: plazos en letras («en tres días»).
 */
export function promesasSinRespaldo(reply: string, facts: Pick<KbFact, 'text'>[]): string[] {
  const texto = plano(reply);
  const base = plano(facts.map((f) => f.text).join('\n'));
  const malas: string[] = [];

  const porcentajes = (s: string) => new Set([...s.matchAll(/(\d+)\s?%/g)].map((m) => `${m[1]}%`));
  const bases = porcentajes(base);
  for (const p of porcentajes(texto)) if (!bases.has(p)) malas.push(p);

  const plazos = (s: string) =>
    new Set([...s.matchAll(/(\d+)\s?(dias?|semanas?|horas?|meses|mes|anos?)\b/g)].map((m) => `${m[1]} ${m[2].replace(/s$/, '')}`));
  const plazosBase = plazos(base);
  for (const p of plazos(texto)) if (!plazosBase.has(p)) malas.push(p);

  const PALABRAS =
    /\b(gratis|gratuit[oa]s?|sin costo|sin cargo|sin pagar|descuentos?|promocion(?:es)?|ofertas?|garantia|garantizad[oa]s?|reembolso|devolucion|regalo|regalamos|regalad[oa]s?)\b/g;
  const permitidas = new Set([...base.matchAll(PALABRAS)].map((m) => m[1]));
  for (const m of texto.matchAll(PALABRAS)) if (!permitidas.has(m[1])) malas.push(m[1]);

  return [...new Set(malas)];
}

/**
 * Prompt de sistema. Corto a propósito: los modelos pequeños pierden
 * instrucciones cuando el prompt se alarga, así que aquí solo van las reglas
 * que el código no puede imponer por sí mismo.
 */
export function buildSystem(kb: Kb, facts: KbFact[]): string {
  const contexto = facts.map((f) => `- ${f.text}`).join('\n');
  return `Trabajas en ${kb.site.name}, un estudio de diseño y desarrollo web en ${kb.site.location}, y atiendes a quien escribe por la web. Eres parte del equipo, no un intermediario que habla de la empresa desde fuera.

REGLAS
1. Responde SOLO con lo que diga el CONTEXTO. Si la respuesta no está ahí, dilo y ofrece el WhatsApp ${kb.site.whatsapp}.
2. Nunca inventes precios, plazos ni características. Copia las cifras tal cual aparecen.
3. No sumes ni calcules totales. Si te piden un total, di que el cotizador del sitio lo calcula en cuatro preguntas.
4. Escribe entre 2 y 4 frases (unas 40–70 palabras). Da el dato concreto y añade una frase de contexto útil.
   Ni respuestas de una línea seca, ni párrafos largos.
5. Nada de tecnicismos. Si el contexto trae una palabra técnica, tradúcela a lo que el cliente consigue.
6. Habla en primera persona del plural: "tenemos", "hacemos", "te lo entregamos", "escríbenos".
   NUNCA en tercera: nada de "tienen", "ellos", "la empresa", "${kb.site.name} ofrece" ni "puedes escribirles".
   Si el contexto está redactado en tercera persona, pásalo a primera al responder.
7. Español de Panamá, tuteo, cercano pero directo. No te disculpes ni digas "según el contexto".
8. Cierra ofreciendo el siguiente paso solo cuando encaje de forma natural, no en cada respuesta.

CONTEXTO
${contexto}`;
}

/**
 * Longitud objetivo de una respuesta de soporte.
 *
 * Un párrafo corto genera confianza; dos líneas secas parecen un bot y cinco
 * párrafos no se leen. El modelo suele quedarse dentro del rango con la regla 4,
 * pero un recorte duro evita el caso raro en que se desborda.
 */
export const MAX_REPLY_CHARS = 600;

export function trimReply(reply: string): string {
  if (reply.length <= MAX_REPLY_CHARS) return reply;
  // Cortar en el último final de frase para no dejar la idea a medias.
  const cut = reply.slice(0, MAX_REPLY_CHARS);
  const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('.\n'));
  return (lastStop > 220 ? cut.slice(0, lastStop + 1) : cut.trimEnd() + '…').trim();
}
