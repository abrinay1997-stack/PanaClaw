import { routes } from './links';

/**
 * Copy de los tres pilares y del proceso.
 *
 * Regla de escritura de este archivo: **el dolor antes que la herramienta.**
 * Nada de nombres de tecnología salvo los que el cliente ya reconoce (WordPress,
 * Google, WhatsApp, GitHub). Si una frase solo la entiende un programador, está
 * mal escrita para esta página.
 */

export interface Service {
  idx: string;
  title: string;
  desc: string;
  longDesc?: string;
}

export const services: Service[] = [
  {
    idx: '01',
    title: 'Rápido de verdad',
    desc: 'Tu sitio abre antes de que a nadie le dé tiempo a arrepentirse. Menos de un segundo, en el celular y en la computadora.',
    longDesc:
      'Cuatro de cada diez personas se van de una página que tarda más de tres segundos en abrir. Se van antes de ver tu logo, tus precios o tu teléfono: para ellas tu negocio nunca existió. Y no vuelven. Nosotros construimos de una forma distinta a la habitual, sin todo el peso que arrastran los sitios corrientes, y el resultado es que el tuyo abre casi al instante. Google también lo nota, y a los sitios rápidos los muestra antes.',
  },
  {
    idx: '02',
    title: 'Que no se caiga ni te lo hackeen',
    desc: 'Sin panel de administración expuesto y sin complementos que se rompen solos. Nada que actualizar cada semana.',
    longDesc:
      'La historia se repite: un negocio monta su web, pasan unos meses, y un día aparece caída, redirigiendo a una página de pastillas o pidiendo un rescate. Casi siempre es lo mismo: un complemento sin actualizar. Los sitios que hacemos no tienen esa puerta abierta — no hay complementos que mantener ni panel público por el que entrar. Es una web que puedes dejar sola durante un año y seguirá igual.',
  },
  {
    idx: '03',
    title: 'Listo en días, no en meses',
    desc: 'Un sitio sencillo sale en 72 horas. El más completo, en tres semanas. Y el código queda a tu nombre.',
    longDesc:
      'Preguntas por una web y te dicen "un mes y medio". Pasan tres, y sigues mandando a tus clientes a un perfil de Instagram. Eso pasa porque cada proyecto se empieza desde cero. Nosotros ya tenemos resuelto lo que se repite en todos, así que el tiempo se va en lo tuyo y no en volver a inventar lo mismo. Los plazos cuentan desde que nos das tus textos e imágenes y el 50 % del pago.',
  },
];

export interface ProcesoStep {
  num: string;
  title: string;
  desc: string;
  longDesc?: string;
}

export const procesoSteps: ProcesoStep[] = [
  {
    num: '01',
    title: 'Sabes el precio antes de empezar',
    desc: 'Te mandamos por escrito qué incluye, qué no incluye, cuánto cuesta y qué día lo tienes. Firmas, pagas la mitad y arrancamos.',
    longDesc:
      'La frase que más caro sale en este negocio es "eso lo vemos después". Se empieza sin nada por escrito, aparecen cosas que nadie había hablado, y al final alguien queda molesto: o tú pagando de más, o nosotros trabajando gratis. Por eso todo va en papel antes de la primera línea de código, incluida la lista de lo que NO está incluido. Sin esa firma y sin ese pago no hay proyecto, y eso también te protege a ti: garantiza que tu trabajo entra en la agenda en serio.',
  },
  {
    num: '02',
    title: 'El sitio es tuyo, no nuestro',
    desc: 'Al pagar el resto, el código pasa a tu cuenta y el dominio queda a tu nombre. Si mañana quieres irte, te vas con todo.',
    longDesc:
      'Aquí es normal que la agencia se quede con el código, con el alojamiento y con el dominio a su nombre. El día que quieres cambiar, descubres que no puedes: te toca empezar de cero con otro y pagar otra vez. Nosotros hacemos lo contrario. Cuando terminas de pagar, todo pasa a tu nombre. Si mañana te llevas el sitio a otra agencia o a tu sobrino que estudia sistemas, es tu problema — tienes todo lo que hace falta.',
  },
  {
    num: '03',
    title: 'Los cambios tienen un número, no un "ya veremos"',
    desc: 'Cada plan trae sus rondas de cambios incluidas. Si necesitas más, cada una cuesta $40. Sin discusión y sin mala cara.',
    longDesc:
      'Los "solo un cambio más" son lo que arruina a quien cobra barato: se acumulan, no se acaban nunca, y acaban en una relación incómoda donde nadie quiere escribirle al otro. Se arregla poniéndoles número desde el principio. Cada plan incluye sus rondas (Launch 2, Corporate 3, Commerce 4). Si se agotan y necesitas otra, son $40. Se sabe de antemano, así que no hay nada que negociar ni nadie que quede mal.',
  },
];

export interface NavLink {
  href: string;
  label: string;
  /**
   * Corona sobre el enlace. Es la única distinción de la barra y por eso hay
   * una sola: dos coronas no destacan el doble, dejan de destacar.
   */
  crown?: boolean;
}

export const navLinks: NavLink[] = [
  { href: routes.home, label: 'Inicio' },
  { href: routes.servicios, label: 'Servicios' },
  // eBot va pegado a Servicios y no al final: es el único producto del catálogo
  // que no es una web, así que quien llega buscando "sitios" tiene que tropezarse
  // con él temprano o no lo verá nunca. El nombre va solo, sin explicación — la
  // barra no da para una frase y la página entera es la explicación.
  { href: routes.ebot, label: 'eBot' },
  // Seguridad va pegada a eBot por el mismo motivo: los dos son productos que
  // no son una web, y quien llega buscando «sitios» no los va a encontrar si
  // están al final. Y va DESPUÉS de eBot, no antes, porque a este se llega
  // también por el dolor —«me hackearon»— y ese camino ya está cubierto desde
  // /servicios, /planes y el chat; eBot no tiene ningún otro.
  { href: routes.seguridad, label: 'Seguridad' },
  /*
   * Planes va delante de Proyectos, y con corona.
   *
   * Estuvo al revés, con este argumento: quien duda del precio suele estar
   * dudando de si sabemos hacerlo, así que la prueba tiene que llegarle antes
   * que la cifra. Sigue siendo verdad para quien navega la barra de izquierda a
   * derecha; el problema es que casi nadie la navega así. A la barra se viene a
   * BUSCAR, y lo que se busca es el precio: es la pregunta con la que llega la
   * gente y la única que el sitio promete contestar sin pedir datos. Ponerla
   * antes no es discutirle el argumento a la prueba social — es dejar de
   * esconder la respuesta que trajo a la persona.
   *
   * La corona hace lo mismo con menos palabras: entre nueve enlaces del mismo
   * tamaño no hay ninguno que llame, y este tiene que llamar.
   */
  { href: routes.planes, label: 'Planes', crown: true },
  { href: routes.proyectos, label: 'Proyectos' },
  { href: routes.proceso, label: 'Proceso' },
  { href: routes.ayuda, label: 'Ayuda' },
  { href: routes.contacto, label: 'Contacto' },
];
