# Material de clase de Diego Ayala

Página estática sencilla para que el alumnado encuentre diapositivas y ejercicios por asignatura.

Diseño minimalista centrado con modo claro/nocturno y preferencia guardada en el navegador.

## Páginas

- `index.html`: selector de diapositivas y ejercicios DAM / DAW. Al abrir una
  asignatura se selecciona siempre «Diapositivas». Solo hay una asignatura desplegada.
- `ejercicios/`: biblioteca de ejercicios por asignatura, con los HTML, CSS y
  descargas de la biblioteca existente en el backup de Teams.
- `sef/index.html`: certificados SEF con módulos desplegables.
- `go/index.html`: puente estable a una diapositiva por su identificador interno.

## Enlaces estables a una diapositiva

Los números de página cambian cuando se insertan diapositivas. Los enlaces desde
DevTrack usan el identificador interno de Google Slides, que se conserva al
reordenar o insertar páginas:

`https://slides.diegoayala.com/go/?deck=lm&slide=g3b42695220fc7acd_67`

El parámetro `deck` admite `lm` y `ssii`. `slide` debe contener el identificador
de página sin el prefijo `id.`. La página puente solo permite las presentaciones
publicadas declaradas en `go/go.mjs`, por lo que no funciona como redirección
abierta.

## Editar enlaces

En `index.html`, el `href` de cada `.subject-link` contiene la URL de Google Slides;
`data-exercises-url` contiene la ruta a su biblioteca de ejercicios. Para enlazar
las diapositivas de Proyecto Intermodular o Programación de Servicios y Procesos,
sustituye `href="#"` y retira `data-pending`.
Una URL de ejercicios vacía muestra «Próximamente» sin crear un enlace inválido.
Programación de Servicios y Procesos está incluida en el menú; sus diapositivas
y ejercicios quedan pendientes de enlazar.
Los enlaces de contacto de DAM/DAW y SEF utilizan `diego.ayala@colegiomiralmonte.es`.
Para evitar que Google pida cuenta en móvil, usa el enlace de `Archivo -> Compartir -> Publicar en la web`, con formato:
`https://docs.google.com/presentation/d/e/ID_PUBLICADO/pub?start=false&loop=false&delayms=3000`

Si prefieres abrir el visor privado de Google Slides, usa:
`https://docs.google.com/presentation/d/ID/preview`

Si alguna vez quieres forzar descarga como PDF, usa:
`https://docs.google.com/presentation/d/ID/export/pdf`

## Biblioteca de ejercicios

Cada asignatura utiliza únicamente el último curso disponible del backup como
material base. La web no muestra etiquetas ni un selector de curso, y las rutas
de las bibliotecas y los nombres de los ZIP de selección no incluyen el año.

| Asignatura | Ruta | Tareas |
| --- | --- | ---: |
| Lenguaje de Marcas | `ejercicios/lm/INDICE.html` | 18 |
| Desarrollo de Interfaces | `ejercicios/di/INDICE.html` | 8 |
| Despliegue de aplicaciones Web | `ejercicios/dapw/INDICE.html` | 13 |
| Proyecto Intermodular | `ejercicios/pi/INDICE.html` | 2 |

Lenguaje de Marcas utiliza únicamente el grupo `LM 1DAW` de 2025–2026,
con 18 tareas publicadas seleccionadas. El grupo DAM y los cursos anteriores no se incluyen.

Los enunciados, imágenes y adjuntos se conservan. `aula.css`, `listado.css`
y `pdf.css` son copias literales del backup. Se comparten entre asignaturas.
`pdf-lotes.js` mantiene la descarga de seleccionados y ajusta la ruta de sus datos
a cada biblioteca. La tabla se genera en orden cronológico y funciona sin JavaScript.

La cabecera usa la marca DA de la web mediante `marca.css`, sin el subtítulo
«Biblioteca de tareas». Los listados abren directamente con la tabla; los controles
de descarga y «Quitar selección» aparecen debajo de ella.
No incluyen el bloque introductorio, el buscador ni los controles de ordenación y filtrado.
También se retiran el bloque «Sobre las fechas y esta copia» y el pie de todas las
páginas de ejercicios. La tabla muestra la selección de PDF, la tarea y sus adjuntos.
`listado-web.css` ajusta su ancho y el título del listado. El importador conserva
estas adaptaciones al regenerar los HTML.

El lateral de cada tarea muestra únicamente el botón «Descargar PDF», con los
ajustes de `tarea-web.css`. Se eliminan el panel «Sobre esta tarea» —fechas,
estado y puntuación— y la nota sobre el contenido del PDF.

Los PDF descargables se generan desde estos HTML con los mismos estilos de
impresión, sin el panel «Sobre esta tarea». Conservan los enunciados, imágenes,
lista de materiales y numeración de páginas. Los PDF adjuntos se copian sin
modificarlos. Tanto el ZIP completo como la descarga de seleccionados utilizan
los PDF recién generados.

La copia incluye tareas publicadas. Excluye borradores, accesos a entregas,
listados de alumnos, tareas individualizadas, los exámenes marcados como ocultos
y las tareas retiradas del material base. Se retiran sus páginas, PDF y adjuntos
de la carpeta pública, además de excluirlos de las descargas por lotes.
Los ZIP y los datos de descarga se reconstruyen con la misma selección.
El backup no se modifica.

Para volver a generar la copia, revisa la selección `SUBJECTS` y `EXCLUDED_IDS` de
`scripts/import-exercises.py`. La exportación necesita Node.js, Playwright y su
Chromium local. Reutiliza el runtime existente; si Node no resuelve Playwright,
indica su carpeta de módulo con `PLAYWRIGHT_MODULE`:

```bash
PLAYWRIGHT_MODULE=/ruta/al/modulo/playwright docpython scripts/import-exercises.py /ruta/a/teams-backup/web
```

Si `docpython` no está disponible, puede usarse `python3`; la parte Python solo
necesita la biblioteca estándar. El importador comprueba que Chromium funciona,
sustituye exclusivamente las carpetas de salida de las asignaturas definidas en
`SUBJECTS` y llama a `scripts/render-exercise-pdfs.cjs` antes de reconstruir los ZIP.
La exportación usa archivos locales y no realiza peticiones a Internet.

Sistemas informáticos conserva su acceso a diapositivas; sus ejercicios todavía
no están incluidos en esta selección.

## Propuesta visual

El concepto generado con imagegen y las capturas de la implementación están en
[`docs/selector/README.md`](docs/selector/README.md).

## Abrir

Puedes abrir `index.html` directamente en el navegador. No requiere servidor ni dependencias.
Sin JavaScript, los enlaces originales a las diapositivas siguen funcionando y
las bibliotecas permiten abrir tareas y descargar PDF. El selector de material y
la descarga de seleccionados usan JavaScript.

Para una vista previa HTTP local: `python3 -m http.server 4173`.
