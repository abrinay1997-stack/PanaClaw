/**
 * Datos personales que NO deben salir hacia el modelo.
 *
 * El proveedor del chat puede entrenar con las conversaciones (decisión de la
 * dueña, aceptada), pero eso no es motivo para mandarle lo que el bot no
 * necesita: el chat del sitio no toma pedidos ni datos de contacto, así que un
 * correo, un teléfono o una tarjeta que alguien escribe por costumbre se
 * sustituye antes de llegar al modelo. Las cifras de precio ($295, 30 %) no se
 * tocan: solo secuencias de 7 o más dígitos y correos.
 */
const CORREO = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
// 7+ dígitos seguidos o separados por espacios, puntos o guiones (teléfonos, cédulas, tarjetas).
const NUMERO = /(?<![\d$])(?:\+?\d[\s.-]?){7,}\d(?!\d)/g;

export function redactarDatos(texto: string): string {
  return texto.replace(CORREO, '[correo]').replace(NUMERO, '[número]');
}

/** Tope del cuerpo de una petición al chat: 6 mensajes de 1000 caracteres caben de sobra. */
export const MAX_CUERPO_BYTES = 16 * 1024;
