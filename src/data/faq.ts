export interface FaqItem {
  q: string;
  a: string;
  /**
   * Otras formas de preguntar lo mismo. NO se muestran en la página: existen
   * solo para la base de conocimiento del bot, cuya recuperación es léxica y
   * solo encuentra lo que está escrito.
   *
   * Sin esto, cada pregunta del centro de ayuda llegaba al bot con una sola
   * frase —la formal, la que nadie escribe por WhatsApp— y una duda que ESTÁ
   * respondida aquí no se recuperaba. El bot, sin nada que citar, improvisaba.
   */
  alias?: string[];
}

export interface FaqGroup {
  id: string;
  title: string;
  /** Qué duda cubre este grupo, para que se escanee sin leerlo todo. */
  intro: string;
  items: FaqItem[];
}

/**
 * Centro de ayuda.
 *
 * Escrito para alguien que nunca ha encargado una web y no sabe qué debería
 * preguntar. De ahí que haya preguntas que nadie hace en voz alta ("¿y si no me
 * gusta?", "¿tengo que darles mis claves?"): son justo las que frenan la compra
 * en silencio.
 *
 * Regla: cero jerga. Si una respuesta necesita una palabra técnica, se explica
 * en la misma frase.
 */
export const faqGroups: FaqGroup[] = [
  {
    id: 'empezar',
    title: 'Antes de empezar',
    intro: 'Lo que conviene tener claro antes de escribirnos.',
    items: [
      {
        q: '¿Qué necesito tener listo para arrancar?',
        a: 'Tus textos, tus imágenes y tu logo si ya lo tienes. Nada más. Si no tienes los textos claros, te ayudamos a ordenarlos en la primera conversación, pero escribirlos por completo es un trabajo aparte que se cotiza si lo necesitas. El reloj de la entrega empieza a contar cuando recibimos ese material y la mitad del pago.',
      },
      {
        q: 'No tengo página. ¿Por dónde empiezo?',
        a: 'Por el plan más pequeño. El Start ($295) sale en 72 horas y ya te sirve para tener a dónde mandar a la gente en vez de a un perfil de Instagram. Ampliar después cuesta lo mismo que haberlo hecho grande desde el principio, así que no pierdes nada por empezar por lo básico.',
      },
      {
        q: 'Ya tengo una web, pero va mal. ¿Qué hago?',
        a: 'Empieza por el Diagnóstico de Ventas ($49). Te decimos qué tan lenta va de verdad, las tres razones concretas por las que estás perdiendo clientes en ella y qué hacer con cada una. Si después decides rehacerla con nosotros, ya sabrás exactamente qué estás arreglando y por qué.',
      },
      {
        q: '¿Trabajan con negocios fuera de la ciudad de Panamá?',
        a: 'Sí. Todo el trabajo es en remoto y se coordina por WhatsApp, así que da igual dónde estés dentro del país. Nunca hemos necesitado una reunión presencial para entregar un sitio.',
      },
      {
        q: '¿Qué pasa si mi negocio es raro y no encaja en ningún plan?',
        a: 'Escríbenos y lo miramos. Los planes cubren la mayoría de los casos, pero cuando algo no encaja se cotiza a medida. Nunca vamos a meterte en un plan que no te sirve solo porque exista.',
      },
    ],
  },
  {
    id: 'precio',
    title: 'Precio y pagos',
    intro: 'Todo lo que tiene que ver con el dinero, sin letra chica.',
    items: [
      {
        q: '¿El precio que veo es el precio final?',
        a: 'Sí, para lo que describe cada plan. La propuesta que te mandamos antes de empezar lleva la cifra cerrada y una lista de lo que NO incluye, precisamente para que no aparezca nada después. Si pides algo fuera de eso, te decimos cuánto cuesta antes de hacerlo, nunca después.',
      },
      {
        q: '¿Cómo se paga?',
        a: 'La mitad al empezar, para reservar tu lugar en la agenda, y la otra mitad al entregar, antes de publicar el sitio y de pasarte el código. El Diagnóstico de Ventas de $49 se paga completo por adelantado porque se entrega en 48 horas.',
      },
      {
        q: '¿Qué no está incluido en el precio?',
        a: 'Escribir tus textos, la sesión de fotos y las licencias de imágenes de pago. Todo eso se cotiza aparte y solo si lo necesitas. El precio del plan cubre el diseño, la programación, la publicación y las rondas de cambios que trae cada plan.',
      },
      {
        q: '¿Cuánto me va a costar mantenerlo cada mes?',
        a: 'Puede ser cero. Los sitios que hacemos funcionan sin cuotas mensuales obligatorias; lo único que se renueva es el dominio, unos $15 al año. Si prefieres no ocuparte de nada, los planes Care empiezan en $35 al mes e incluyen el alojamiento, la vigilancia y horas de cambios.',
      },
      {
        q: 'Si usan inteligencia artificial, ¿por qué no es más barato?',
        a: 'Porque lo que pagas no son las horas de tecleo, es el criterio. La herramienta escribe rápido; decidir qué se construye, qué se descarta y por qué tu negocio necesita esto y no aquello sigue siendo trabajo humano, y es justo la parte que hace que un sitio venda o se quede mirando. Los precios de cada plan están publicados y son los mismos para todos.',
        alias: [
          'si usan ia por que cobran eso',
          'entonces para que les pago si lo hace la ia',
          'si lo hace una maquina deberia costar menos',
          'por que tan caro si usan inteligencia artificial',
          'me sale mas barato hacerlo yo con chatgpt',
          'no me lo puede hacer la ia gratis',
        ],
      },
      {
        q: '¿Hay descuentos o facilidades de pago?',
        a: 'En los planes de sitio, el esquema es siempre mitad y mitad. En los planes Care, pagar el año por adelantado te sale con dos meses gratis. No manejamos descuentos por regatear: el precio publicado es el mismo para todos, y esa es justamente la idea.',
      },
    ],
  },
  {
    id: 'proceso',
    title: 'Durante el proyecto',
    intro: 'Cómo se trabaja, qué se te va a pedir y qué pasa si algo no sale como esperabas.',
    items: [
      {
        q: '¿Cuánto tardan de verdad?',
        a: 'Start 72 horas, Launch 4–5 días, Corporate 8–12 días y Commerce 15–20 días. Esos plazos cuentan desde que tenemos tu material y tu pago, no desde la primera conversación. La causa número uno de retraso, con diferencia, es esperar los textos del cliente.',
      },
      {
        q: '¿Y si no me gusta cómo va quedando?',
        a: 'Para eso están las rondas de cambios que incluye cada plan (Launch 2, Corporate 3, Commerce 4). Se revisa, dices qué quieres distinto y se ajusta. No entregamos un sitio a ciegas al final: vas viendo avances desde los primeros días para que no haya sorpresas.',
      },
      {
        q: '¿Qué pasa si necesito más cambios de los incluidos?',
        a: 'Cada ronda extra cuesta $40. Se sabe desde el principio, así que no hay nada que negociar ni situaciones incómodas. Es una cifra pensada para que puedas pedir un cambio más sin pensártelo, no para castigarte.',
      },
      {
        q: '¿Usan inteligencia artificial para hacer las páginas?',
        a: 'Sí, y te decimos exactamente en qué. La IA es una herramienta más del taller, como el editor de código o el de diseño: acelera la parte mecánica —escribir código, preparar borradores, revisar detalles—. Lo que no hace es decidir. Cómo se ve tu marca, qué dice y qué se queda fuera sale de hablar contigo y lo define una persona del equipo, que además audita todo antes de entregártelo. La herramienta acelera; el criterio y la identidad de tu negocio son de un humano, y ahí no hay atajo.',
        alias: [
          'usan ia',
          'usan inteligencia artificial',
          'usan ia para crear paginas web',
          'usan ia para hacer los sitios',
          'la pagina la hace una ia',
          'esto lo hizo una inteligencia artificial',
          'el sitio lo hace un robot',
          'lo hacen con chatgpt',
          'programan con ia',
          'trabajan con ia',
          'la hace una persona o una maquina',
          'quien hace realmente mi pagina',
          'es codigo generado por ia',
        ],
      },
      {
        q: '¿Tengo que darles mis claves de algo?',
        a: 'Solo si ya tienes un dominio o un sitio anterior que haya que migrar, y en ese caso puedes cambiar las claves en cuanto terminemos. Para un proyecto nuevo no necesitamos ningún acceso tuyo: creamos todo a tu nombre y te lo entregamos.',
      },
      {
        q: '¿Puedo cancelar a mitad del proyecto?',
        a: 'Sí. El adelanto cubre el trabajo ya hecho y no se devuelve, pero te entregamos lo que exista hasta ese momento. Si los que no podemos continuar somos nosotros, devolvemos la parte proporcional de lo que no se hizo.',
      },
    ],
  },
  {
    id: 'despues',
    title: 'Después de la entrega',
    intro: 'Qué pasa el día siguiente, y el año siguiente.',
    items: [
      {
        q: '¿De quién es el sitio cuando terminan?',
        a: 'Tuyo, entero. Al pago final el código pasa a una cuenta a tu nombre y el dominio queda registrado a tu nombre. No nos quedamos con accesos ni con el control de nada. Si mañana quieres irte con otra agencia, te llevas todo sin pedirnos permiso.',
      },
      {
        q: '¿Puedo editar el sitio yo mismo?',
        a: 'En los planes Corporate y Commerce, sí: llevan un panel donde cambias textos e imágenes sin tocar nada de programación. En Start y Launch, los cambios los hacemos nosotros, ya sea con tu plan Care o cotizados aparte.',
      },
      {
        q: '¿Qué pasa si el sitio se cae o deja de funcionar?',
        a: 'Con un plan Care activo, lo vemos nosotros y lo arreglamos; en Care Business incluso te avisamos antes de que lo notes. Sin plan Care no vigilamos el sitio, así que tendrías que escribirnos y se cotizaría la intervención. Dicho esto, estos sitios se caen mucho menos que los corrientes porque tienen bastante menos que romperse.',
      },
      {
        q: '¿Me van a obligar a contratar el mantenimiento?',
        a: 'No. El sitio funciona perfectamente sin ningún plan Care, y muchos clientes no lo contratan. Care es para quien prefiere no ocuparse de nada. Tampoco hay permanencia: se cancela cuando quieras, avisando antes del siguiente mes.',
      },
      {
        q: '¿Van a salir en Google desde el primer día?',
        a: 'No, y desconfía de quien te lo prometa. El sitio se entrega con todo lo necesario para que Google lo entienda bien, que es la mitad del trabajo. La otra mitad es tiempo y contenido: posicionarse por búsquedas competidas lleva meses. Lo que sí notarás desde el primer día es la velocidad, y eso Google lo valora.',
      },
    ],
  },
];

/** Lista plana, para el buscador del chat y el schema de la página. */
export const faq: FaqItem[] = faqGroups.flatMap((g) => g.items);
