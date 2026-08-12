export interface Module {
  name: string;
  price: string;
  /** Qué resuelve, en el idioma del cliente. Nunca el nombre de la herramienta. */
  stack: string;
}

/**
 * Capacidades que se suman a cualquier plan.
 *
 * El campo `stack` decía antes con qué se construye ("Supabase Auth + RLS").
 * Eso le importa a un programador; a quien va a pagar le dice cero y le hace
 * sentir que no entiende lo que compra. Ahora dice qué consigue.
 */
export const modules: Module[] = [
  {
    name: 'Cuentas de usuario',
    price: '$450',
    stack: 'Cada persona entra con su clave y ve solo lo que le corresponde.',
  },
  {
    name: 'Panel de control',
    price: '$650',
    stack: 'Ves tus números y gestionas tu negocio desde una sola pantalla.',
  },
  {
    name: 'Reservas y citas',
    price: '$600',
    stack: 'Tus clientes reservan solos, sin llamarte y sin pisarse el horario.',
  },
  {
    name: 'Portal de clientes',
    price: '$750',
    stack: 'Cada cliente entra y consulta lo suyo sin escribirte para preguntar.',
  },
  {
    name: 'Conexión con otro sistema',
    price: '$350',
    stack: 'Tu web y el programa que ya usas dejan de vivir por separado.',
  },
  /*
   * Aquí vivía «Respuestas automáticas con IA» ($250–$900), y se quitó el
   * 2026-08-09 al publicarse eBot.
   *
   * Su descripción era «Contesta las preguntas de siempre por WhatsApp, a
   * cualquier hora» — literalmente lo que hace eBot. Con los dos publicados, el
   * sitio ofrecía dos precios distintos para lo que el cliente lee como una sola
   * cosa, y uno de ellos era una horquilla de casi setecientos dólares de ancho:
   * eso desmonta la promesa de precios claros sobre la que se sostiene el
   * resto.
   *
   * Para revertirlo: se devuelve este objeto al array y se le vuelve a apuntar
   * la capacidad del cotizador (`CAPABILITIES.ebot` en `quote.ts`). Pero antes
   * conviene que las dos cosas dejen de prometer lo mismo — si de verdad se
   * vende IA hecha a medida DENTRO del sistema del cliente, ese es otro
   * producto y necesita otro nombre.
   */
  {
    name: 'Control de inventario',
    price: '$550',
    stack: 'El stock se descuenta solo y dejas de vender lo que no tienes.',
  },
];
