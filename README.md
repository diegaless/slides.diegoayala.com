# Material de clase de Diego Ayala

Página estática sencilla para que el alumnado encuentre diapositivas y ejercicios por asignatura.

Diseño minimalista centrado con modo claro/nocturno y preferencia guardada en el navegador.

## Páginas

- `index.html`: selector de diapositivas y ejercicios DAM / DAW. Al abrir una
  asignatura se selecciona siempre «Diapositivas». Solo hay una asignatura desplegada.
- `ejercicios/`: biblioteca de ejercicios por asignatura, con los HTML, CSS, buscador,
  ordenación y descargas de la biblioteca existente en el backup de Teams.
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
las diapositivas de Proyecto Intermodular, sustituye `href="#"` y retira `data-pending`.
Una URL de ejercicios vacía muestra «Próximamente» sin crear un enlace inválido.
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
| Lenguaje de Marcas | `ejercicios/lm/INDICE.html` | 24 |
| Desarrollo de Interfaces | `ejercicios/di/INDICE.html` | 10 |
| Despliegue de aplicaciones Web | `ejercicios/dapw/INDICE.html` | 13 |
| Proyecto Intermodular | `ejercicios/pi/INDICE.html` | 2 |

Lenguaje de Marcas utiliza únicamente el grupo `LM 1DAW` de 2025–2026,
con sus 24 tareas publicadas. El grupo DAM y los cursos anteriores no se incluyen.

Los enunciados, imágenes, PDF y adjuntos se conservan. `aula.css`, `listado.css`
y `pdf.css` son copias literales del backup. Se comparten entre asignaturas.
`aula.js` conserva la búsqueda y ordenación, adaptadas para funcionar sin el filtro
«Mostrar». `pdf-lotes.js` mantiene la descarga de seleccionados y ajusta la ruta
de sus datos a cada biblioteca.

La cabecera usa la marca DA de la web mediante `marca.css`, sin el subtítulo
«Biblioteca de tareas». Los índices omiten el bloque «Sobre las fechas y esta
copia» y el pie ya no incluye el texto sobre disponibilidad sin conexión.
La tabla muestra la selección de PDF, la tarea y sus adjuntos. `listado-web.css`
ajusta su ancho y la barra de búsqueda y ordenación. El importador conserva estas
adaptaciones al regenerar los HTML.

La copia incluye tareas publicadas. Excluye borradores, accesos a entregas,
listados de alumnos y tres tareas con referencias nominales. Los ZIP y los datos
de descarga se reconstruyen con la misma selección. El backup no se modifica.

Para volver a generar la copia, revisa la selección `SUBJECTS` y `EXCLUDED_IDS` de
`scripts/import-exercises.py` y ejecuta:

```bash
docpython scripts/import-exercises.py /ruta/a/teams-backup/web
```

Si `docpython` no está disponible, puede usarse `python3`; el importador solo
necesita la biblioteca estándar. Sustituye exclusivamente las carpetas de salida
de las asignaturas definidas en `SUBJECTS`.

Sistemas informáticos conserva su acceso a diapositivas; sus ejercicios todavía
no están incluidos en esta selección.

## Propuesta visual

El concepto generado con imagegen y las capturas de la implementación están en
[`docs/selector/README.md`](docs/selector/README.md).

## Abrir

Puedes abrir `index.html` directamente en el navegador. No requiere servidor ni dependencias.
Sin JavaScript, los enlaces originales a las diapositivas siguen funcionando y
las bibliotecas permiten abrir tareas y descargar PDF. El selector, la búsqueda,
la ordenación y la descarga de seleccionados usan JavaScript.

Para una vista previa HTTP local: `python3 -m http.server 4173`.
