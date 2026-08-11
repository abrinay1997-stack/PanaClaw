/**
 * Punto único de verdad de las imágenes cinemáticas del sitio.
 *
 * Los originales son PNG 16:9 de ~1.3 MB. Viven en `src/assets/<destino>/` con
 * nombre kebab-case y se importan aquí: Astro los procesa con `astro:assets` y
 * emite WebP responsive, así que el PNG pesado nunca llega al navegador.
 *
 * Para cambiar la imagen de una sección se edita este archivo, no la página.
 * Una imagen nueva se añade aquí con su `alt` y su encuadre; ninguna página
 * importa un asset por su cuenta.
 */
import velocidad from '../assets/servicios/velocidad.png';
import seguridad from '../assets/servicios/seguridad.png';
import entrega from '../assets/servicios/entrega.png';
import webGrid from '../assets/escenas/web-grid.png';
import interfaz from '../assets/escenas/interfaz.png';
import flujo from '../assets/proceso/flujo.png';
import start from '../assets/planes/start.png';
import corporate from '../assets/planes/corporate.png';

export interface Visual {
  src: ImageMetadata;
  /** Texto alternativo. Describe la imagen, no repite el titular contiguo. */
  alt: string;
  /** `object-position` cuando el recorte no es 16:9 y el sujeto no va centrado. */
  focus?: string;
  /**
   * Opacidad por defecto de esta imagen como fondo de escena. No todas parten
   * del mismo brillo: las muy oscuras se pierden con el valor genérico y las
   * muy luminosas se comen el texto. Si se omite, manda el `dim` de <SceneBg>.
   */
  dim?: number;
}

/** Visual de cada pilar de /servicios, indexado por `Service.idx`. */
export const serviceVisuals: Record<string, Visual> = {
  '01': {
    src: velocidad,
    alt: 'Proyectil oscuro atravesando estelas de luz roja a alta velocidad.',
    focus: '62% center',
  },
  '02': {
    src: seguridad,
    alt: 'Monolitos negros con circuitos rojos alzados sobre una llanura fracturada.',
    focus: 'center 45%',
  },
  '03': {
    src: entrega,
    alt: 'Hélice de bloques de cristal rojo encajados uno tras otro, como código estructurado.',
    focus: 'center center',
  },
};

/**
 * Escenas de uso general: nacieron para la página `/sobre`, que ya no existe —
 * su contenido vive hoy en `/proceso`. Se reparten entre `/proceso`,
 * `/contacto` y `/proyectos`, así que no llevan el nombre de ninguna página.
 */
export const sceneVisuals = {
  manifiesto: {
    src: webGrid,
    alt: 'Retícula infinita de servidores encendidos en rojo, perdiéndose en el horizonte.',
    focus: 'center 60%',
  },
  interfaz: {
    src: interfaz,
    alt: 'Una mano de cristal oscuro tocando una esfera de datos incandescente.',
    focus: '58% center',
  },
} satisfies Record<string, Visual>;

/**
 * /smark/ — la escena a pantalla completa del enlace de la bio.
 *
 * Es la misma imagen que usa `/contacto`, pero con encuadre y brillo propios, y
 * por eso tiene su entrada: allí es atmósfera detrás de un texto largo y va
 * apagada; aquí es lo único que hay, se ve en vertical y en tres segundos, así
 * que se encuadra sobre la esfera y sube casi al doble de brillo. La tarjeta de
 * vidrio pone el contraste del texto, no el velo.
 */
export const smarkVisual: Visual = {
  src: interfaz,
  alt: 'Una mano de cristal oscuro tocando una esfera de datos incandescente.',
  focus: '50% 46%',
  dim: 0.85,
};

/**
 * /ebot — la escena del hero del bot multicanal.
 *
 * Reutiliza `interfaz.png` (la mano tocando la esfera de datos) con encuadre y
 * brillo propios, igual que hace `smarkVisual`: es la imagen del catálogo que
 * habla de una máquina que responde, y aquí va detrás de un titular largo, así
 * que se encuadra a la derecha —donde no cae el texto— y se deja más apagada.
 */
export const ebotVisual: Visual = {
  src: interfaz,
  alt: 'Una mano de cristal oscuro tocando una esfera de datos incandescente.',
  focus: '68% center',
  dim: 0.5,
};

/**
 * /seguridad — la escena del hero de los planes de protección.
 *
 * Es la misma imagen del pilar 02 de `/servicios` («Que no se caiga ni te lo
 * hackeen»), y eso es lo que se quiere: quien llega desde ese pilar reconoce la
 * escena y entiende sin leer que está en la versión larga de lo mismo. Va con
 * encuadre propio —a la derecha, donde no cae el titular— y más apagada que en
 * `/servicios`, porque aquí el texto de encima es el doble de largo.
 */
export const seguridadVisual: Visual = {
  src: seguridad,
  alt: 'Monolitos negros con circuitos rojos alzados sobre una llanura fracturada.',
  focus: '70% 45%',
  dim: 0.5,
};

/** /proceso — banda cinemática entre el hero y los pasos. */
export const procesoVisual: Visual = {
  src: flujo,
  alt: 'Cintas de luz roja trenzándose sobre una superficie de obsidiana pulida.',
  focus: 'center 55%',
};

/** /planes — vitrina de los dos planes con mayor demanda, por slug. */
export const planVisuals: Record<string, Visual> = {
  start: {
    src: start,
    alt: 'Esfera de roca incandescente flotando sola en una cámara oscura.',
    focus: 'center center',
    // Casi toda la imagen es negro con una esfera pequeña: con el dim genérico
    // desaparecía del todo.
    dim: 0.85,
  },
  corporate: {
    src: corporate,
    alt: 'Estructura corporativa de cristal negro con vetas rojas en un espacio iluminado.',
    focus: 'center center',
  },
};
