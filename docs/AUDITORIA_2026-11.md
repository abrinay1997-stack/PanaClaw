# Auditoría de panaclaw.com y plan de trabajo

**Fecha:** 8-nov-2026, justo después de pasar el sitio a Cloudflare.
**Alcance:** rendimiento, accesibilidad y contraste, SEO, seguridad, conversión
(ventas), animación y diseño. Solo lectura: no se cambió nada del sitio.
**Cómo se midió:** Lighthouse 12 y axe-core 4 (WCAG 2.2 AA) sobre el `dist/`
servido en local, capturas de pantalla de las páginas clave, lectura del código
y comparación con el sitio de D'CASA (`addons/website_dcasa`).

> Lo medido se marca **[medido]**. Lo que sale de leer el código o de mirar las
> capturas se marca **[visto]**. Lo que no se pudo comprobar está en el apartado
> «Lo que NO se pudo verificar», al final.

---

## 1. En una página

**La base técnica está sana. El problema es de venta y de presencia, no de código.**

| Área | Veredicto |
|---|---|
| Rendimiento | Muy bien **[medido]**: 95–100 en las 6 páginas probadas. En móvil, LCP de 2,3–2,6 s (simulado con red lenta): justo en el borde del umbral de Google (2,5 s). |
| Accesibilidad y contraste | Muy bien **[medido]**: 100 en Lighthouse y **0 fallos** de axe en 22 combinaciones (11 páginas × escritorio y móvil). |
| SEO técnico | Bien, con arreglos baratos y claros (§4). |
| **Seguridad** | Detalle fuera del repositorio (ver §5). |
| **Conversión** | **Aquí está lo que más cuesta dinero** (§2): la portada esconde sus mejores pruebas, la sección de cierre no tiene botón, la barra tiene 10 destinos y el formulario no guarda nada. |
| Animación y vidrio | Lo que usted ve es cierto (§3): hay un solo efecto de entrada y la barra no es de vidrio (es un 88 % opaca). |
| Tarjetas | Tiene razón (§2): todas salen de la misma receta y se ven de plantilla. Se rediseñan como un sistema de tipos distintos. |
| Blog | Ya tiene buscador y filtro, pero 24 tarjetas idénticas, sin destacados, sin tabla de contenidos y sin llamada a la acción según el tema (§2.1). |

---

## 2. Conversión: lo que distrae y lo que falta

### Hallazgos

**C1 · La portada no enseña los proyectos.** **[visto]** La sección «Trabajo
publicado» de la portada es una fila de seis dominios en texto
(`byslogistics.com.co`, `dcasapty.com`…), sin imagen. Mientras, `/proyectos/`
tiene capturas de los seis sitios y se ve muy bien. La prueba más fuerte que
tiene PanaClaw está detrás de un enlace pequeño («Ábrelos uno a uno →»).
**Gravedad: alta.**

**C2 · La sección de cierre de la portada no tiene botón.** **[visto]** Termina
con la frase «Tu competencia sale en Google. Tú sales en un perfil de
Instagram.» y no hay ninguna acción debajo. El único «Cotizar mi sitio» del final
es el del pie de página, pequeño. Es el momento de mayor intención de toda la
página y se desperdicia. **Gravedad: alta.**

**C3 · La barra de navegación tiene 10 destinos.** **[visto]** Inicio, Webs,
Servicios, Proyectos, eBot, Seguridad, Proceso, Ayuda, Contacto y el botón
Cotizar. Demasiadas opciones compiten entre sí. Además «Webs» lleva a `/planes/`
y no existe una página `/webs/`, y «Servicios», «eBot» y «Seguridad» se pisan.
**Gravedad: media.**

**C4 · El formulario de contacto no guarda ni conecta nada.** **[visto]** Abre
WhatsApp con el mensaje armado y listo. Si la persona no pulsa enviar en
WhatsApp, usted no se entera de que existió. No hay lead, ni correo, ni PDF, ni
conexión con el hub, el cotizador o Resend. Además abre dos ventanas (lo vio
usted). **Gravedad: alta para ventas.**

**C5 · `/planes/` repite y se alarga.** **[visto]** Mide 5 120 px en escritorio
y 7 911 px en móvil. Muestra las cuatro tarjetas, luego repite «Start» y
«Corporate» a pantalla casi completa (Launch y Commerce no tienen esa
presentación), luego las capacidades. Es información duplicada y desigual.
**Gravedad: media.**

**C6 · Las tarjetas se pierden contra el fondo.** **[visto]** Tarjetas casi
negras sobre fondo negro, con textos pequeños en gris y naranja. Pasa la prueba
de contraste (axe), pero la jerarquía visual es débil: todo pesa parecido.
Hay además tramos de espacio vacío grandes entre secciones. **Gravedad: media.**

**C7 · Faltan las piezas que cierran ventas.** **[visto]** En la portada no
aparece lo que la marca llama su firma, la lista de «qué NO incluye», ni una
pregunta frecuente corta, ni cómo funciona en tres pasos. Nota: no se pueden
añadir testimonios ni cifras si no están verificados (regla 4 del proyecto).
**Gravedad: media.**

**C8 · Hay competencia por la atención en la primera pantalla.** **[visto]**
Botón del hero («Cotizar mi sitio»), botón de WhatsApp, «Cotizar» de la barra,
burbuja flotante «Asistente» y la flecha de «Scroll». Cuatro acciones y la
jerarquía no está clara: debería haber **una** principal (el cotizador) y una
secundaria (WhatsApp). **Gravedad: baja a media.**

**C9 · Medición incompleta.** **[visto]** Solo está el Píxel de Meta. Google
Analytics 4 está vacío (`ga4MeasurementId = ''`). Hoy no se puede saber cuántas
personas pulsan WhatsApp ni cuántas terminan el cotizador. Sin eso, «optimizar
ventas» es adivinar. **Gravedad: alta para decidir bien.**

**C10 · Las tarjetas se ven de plantilla.** **[visto]** Lo dijo usted y las
capturas lo confirman. Casi todas las tarjetas del sitio (pilares, planes,
«además», capacidades, preguntas, blog) son la misma receta: rectángulo con
esquinas iguales y borde fino, etiqueta naranja diminuta en mayúsculas, título
blanco, texto gris y una flecha. Lo que hace que parezcan hechas por una
máquina: mismo radio y mismo espacio en todas, ninguna rompe la simetría, números
decorativos («01, 02, 03»), ningún objeto real dentro (una captura, una cifra
verificada, un detalle a mano), ninguna idea propia de la marca. La excepción es
`/proyectos/`: ahí las tarjetas llevan la captura del sitio y funcionan.
**Gravedad: media-alta (afecta a la confianza).**

**C11 · Pie de página.** **[visto]** El icono de WhatsApp estaba apagado y sin
enlace (**arreglado en esta misma rama**: ahora usa el mismo número que el resto
del sitio, el 6531-0721, desde `site.ts`). Siguen apagados e inertes los iconos
de LinkedIn, GitHub y X: un icono que no lleva a ningún lado parece abandono.
Propuesta: quitarlos hasta que existan las cuentas. **Gravedad: baja.**

### Qué proponer

- **Barra de 5 a 6 enlaces:** Proyectos, Planes, Servicios (eBot, Seguridad y
  Mantenimiento dentro), Cómo trabajamos, y el botón **Cotizar**. Ayuda,
  Contacto, Blog y legales pasan al pie.
- **Portada con orden de venta:** titular → botón principal → **capturas de los
  proyectos como protagonista** (fila o cinta animada) → cómo funciona en tres
  pasos → precios en una línea → qué NO incluye → pregunta frecuente corta →
  **cierre con botón grande**.
- **Un solo camino principal** en todas las páginas: Cotizar. WhatsApp es el
  segundo.
- **`/planes/` más corta:** una tabla comparativa, una explicación por plan
  (las cuatro con el mismo trato) y las capacidades.
- **Tarjetas: un sistema de tipos, no una receta.** Cada contenido tiene su
  forma:
  - *Proyecto:* la captura real en un marco de navegador, con una inclinación
    sutil al pasar el puntero, el dominio como etiqueta y una frase de resultado.
  - *Plan:* tratado como una **etiqueta de precio**: el precio es lo grande, con
    borde recortado tipo ticket, plazo y qué incluye en una línea. Corporate
    destacado por tamaño, no solo por una cinta.
  - *Pilar:* composición asimétrica (una grande y dos pequeñas) con una
    demostración viva dentro (p. ej. un medidor de velocidad que se llena).
  - *Capacidad:* compacta, con interruptor «añadir» que cambia de estado.
  - *Artículo:* ver §2.1.
  - *Detalles de la marca:* un motivo propio sacado del logo (las **marcas de
    garra** como separador y como brillo al pasar el puntero), grano sutil,
    sombras e iluminación interna reales, esquinas que varían a propósito, y
    textos con la voz de PanaClaw. Un solo acento: naranja `#FF5100`.
  - Se diseñan **2 o 3 direcciones** con las capturas reales y usted elige antes
    de programar. Prueba final: tapar el logo y comparar con tres agencias; si
    no se distingue, no está.

### 2.2 El chat: de burbuja a guía (hecho en esta rama)

**[visto, con captura de iPhone del 8-nov]** El chat se abría con la página
ampliada y recortado por la derecha. **Causa:** el campo de texto medía 14,5 px y
Safari de iPhone amplía la página al enfocar un campo de menos de 16 px; y el
código lo enfocaba solo al abrir. En escritorio era una ventana fija, sin poder
moverla, y la rueda del ratón sobre la conversación movía la página de atrás.

**Qué cambió [medido con `npm run medir:chat`]:**
- **Teléfono:** hoja que sube desde abajo (se arrastra hacia abajo para cerrarla),
  campo de 16 px, el teclado ya no se abre solo, botones de 44 px, la página de
  atrás queda quieta, y la hoja sube cuando aparece el teclado.
  Comprobado en iPhone SE, 13, 14 Pro Max y Pixel 7 (emulados): cabe entera, sin
  desborde lateral.
- **Escritorio:** se mueve arrastrando la cabecera (no se sale de la ventana,
  recuerda dónde la dejó y el doble clic la devuelve a su sitio), se agranda y la
  rueda sobre la conversación mueve la conversación.
- **Guía:** atajos siempre visibles («Ayúdame a elegir», «Ver proyectos»,
  «Cotizar»); «Ayúdame a elegir» pregunta qué necesita la persona y la lleva a
  la página o sección; las respuestas traen botones que salen de los hechos que
  usó el servidor (nunca de lo que invente el modelo); si el destino está en la
  misma página, se desplaza hasta la sección, la marca un instante y en teléfono
  pliega el chat para que se vea.
- **Contexto:** las preguntas de arranque cambian según la página (en `/ebot/`
  preguntan por eBot, en `/planes/` por los planes).
- La prueba comprueba también que cada pregunta de arranque recupera el hecho
  correcto y que cada ancla a la que apunta el chat existe de verdad.

**Lo que no se puede comprobar desde aquí:** Chromium emulando un iPhone no
reproduce el zoom automático de Safari. Se vigila la causa (tamaño de letra y foco
automático); el resultado real se ve en el iPhone **después de desplegar**.

### 2.1 El blog

**[medido]** 24 artículos, 5 categorías (la de «casos» está vacía; «guía» tiene
11 de 24, así que casi no filtra).
**[visto]** Lo que hay y lo que falla:

| # | Hallazgo | Detalle |
|---|---|---|
| B1 | **Ya tiene buscador y chips, pero no ayudan a encontrar.** | Una sola categoría por artículo y «guía» abarca casi la mitad. No hay orden (más nuevo, más útil), ni paginación (24 de golpe, y seguirá creciendo). El filtro no queda en la dirección: si usted busca «precio», entra a un artículo y vuelve, la búsqueda se pierde, y no se puede compartir un filtro |
| B2 | **24 tarjetas idénticas, sin jerarquía.** | Misma tarjeta para el artículo que más vende y para el que menos. No hay «Empieza aquí», ni destacados, ni agrupación por lo que la persona quiere resolver |
| B3 | **Las tarjetas no dicen lo que ayudaría a elegir.** | Muestran fecha y categoría; no muestran el tiempo de lectura (el dato existe en cada artículo), ni para quién es, ni si tiene cifras |
| B4 | **Sin imagen ni elemento visual.** | Ni en el listado ni dentro del artículo: son bloques de texto largos (700 a 1 400 palabras) |
| B5 | **Artículo sin tabla de contenidos ni barra de avance.** | En textos de 1 000+ palabras, la persona no sabe cuánto falta ni puede saltar a lo que busca |
| B6 | **La llamada a la acción es la misma en todos.** | Al final, siempre «Sale más rápido con una cifra concreta». Un artículo de seguridad debería llevar a la auditoría; uno de WhatsApp, a eBot; uno de precios, al cotizador. Y no hay ninguna llamada a mitad del texto |
| B7 | **Sin «anterior/siguiente» y con solo dos relacionados** | Se sigue por palabras clave compartidas. No hay «lo que sigue en el camino» |
| B8 | **Detalles de móvil** | La burbuja del asistente tapa la primera tarjeta; el texto del buscador se corta («…WhatsApp, Word») |

**Qué proponer**
- **Reorganizar por lo que la persona quiere resolver**, no por tipo de texto:
  Precios y planes · Seguridad · WhatsApp y eBot · Dominio y correo · Cómo
  trabajamos y qué esperar. Un artículo puede estar en varios temas.
- **«Empieza aquí»:** 3 artículos principales arriba, grandes, con imagen.
- **Buscador mejor:** resultados al escribir, con el texto encontrado marcado, y
  el filtro **en la dirección** (`?tema=precios&q=whatsapp`) para que se pueda
  compartir y para que el botón «atrás» funcione.
- **Orden y paginación:** más reciente, más útil; 12 por vez con «ver más».
- **Tarjeta de artículo con personalidad** (parte de C10): tiempo de lectura,
  «para quién es» en una línea y una imagen o ilustración propia por tema.
- **Artículo cómodo de leer:** tabla de contenidos pegada al lado, barra de
  avance, llamada a la acción **según el tema** y una a mitad del texto,
  «anterior/siguiente», compartir por WhatsApp (su canal), y fecha de
  actualización.
- Se mantiene el buscador propio mientras sean menos de unos 60 artículos; si
  crece, se cambia por Pagefind (búsqueda estática, sin servidor).

---

## 3. Animación y vidrio: de dónde partimos y adónde ir

### Lo que hay hoy en PanaClaw **[visto]**

- Un solo efecto de entrada (`Reveal.astro`: aparecer subiendo).
- Desplazamiento suave con Lenis (19 KB) y un fondo animado en el hero.
- La barra se encoge al bajar. El chat «llama la atención» con un pulso.
- Tres `@keyframes` en todo el sitio (el chat y una flecha de scroll).

### Lo que tiene D'CASA y PanaClaw no **[visto]**

| D'CASA | PanaClaw |
|---|---|
| Barra de **vidrio líquido**: tinte del 62 % (claro) o 26 % (ahumado sobre foto), desenfoque de 16 px, saturación 210 %, dos filos de luz, sombra suave | `rgba(9,1,1,.88)`: **88 % opaca**. Con ese tinte el desenfoque casi no se ve; es una píldora negra, no vidrio |
| **Refracción** real en Chromium (filtro SVG `feTurbulence` + `feDisplacementMap`): lo de detrás se ondula como agua | No |
| **La gota**: una burbuja de vidrio que se desliza con rebote hasta el enlace bajo el puntero | No |
| **Reflejo** que cruza la barra al pasar el puntero | No |
| Vidrio **claro u ahumado** según el fondo que haya detrás | Un solo estilo |
| Titulares que entran **palabra por palabra** | No |
| Entradas con variantes (izquierda, derecha, escala) y **cascada** con retraso por elemento | Solo «subir» |
| Foto del hero con zoom lento al entrar | No |
| Cinta de opiniones con botón de pausa (WCAG 2.2.2) | No |
| **Pruebas automáticas que protegen la barra** (`test_contrato_visual.py`): comprueban tinte, desenfoque, radio y esquinas en cada página y ancho | No hay nada que proteja la barra |

### Qué proponer

1. **Un sistema de movimiento** (no efectos sueltos): tiempos y curva comunes,
   atributos `data-anim` con variantes, cascada, titulares por palabras y
   entrada del hero en CSS puro (sin esperar JavaScript). Todo apagado con
   `prefers-reduced-motion`.
2. **Barra de vidrio ahumado** (el equivalente oscuro del de D'CASA): tinte entre
   6 y 12 % blanco, desenfoque 16 px, saturación 180–210 %, filos de luz arriba y
   abajo, gota con rebote, reflejo al pasar el puntero y refracción donde el
   navegador la soporte (en los demás, el vidrio sin refracción, que ya se ve
   bien).
3. **Prueba automática de la barra**, como en D'CASA, para que nadie la rompa
   sin darse cuenta: lee el estilo real en 3 anchos y falla si cambia.
4. **Microinteracciones con propósito:** tarjetas de proyecto que responden al
   puntero, el cotizador con transiciones entre pasos y un total que se
   actualiza con movimiento, el botón principal con un brillo discreto.
5. **Presupuesto de rendimiento en CI:** hoy el móvil está en el borde (LCP
   2,3–2,6 s). Lo que añada movimiento no puede empeorarlo. Regla: lo que está
   sobre el pliegue anima en CSS puro; lo demás, al entrar en pantalla.

### 3.1 Qué se toma de Safetory (el diseño que usted admira)

**[visto]** Se estudió `abrinay1997-stack/safetory` (estudio de grabación, Astro +
Three.js + GSAP). Lo que da su espaciado y su ritmo:

| Safetory | Qué significa para PanaClaw |
|---|---|
| **Una sola escala, la áurea (φ), para tipografía Y espaciado:** 10 · 16 · 26 · 42 · 68 · 110 · 178 · 288 px. Cada margen, hueco y tamaño sale de ahí | Es la razón por la que «todo respira igual». PanaClaw hoy usa 120 px fijos de relleno vertical en cada sección (también en un teléfono) y medidas sueltas. Propuesta: variables `--phi-*` y rehacer los espacios con ellas, con relleno **fluido** (56 → 120 px, como ya hace D'CASA) |
| **Reparto 61,8 % / 38,2 %** en los bloques de dos columnas y en el hero | Mejor que el 50/50: un lado manda y el otro acompaña. Aplicable a hero, planes y proyectos |
| **Un bloque, una idea, una pantalla** (100 dvh): «espacio negativo caro» | La portada de PanaClaw mide 5 716 px en móvil con huecos vacíos entre secciones; con la escala, el ritmo se vuelve intencional |
| **Etiqueta pequeña (kicker) + titular + texto**, siempre con el mismo hueco entre los tres | Ya lo usa PanaClaw (etiqueta naranja), pero con huecos distintos en cada página |
| **Titulares con `text-wrap: balance` e interlineado 0,92** | Líneas más parejas y titulares más compactos, sin cambiar la fuente |
| **Titular que entra letra por letra, con una prueba que se deshace sola si el troceado cambia la altura** (evita saltos de página, CLS) | Es la idea más valiosa técnicamente: animar titulares sin riesgo. D'CASA ya lo hace palabra por palabra sin librerías |
| **Movimiento diferido:** el módulo de animación (48 KB) no entra en el arranque y la página se lee igual si nunca llega | Mismo criterio que PanaClaw ya sigue (el hero va en CSS puro) |
| **Cada animación es solo `transform` y `opacity`**, una sola vez al entrar en pantalla, y se apaga con `prefers-reduced-motion` | Es la regla del sitio; se mantiene |
| *Última mejora de Safetory:* «tarjetas nítidas que se apagan al acercarse» | Idea para las tarjetas (C10): al pasar el puntero por una, las demás bajan de intensidad y la elegida gana protagonismo |

**Lo que NO se copia:** Three.js ni GSAP. Safetory vive de su escena 3D; PanaClaw
vende «abre en menos de un segundo» y su LCP en móvil ya está en el borde
(2,3–2,6 s). Se toma el **ritmo, la escala y la coreografía**, hechos en CSS.

---

## 4. SEO

**[medido]** sobre las 37 páginas del sitio.

| # | Hallazgo | Detalle | Arreglo |
|---|---|---|---|
| S1 | **Títulos demasiado cortos** en 5 páginas | `Ayuda — PanaClaw` (16 caracteres), `Blog — PanaClaw` (15), `Contacto — PanaClaw` (19), `Proceso — PanaClaw` (18), `Seguridad web — PanaClaw` (24). No dicen qué se encuentra ni usan palabras que la gente busca | 50–60 caracteres, con la palabra clave: p. ej. «Cómo trabajamos: precio y plazo por escrito — PanaClaw» |
| S2 | **23 títulos de más de 60 caracteres** | Casi todos los del blog (hasta 97). Google los corta | Acortarlos a ≤ 60 |
| S3 | **Descripciones fuera de rango** | 16 pasan de 160 caracteres (`/seguridad/` tiene 224); 5 quedan por debajo de 110 (`/contacto/` 97, `/cotizador/` 107, `/privacidad/` 87, `/terminos/` 82, `/blog/` 105) | 120–155 caracteres |
| S4 | **Fecha de modificación falsa en el mapa del sitio** | Las 37 URL llevan la misma `lastmod` (la hora de la compilación). Google aprende a ignorarla | Usar la fecha real de cada página o artículo |
| S5 | **`robots.txt` contradictorio** | `/gracias/` está bloqueada **y** lleva `noindex`. Si se bloquea, Google no puede leer el `noindex` | Quitar el `Disallow` y dejar solo `noindex` |
| S6 | **Datos estructurados incompletos** | Solo hay `LocalBusiness` en la portada. No hay nada en `/contacto/`, `/cotizador/`, `/proceso/`, `/servicios/`, `/privacidad/`, `/terminos/` | `WebPage` + `BreadcrumbList` en todas; `Service` en servicios |
| S7 | **Una sola imagen para compartir** (`og.png`) | Todas las páginas se comparten con la misma imagen | Una imagen por página clave (proyectos, planes, cotizador, blog) |
| S8 | **Etiqueta «Webs» ≠ página `/planes/`** | La palabra «Webs» está en la barra pero la URL y el título dicen «planes» | Unificar: la URL y el nombre deben coincidir con lo que la gente busca |

**Lo que está bien [medido]:** `canonical` en todas las páginas indexables, una
sola `h1` por página, ninguna imagen sin `alt` (las decorativas llevan `alt=""`),
`noindex` en las páginas que lo piden, `FAQPage` en ayuda, eBot y seguridad,
`Article` y `BreadcrumbList` en el blog, redirección `www` → dominio con 301.

**Search Console:** no tengo acceso desde aquí. Para «las recomendaciones de
Google Search Console» necesito que usted me pase, como captura o exportación:
Rendimiento (consultas y páginas, 3 meses), Indexación (páginas no indexadas y
motivo), Experiencia de página y Mejoras (datos estructurados). Y confirmar que
la propiedad sigue verificada tras el cambio.

---

## 5. Seguridad y bloqueos

El detalle de esta sección (hallazgos, pruebas y estado de cada uno) se quitó del repositorio cuando
pasó a ser público: una lista de debilidades no resueltas es una guía para quien quiera atacar. Se
guarda fuera del repositorio. Lo ya resuelto está en el historial de cambios del sitio (límite de uso
y tope de tamaño del chat, datos personales fuera del modelo, política de contenido en modo reporte,
dependencias al día, `security.txt`).

## 6. Plan de trabajo

Cada fase deja el sitio en producción y mejor que antes. Se mezcla por partes
pequeñas, con su comprobación.

### Fase 0: lo barato y urgente (1 día)
- Cerrar la puerta `workers.dev` (X2) y tope de tamaño del chat (X7).
- Botón en el cierre de la portada (C2).
- Títulos, descripciones, `robots.txt`, `lastmod` real, `security.txt` (S1–S5).
- Arreglar las dos ventanas del formulario (C4, solo el síntoma).
- `npm audit fix` en una rama aparte, con prueba completa (X4).
- Mandar los informes DMARC a un buzón propio (X9).

### Fase 1: proteger el chat y el borde (2–3 días)
- Regla de límite de tasa en Cloudflare, binding del Worker, tope diario en un
  Durable Object y Turnstile (X1).
- CSP en modo informe, `COOP` y `Permissions-Policy` ampliada (X3).
- Ocultar teléfonos y correos antes de enviar a Meta, y párrafo de privacidad (X6).
- Corpus de pruebas de inyección y filtro de salida (X8).
- Decisión de consentimiento con su abogado (X5).

### Fase 2: estructura y portada que venden (3–4 días)
- Barra de 5–6 destinos (C3). Portada reordenada con las **capturas de
  proyectos** como protagonista, cómo funciona en tres pasos, «qué NO incluye»,
  pregunta frecuente corta y cierre con botón (C1, C2, C7, C8).
- `/planes/` compacta y pareja (C5). Jerarquía visual y espacios (C6).
- **Tarjetas nuevas** (C10): 2 o 3 direcciones de diseño para elegir, y luego el
  sistema de tipos.
- Pie de página: quitar los iconos inertes (C11).
- Datos estructurados e imágenes para compartir por página (S6, S7, S8).

### Fase 3: movimiento y vidrio (4–5 días)
- Sistema de movimiento común y entrada del hero en CSS puro.
- Barra de vidrio ahumado con gota, reflejo y refracción, **más su prueba
  automática** (§3).
- Microinteracciones del cotizador y de las tarjetas.
- Presupuesto de rendimiento en CI.

### Fase 3b: el blog (3–4 días)
- Temas nuevos, «Empieza aquí», buscador y filtros con dirección compartible,
  orden y paginación, tarjeta nueva (§2.1).
- Artículo: tabla de contenidos, barra de avance, llamada según el tema,
  anterior/siguiente y compartir por WhatsApp.
- Títulos y descripciones de los 24 artículos (S2, S3).

### Fase 4: el formulario conectado (1 semana, la más grande)
- `/api/contacto` en el Worker: valida, limita, guarda en D1, avisa por Resend y
  deja el contacto en el hub. Respuesta al cliente con su cotización en PDF, con
  el mismo documento del cotizador del hub.
- Requiere decidir dónde vive el lead (hub o CRM) y diseñar el flujo del cotizador
  al formulario. **Se diseña antes de programarse.**

### Fase 5: medir y mejorar sin parar
- Google Analytics 4 y/o Cloudflare Web Analytics, eventos de WhatsApp y de fin de
  cotizador (C9).
- Search Console cada mes: consultas, páginas, errores. Contenido nuevo según lo
  que la gente busca de verdad.

---

## 7. Lo que necesito que usted decida

1. **Barra de navegación:** ¿Proyectos · Planes · Servicios · Cómo trabajamos ·
   Cotizar? (Ayuda, Contacto y Blog al pie.)
2. **Dónde vive un contacto nuevo:** ¿en la libreta del hub o en el CRM?
3. **Consentimiento del Píxel:** consultar con su abogado y elegir entre aviso con
   aceptar/rechazar o medir sin cookies.
4. **Vidrio:** ¿ahumado oscuro sobre el hero y claro más abajo, como hace D'CASA
   según el fondo, o ahumado siempre?
5. **Proyectos que van primero en la portada:** hoy son seis; ¿B&S Logistics y
   D'CASA al frente?
6. **Search Console:** las capturas o exportaciones del §4.
7. **Tarjetas:** ¿qué le gusta de otras webs (referencias) y qué quiere evitar?
   Con eso preparo las 2 o 3 direcciones.
8. **Blog:** ¿los cinco temas propuestos le sirven? ¿Cuáles son los 3
   artículos que más quiere que lea alguien nuevo?
9. **Escala de espaciado:** ¿adoptamos la escala áurea de Safetory como única medida del sitio?
10. **Iconos del pie:** ¿quitamos LinkedIn, GitHub y X hasta que existan?

## 8. Lo que NO se pudo verificar

- **Producción real.** La sesión no alcanza internet: todo se midió sobre la
  compilación en local. No pude ver las cabeceras que realmente entrega
  Cloudflare, ni el Píxel de Meta (que en una medición anterior sumó 233 KiB y
  620 ms de bloqueo en escritorio; los números de arriba **no lo incluyen**).
- **Search Console y Analytics.** Sin acceso: ni consultas, ni indexación, ni
  vitales reales de visitantes.
- **Texto sobre imágenes y fondos animados.** axe no puede medir el contraste
  donde hay foto o shader detrás; eso se revisa a ojo en la fase 3.
- **El cotizador por dentro** (reglas, PDF, recorrido de 4 preguntas): no se
  auditó a fondo; es la pieza central de venta y merece su propia ronda.
- **El hub y el CRM:** solo se miró lo que toca a la web.
- **Dispositivos reales:** medido con Chromium simulado, no con un teléfono.
