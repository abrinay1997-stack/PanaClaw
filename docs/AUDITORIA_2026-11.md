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
| **Seguridad** | **Aquí está lo más urgente** (§5): el límite de uso del chat casi no protege, no hay política de contenido (CSP), el Píxel de Meta carga sin consentimiento, hay 10 vulnerabilidades en dependencias (una crítica, de compilación) y la dirección `workers.dev` sigue abierta. |
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
| S9 | **Duplicado en `workers.dev`** | `panaclaw-sitio.abrinay1997.workers.dev` sirve el mismo sitio. Tiene `canonical` al dominio, pero es una copia pública y indexable | Apagar `workers_dev` (también cierra una puerta al chat, §5) |

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

Ordenado por gravedad.

| # | Hallazgo | Por qué importa | Arreglo |
|---|---|---|---|
| **X1** | **El límite de uso del chat casi no protege.** El tope por minuto (12) y el diario (300) viven en la memoria de cada instancia del Worker. En Cloudflare hay muchas instancias y se reinician: cada una cuenta desde cero | Alguien puede lanzar miles de preguntas y pagar con su llave de Meta (barata, pero sin tope). La comprobación de origen la salta cualquiera con `curl` | **Regla de límite de tasa en Cloudflare** sobre `/api/chat`, el binding de límite de tasa del Worker y un tope diario global en un Durable Object. Turnstile (gratis) para que el navegador demuestre ser una persona antes de chatear |
| **X2** | **`workers.dev` sigue abierta** | `panaclaw-sitio.abrinay1997.workers.dev/api/chat` llega al mismo chat y a las mismas llaves, fuera de las reglas que se pongan en el dominio | `workers_dev: false` en `wrangler.jsonc` |
| **X3** | **No hay política de contenido (CSP)** | Si algún día se cuela un script, nada lo frena. El sitio carga el Píxel de Meta, así que la CSP necesita medida | Empezar en modo solo-informe (`Content-Security-Policy-Report-Only`), mirar los avisos una semana y activar. Añadir `Cross-Origin-Opener-Policy` y ampliar `Permissions-Policy` |
| **X4** | **10 vulnerabilidades en dependencias** | **[medido]** 1 crítica (Astro: ejecución de código al optimizar imágenes AVIF), 8 altas, 1 moderada. Casi todas son de *compilación*, no del sitio publicado (que es estático); aun así hay que subirlas | `npm audit fix` en una rama y comprobar el sitio completo. Vigilar con Dependabot |
| **X5** | **El Píxel de Meta carga sin pedir consentimiento** | **[visto]** No hay aviso de cookies; solo la página de privacidad lo declara. Es un riesgo legal (la ley panameña de protección de datos, Ley 81 de 2019, habla de consentimiento) | **Consulta con su abogado** antes de decidir. Opciones: aviso con aceptar/rechazar y píxel solo tras aceptar, o medir con Cloudflare Web Analytics (sin cookies) |
| **X6** | **El chat envía lo que escriben los visitantes a Meta, que entrena con eso** | Elegido por usted con conocimiento. Falta decirlo en la política de privacidad, y la gente a veces escribe teléfonos y correos en un chat | Párrafo en `/privacidad/` (se lo redacto para que usted lo apruebe) y **ocultar teléfonos y correos** del texto antes de enviarlo |
| **X7** | **Sin tope de tamaño de la petición al chat** | Se lee el cuerpo completo antes de recortarlo a 6 mensajes de 1000 caracteres | Rechazar peticiones de más de 8 KB y más de 12 mensajes |
| **X8** | **Inyección de instrucciones («olvida tus reglas…»)** | **[visto]** Es un riesgo acotado: el chat solo contesta con el contexto, no ejecuta herramientas y la barandilla de precios bloquea cifras inventadas. Lo peor posible es una respuesta fuera de tema o que quede mal en una captura | Pruebas con un corpus de ataques, filtro de salida que quite enlaces ajenos, y registro de intentos |
| **X9** | **Correo: los informes DMARC van a un buzón de GoDaddy** | **[visto]** `rua=mailto:dmarc_rua@onsecureserver.net`: nadie los lee | Mandarlos a un buzón propio o a un servicio de lectura; cuando estén limpios, subir de `quarantine` a `reject` |
| **X10** | **Formulario futuro** | Cuando guarde datos tendrá que validarse y defenderse | Turnstile, límite de tasa, trampa para bots (honeypot), validación en el servidor, y que ningún campo llegue sin limpiar al correo (inyección de cabeceras) |
| **X11** | **Cuenta de Cloudflare y GitHub** | El token de despliegue y la cuenta son la llave de todo | Token con el mínimo permiso y solo para la zona; verificación en dos pasos en Cloudflare, GitHub y GoDaddy; rotar la llave de Groq que quedó expuesta en un registro hace meses, si aún existe |
| **X12** | **Menores** | Falta `/.well-known/security.txt`; DNSSEC desactivado (activarlo con la migración estable, en Cloudflare más el registro DS en GoDaddy); HSTS sin `preload`; revisar el CAA que solo permite Let's Encrypt | Una a una, sin urgencia |

**Lo que ya está bien [visto]:** el chat no tiene herramientas ni acceso a datos
privados, muestra el texto con `textContent` (sin riesgo de XSS), las cabeceras
`X-Frame-Options`, `nosniff`, HSTS y `Referrer-Policy` están, el Worker solo
responde `/api/*` (el resto sale del borde), las llaves están en secretos del
Worker y no en el repositorio, y `Always Use HTTPS` y SSL Full (strict) están
activos desde hoy.

---

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
9. **Iconos del pie:** ¿quitamos LinkedIn, GitHub y X hasta que existan?

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
