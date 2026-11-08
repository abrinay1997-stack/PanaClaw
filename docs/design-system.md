
## Escala de espacio (áurea)

Una sola medida para padding, margin y gap: `--e1`…`--e8` en `src/styles/global.css`
(10, 16, 26, 42, 68, 110, 178, 288 px; razón φ = 1,618; viene de Safetory). No se escriben
píxeles sueltos de 10 px o más en esas propiedades. Excepción: el menú flotante (`.floating-nav`,
`.nav-*`, `.brand`), que está medido al píxel por `medir:movil` y conserva sus valores.
