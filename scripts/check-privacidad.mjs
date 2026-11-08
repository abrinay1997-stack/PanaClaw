// El chat no manda correos, teléfonos ni tarjetas al modelo, y sí deja pasar los precios. Uso: npm run medir:privacidad
import { redactarDatos } from '../worker/privacidad.ts';

const casos = [
  ['escríbeme a juan.perez@gmail.com', 'escríbeme a [correo]'],
  ['mi cel es +507 6026-1919 ok', 'mi cel es [número] ok'],
  ['tarjeta 4111 1111 1111 1111', 'tarjeta [número]'],
  ['cédula 8-123-4567', 'cédula [número]'],
  ['el plan cuesta $295 y $35/mes, 30 %', 'el plan cuesta $295 y $35/mes, 30 %'],
  ['hay 24 posts en 2026', 'hay 24 posts en 2026'],
  ['¿Cuánto sale una web de 5 páginas?', '¿Cuánto sale una web de 5 páginas?'],
];
const fallos = casos.filter(([entra, sale]) => redactarDatos(entra) !== sale);
for (const [entra, sale] of fallos) console.error(`✗ «${entra}» → «${redactarDatos(entra)}» (esperado «${sale}»)`);
if (fallos.length) process.exit(1);
console.log(`✓ Privacidad del chat: ${casos.length} casos`);
