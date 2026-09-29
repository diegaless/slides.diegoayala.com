# Material de clase de Diego Ayala

Página estática sencilla para que el alumnado encuentre diapositivas y ejercicios por asignatura.

Diseño minimalista centrado con modo claro/nocturno y preferencia guardada en el navegador.
El modo inicial es oscuro, independientemente del tema del sistema. Una nueva
preferencia de la web sustituye la antigua; los cambios posteriores a claro u
oscuro se recuerdan al navegar y volver a abrirla.
La portada, los listados y los ejercicios comparten la cabecera, los colores,
la tipografía y el selector de tema mediante `styles.css` y `theme.js`.

## Páginas

- `index.html`: selector de diapositivas y ejercicios DAM / DAW. Al abrir una
  asignatura se selecciona siempre «Diapositivas». Solo hay una asignatura desplegada.
- `ejercicios/`: biblioteca de ejercicios por asignatura, con los HTML, CSS y
  descargas de la biblioteca existente en el backup de Teams.
  «Solución PDF» abre el visor sobre el ejercicio y «Código ZIP» descarga el
  archivo si está publicado o hay sesión de profesor. Sin acceso, abren el
  original en Drive o GitHub, que comprueba sus propios permisos.
- `sef/index.html`: certificados SEF con módulos desplegables.
- `rm-skills/index.html`: convocatoria y preparación de Desarrollo web (modalidad 17),
  con pruebas oficiales anteriores, criterios de evaluación y recursos por edición.
  Las fuentes y el procedimiento de actualización están en `docs/rm-skills/README.md`.
- `fem/index.html`: acceso a [CV App](https://cvapp.diegoayala.com/) para crear un CV
  gratis, con una breve descripción sobre los filtros de selección (ATS).
  Implementa la tercera propuesta de ImageGen: titular centrado y botón «Crear mi CV».
  FEM aparece a la derecha de RM Skills en el menú de todas las páginas, incluidos
  los ejercicios y el puente a diapositivas. Usa el tema compartido; sus estilos
  específicos están en `fem/fem.css` y el enlace funciona también sin JavaScript.
- `go/index.html`: puente estable a una diapositiva por su identificador interno.
- `profesor/index.html`: acceso con Google para publicar, cerrar o programar las
  soluciones de cada tarea. Se entra desde el pequeño candado a la derecha del
  pie de las cuatro secciones. «Ver solución» abre las privadas para el profesor
  sin publicarlas; la navegación interna conserva su sesión en la pestaña.
- `soluciones/index.html`: visor PDF y descarga ZIP de las soluciones abiertas.
  Usa un proyecto Firebase independiente en Spark, sin facturación. Las 39
  tareas iniciales permanecen privadas hasta que el profesor las abra.
  Configuración, protección y mantenimiento: [panel de profesor](docs/profesor/README.md).

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
las diapositivas de Programación de Servicios y Procesos,
sustituye `href="#"` y retira `data-pending`.
Proyecto Intermodular ya enlaza sus diapositivas publicadas en Google Slides.
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

### Descargar las diapositivas

Las cinco asignaturas con diapositivas mantienen «Abrir diapositivas» para el
visor publicado y ofrecen «Descargar PDF» dentro de esa misma pestaña. La descarga
guarda el archivo directamente, sin abrir la interfaz de Google ni otra pestaña.
Los enlaces están en los elementos `.subject-download` de `index.html` y también
funcionan sin JavaScript. `script.js` los mueve al panel de su asignatura y muestra
la explicación de `data-download-description`.

Lenguaje de Marcas, Desarrollo de Interfaces, Sistemas informáticos, DAPW y
Proyecto Intermodular usan la exportación directa
`https://docs.google.com/presentation/d/ID/export/pdf`.
El 27 de septiembre de 2026 se verificó el acceso anónimo y la respuesta PDF con
`Content-Disposition: attachment`, también para los tres originales PowerPoint.
Los cinco originales tienen acceso público de lector. Las descargas utilizan la
versión actual de Google, sin mantener copias en el repositorio. La exportación
necesita el identificador original, no el identificador `2PACX` del visor publicado.
El original de PI es `1UO8wBxbfBgXrHgb1V47hi8cqk1PllFjbzI3tOUbHEX4`.

`assets/diapositivas/dapw.pdf` se conserva como copia histórica del 23 de septiembre
de 2026 para mantener los enlaces antiguos, pero el menú ya no la utiliza.
Las asignaturas y módulos SEF aún pendientes siguen mostrando «Próximamente».

## Biblioteca de ejercicios

Cada asignatura utiliza únicamente el último curso disponible del backup como
material base. La web no muestra etiquetas ni un selector de curso, y las rutas
de las bibliotecas y los nombres de los ZIP de selección no incluyen el año.

| Asignatura | Ruta | Tareas |
| --- | --- | ---: |
| Lenguaje de Marcas | `ejercicios/lm/INDICE.html` | 18 |
| Desarrollo de Interfaces | `ejercicios/di/INDICE.html` | 8 |
| Despliegue de aplicaciones Web | `ejercicios/dapw/INDICE.html` | 11 |
| Proyecto Intermodular | `ejercicios/pi/INDICE.html` | 2 |

Lenguaje de Marcas utiliza únicamente el grupo `LM 1DAW` de 2025–2026,
con 18 tareas publicadas seleccionadas. El grupo DAM y los cursos anteriores no se incluyen.

Los enunciados, imágenes y adjuntos se conservan. `aula.css`, `listado.css`
y `pdf.css` son copias literales del backup. Se comparten entre asignaturas.
`pdf-lotes.js` mantiene la descarga de seleccionados y ajusta la ruta de sus datos
a cada biblioteca. Se mantiene en el repositorio y el importador no lo sobrescribe
con la versión del backup. La lista se genera en orden cronológico y funciona sin JavaScript.

La cabecera se reutiliza desde `index.html`, con la firma «Diego Ayala», la
navegación DAM/DAW y SEF y el selector de tema. `ejercicios/assets/web.css` adapta
los listados, enunciados, botones y adjuntos a los mismos colores y tipografía de
la portada. El tema se aplica antes de mostrar la página y se conserva al navegar.
Los enunciados ampliados se presentan como texto continuo: los apartados se
distinguen por títulos, listas y espacios, sin tarjetas ni separadores entre
pasos. Esta presentación se comparte entre asignaturas y se adapta al móvil;
se define en `web.css`, que solo se carga en pantalla.
Los listados muestran el nombre de la asignatura y una lista de enlaces amplios,
con separadores suaves, una flecha para abrir cada ejercicio y selección de PDF.
«Seleccionar todos», los controles de descarga y «Quitar selección» aparecen debajo.
No incluyen el bloque introductorio, el buscador ni los controles de ordenación y filtrado.
También se retiran el bloque «Sobre las fechas y esta copia» y el pie de todas las
páginas de ejercicios. No hay cabeceras de tabla ni contadores de adjuntos;
los materiales siguen disponibles dentro de cada tarea.
`listado-web.css` mantiene la estructura de la lista y su impresión. El importador
conserva la cabecera y estas adaptaciones al regenerar los HTML. Sin JavaScript
se ocultan los controles de selección; los enlaces y el ZIP completo siguen disponibles.

El lateral de cada tarea muestra el botón «Descargar PDF» y, cuando tiene
solución preparada, sus enlaces al PDF y código protegidos. Se utiliza
`assets/solutions/exercise.mjs` para mostrar su disponibilidad. Mantiene los
ajustes de `tarea-web.css`. Se eliminan el panel «Sobre esta tarea» —fechas,
estado y puntuación— y la nota sobre el contenido del PDF.

Las ampliaciones de enunciados se mantienen en `scripts/exercise-content/`, con
un registro de instrucciones y materiales en `overrides.json`. El importador las
aplica después de leer el backup y antes de generar los PDF. En DAPW se amplían
«Docker 1..10» a partir de las diapositivas de clase y del documento enlazado en
el ejercicio 10; el 7 y el 8 quedan pendientes de enunciado. También se amplían
Flask Cat App y Dice App, con su enlace de Drive, y las tres etapas del blog de Laura:
desarrollo, Gunicorn y Nginx. Las capturas y un único ZIP compartido del proyecto
están en `ejercicios/assets/dapw/`; las tres etapas enlazan al mismo archivo.
La tarea «DOCKER COMPOSE APP LAURA» se retira de la selección pública.
Los diez ejercicios de Docker se presentan en bloques separados, con sus capturas
originales ampliables y enlaces a las diapositivas correspondientes. Las demás
tareas de DAPW con una diapositiva identificada también enlazan directamente a ella;
COMPOSE 4, VIAJE-ESTUDIOS_EVALUABLE y DEFENSA FINAL se mantienen sin enlace.
Estas referencias se conservan al regenerar los HTML, los PDF y los ZIP.

En DI se amplían QT6-8, MiniOffice alfa y final, distribución del ejecutable,
FastAPI/Jinja2 y componentes/señales. Los textos aclaran objetivos, pasos,
comprobaciones y entrega a partir de los originales y los proyectos de
referencia del profesor. RA5 recupera `ENUNCIADO.md` del repositorio de clase
`diegaless/py-jinja`, enlazado en el respaldo de Teams. Las fuentes y el alcance
quedan documentados en `scripts/exercise-content/README.md`.

En Proyecto Intermodular, «Documentación PI» conserva el índice orientativo y
organiza los ejemplos en tres cursos desplegables: 2025/26 (8 proyectos),
2024/25 (7) y 2023/24 (8). Todos aparecen cerrados inicialmente y se incluyen
completos en el PDF y en las descargas por lotes. El contenido permanente está
en `scripts/exercise-content/pi/documentacion.html`.

Los materiales se guardan en el Drive personal, dentro de
[Ejemplos de Proyecto Intermodular](https://drive.google.com/drive/folders/1lYoVKiK9grfyadwt-IunfR750UF2LtZl),
con una carpeta por curso. Los de 2025/26 proceden de las entregas del backup de
Teams; los históricos, de «Proyectos TFG24/25» y «PROYECTOSDAM2024» del Drive del
colegio. Los originales no se modifican. Las memorias se enlazan por separado
cuando están disponibles, junto con las presentaciones y entregas completas.
Rush & Dush y DecorEvent tenían la memoria en DOCX y cuentan con una copia PDF.
La copia pública de Picantón omite los DNI de su portada interior.

El código de Rush & Dush se recuperó del repositorio público enlazado en su
entrega, `inklord/Rush-Dush-tfg`, revisión
`a86297e803ead3726dd80da4d71748e25d21a2f0`. Por el límite de subida se guarda en
14 ZIP que se extraen en el mismo destino; se comprobaron sus 5.302 archivos
contra la descarga original. La carpeta incluye las instrucciones. HACK SLASH
no se publica: el ZIP de 2024/25 contiene solo una referencia Git LFS y falta
el archivo real. Tampoco se enlazan repositorios o carpetas que devuelven 404.
La copia del ZIP completo de Moon Software se ha eliminado del Drive personal
a petición del usuario tras la alerta automática de Drive Safety por posible
malware. El aviso no identifica qué archivo la provoca. El proyecto no se ha
ejecutado ni se ha intentado eludir el bloqueo. Se enlaza únicamente su
memoria PDF, cuya descarga pública sí se ha comprobado; esta comprobación de
acceso no equivale a una certificación de seguridad.

Los PDF descargables se generan desde estos HTML con los mismos estilos de
impresión, sin el panel «Sobre esta tarea». Conservan los enunciados, imágenes,
lista de materiales y numeración de páginas. Los PDF adjuntos se copian sin
modificarlos. Tanto el ZIP completo como la descarga de seleccionados utilizan
los PDF recién generados.
Los estilos compartidos de la portada y `web.css` se aplican solo en pantalla;
la impresión conserva el fondo blanco, los estilos originales y los enunciados.

La copia incluye tareas publicadas. Excluye borradores, accesos a entregas,
listados de alumnos, tareas individualizadas, los exámenes marcados como ocultos
y las tareas retiradas del material base. Se retiran sus páginas, PDF y adjuntos
de la carpeta pública, además de excluirlos de las descargas por lotes.
Los ZIP y los datos de descarga se reconstruyen con la misma selección.
El backup no se modifica.

Para volver a generar la copia, revisa la selección `SUBJECTS` y `EXCLUDED_IDS` de
`scripts/import-exercises.py` y los nombres de `SUBJECT_LABELS`.
La exportación necesita Node.js, Playwright y su
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

Para una vista previa HTTP local: `python3 scripts/preview.py`.
Abre `http://localhost:4173/`. El servidor evita guardar páginas en caché para
que los cambios de contenido y de rama se reflejen al navegar. Puedes elegir
otro puerto con `--port 4174`.
