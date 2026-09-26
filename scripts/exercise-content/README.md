# Ampliaciones de los enunciados

`overrides.json` relaciona la ruta pública de cada tarea con instrucciones,
materiales adicionales y enlaces `slides` a diapositivas concretas. Todos estos
campos son opcionales: una entrada con solo `slides` conserva el enunciado original.
El importador sustituye las instrucciones cuando se proporciona un fragmento,
conserva los materiales originales y añade los nuevos. Los fragmentos no deben
incluir el contenedor `.instructions` ni la cabecera del sitio.

Los recursos compartidos de estas ampliaciones se mantienen en
`ejercicios/assets/dapw/`, fuera de las carpetas que se reconstruyen por asignatura.
Se reutiliza una única copia del ZIP original de Laura en las tres etapas de Compose.
El backup y el ZIP de origen no se modifican.

## Enlaces a soluciones privadas

El campo opcional `solutions` de `overrides.json` contiene dos URL HTTPS:
`pdf` (el PDF de la tarea en Google Drive) y `github` (su carpeta en el repositorio
privado). Se muestran en el lateral, junto a la descarga del enunciado, con la
indicación de acceso exclusivo del profesor. `apply_task_solutions` permite
actualizar estos enlaces sin reimportar los enunciados.

Los botones son públicos. El acceso al contenido lo controlan los permisos de
Drive y GitHub: los archivos y el repositorio deben seguir restringidos al
profesor. No hay credenciales ni comprobación de acceso en el navegador.
No se deben copiar los PDF de soluciones ni su código a este repositorio.
El lateral se oculta al imprimir y el generador de PDF lo elimina; las descargas
y los ZIP del alumnado contienen únicamente los enunciados y sus materiales.

## Tareas adicionales con PDF original

`additional-tasks.json` incorpora tareas que no están en el backup. Cada entrada
indica un identificador estable, carpeta, título, carpeta de la tarea anterior
(`after`) y ruta del PDF original dentro de este directorio. El resumen HTML se
asocia en `overrides.json` y utiliza `task-template.html` con el estilo común.

«Despliegue remoto — Ampliación de Prod Stage 2» aparece después de Prod Stage 2.
Su fuente es `Ampliacion_Prod_2_DAPW_Alumnado_Memoria_Investigacion.pdf`, facilitado
por el profesor el 21 de septiembre de 2026. El PDF de siete páginas se conserva
en `materials/dapw/` y se copia sin cambios a la tarea pública: SHA-256
`ecf12fad5e7818a4c3332bd959e143a11119991f5d29c8893fdb4af1a14fc93f`.
La descarga individual y ambos ZIP usan ese original; el importador lo excluye
de la regeneración de PDF para no sustituirlo por el resumen de la web.

El resumen distingue los requisitos prácticos de la investigación escrita G–L.
El nombre «Despliegue remoto» refleja el servidor contratado por Miralmonte que
describe el documento; no presupone un proveedor cloud ni un alojamiento nuevo.

## Enunciados y materiales de Docker y Compose

Numeración revisada el 21 de septiembre de 2026 tras añadir 20 diapositivas
en las posiciones 2–21. Las referencias siguientes usan la numeración actual
de la presentación (142 diapositivas); los identificadores y enlaces se conservan.

`dapw/docker-1-10.html` desarrolla la tarea «Docker 1..10» desde la
[presentación publicada de DAPW](https://docs.google.com/presentation/d/e/2PACX-1vTw-DZSe_JoloOOoBuGynxYXvCZ31fSif3pI7ijGYLHFs9t7eIO8DFnGYahfhgsYdl-N1GGRDX2Ab1R/pub),
consultada el 20 de septiembre de 2026. Se conserva la entrega original en PDF
con capturas. Se aclaran las comprobaciones y los archivos, sin incluir soluciones.

| Ejercicio | Diapositiva e identificador | Contenido |
| --- | --- | --- |
| 1 | 36 · `g385b3c8d33d_0_97` | Array de saludos aleatorios en `getGreeting.js`. |
| 2 | 37 · `g385b3c8d33d_0_111` | Placeholder de `AddNewItemForm.jsx`, conservando el texto solicitado. |
| 3 | 38 · `g385b3c8d33d_0_122` | Color de fondo en `index.scss`. |
| 4 | 46 · `g385b3c8d33d_0_230` | Publicar `ejercicio4` mediante comandos; contexto de construcción y subida en las diapositivas 43–45. |
| 5 | 47 · `g385b3c8d33d_0_240` | Publicar una imagen desde VS Code. |
| 6 | 72 · `g36ca059bd8e_0_121` | Alpine activo con posibilidad de ejecutar comandos. |
| 9 | 74 · `g36ca059bd8e_0_142` | Imagen Java, `java -version` y búsqueda de una imagen JRE más pequeña. |
| 10 | 75 · `g36ca059bd8e_0_165` | Enlace al [documento de Suma.java](https://docs.google.com/document/d/1bCh8zcwTmcTxv4XaGONjjTVBlV9puPRXs5FxbZXmDaw/edit?usp=sharing): entrada por teclado, prueba local, Dockerfile, compilación y ejecución en Docker. |

Cada ejercicio de Docker tiene un bloque independiente con número, título y
enlace a su diapositiva mediante `slide=id.…`. Los bloques pendientes 7 y 8 se
han retirado por indicación del profesor. Los ocho ejercicios restantes conservan
sus números de referencia. Los bloques usan los estilos compartidos de
`tarea-web.css` y conservan su separación en el PDF.

Se han extraído las capturas originales de la presentación, sin recrearlas:

| Recurso local en `ejercicios/assets/dapw/` | Procedencia y uso |
| --- | --- |
| `docker-todo-app.png` | Misma captura en las diapositivas 36, 37 y 38; se reutiliza en los ejercicios 1, 2 y 3. |
| `docker-image-list.png` | Diapositiva 44: referencia de `docker image ls` para el ejercicio 4. |
| `docker-vscode-editor.png` | Diapositiva 42: conectar Docker Hub desde VS Code, como apoyo al ejercicio 5. |
| `docker-vscode-images.png` | Diapositiva 42: menú de imágenes con Push, como apoyo al ejercicio 5. |

Las seis apariciones de estas cuatro imágenes tienen texto alternativo, enlace
para ampliar el original y enlace a la diapositiva de procedencia. Los enlaces
principales de los ejercicios 4 y 5 apuntan a sus enunciados (46 y 47), mientras
que sus pies de imagen apuntan al material de apoyo (44 y 42).

El resto de tareas de DAPW enlaza desde la cabecera del enunciado:

| Tarea | Diapositivas e identificadores |
| --- | --- |
| COMPOSE 1 | 117 · `g3a063833045_0_119` |
| COMPOSE 2 Y 3 --SOLO ALUMNOS AUSENTES | 118 · `g3a0e417b5f2_0_27`; 122 · `g3a0e417b5f2_0_36` |
| Flask Cat App – Evaluable | 118 · `g3a0e417b5f2_0_27` |
| DICE-APP_EVALUABLE | 122 · `g3a0e417b5f2_0_36` |
| COMPOSE -- DEV STAGE | 135 · `g3aa2083d3bb_0_0` |
| COMPOSE - PROD STAGE 1 | 136 · `g3aa2083d3bb_0_12`; 137 · `g3aa2083d3bb_0_22` |
| COMPOSE -- PROD STAGE 2 | 138 · `g3aa2083d3bb_0_34`; 139 · `g3aa2083d3bb_0_46`; 140 · `g3aa711bcff2_0_0`; 141 · `g3aa2083d3bb_0_71`; 142 · `g3ad665943a1_0_0` |

Las ocho capturas de las tres etapas de Compose enlazan también desde su pie a
la diapositiva concreta. COMPOSE 4, VIAJE-ESTUDIOS_EVALUABLE y DEFENSA FINAL quedan
sin enlace por indicación expresa del profesor: no se ha localizado una
diapositiva específica de esas tareas en la presentación publicada.

La aplicación inicial se ha identificado por el nombre y las rutas de las
diapositivas y contrastado con el repositorio oficial
[docker/getting-started-todo-app](https://github.com/docker/getting-started-todo-app).
En ese repositorio el saludo original es `GREETING`; el enunciado pide sustituirlo
por el array `greetings`, y precisa que el placeholder pertenece al campo de entrada.
El arranque con Watch y la entrada interactiva se han contrastado con
[Compose Watch](https://docs.docker.com/compose/how-tos/file-watch/) y
[docker container run](https://docs.docker.com/reference/cli/docker/container/run/).

Las dos primeras capturas facilitadas se transcriben a texto HTML en Flask Cat App
y Dice App. La tercera identifica las tres tareas que reciben el ZIP. Las capturas
4, 5–6 y 7–11 se incluyen, respectivamente, en Dev Stage, Prod Stage 1 y Prod Stage 2,
con texto alternativo, pies y enlaces para ampliarlas. También aparecen en sus PDF.

Los enunciados se basan en el ZIP: proyecto Django `personalblog`, SQLite,
aplicaciones `aboutme`, `posts`, `users` y `comments`, Tailwind en `theme/static_src/`,
recursos en `static/`, archivos subidos en `media/`, referencias de
`django-browser-reload` y configuración inicial de npm para Windows. Se pide
ampliar el mismo repositorio en cada etapa, sin incluir una solución de Compose.

Documentación contrastada al redactar las indicaciones:

- [Django 5.2 con Gunicorn](https://docs.djangoproject.com/en/5.2/howto/deployment/wsgi/gunicorn/).
- [Recopilación y publicación de estáticos de Django](https://docs.djangoproject.com/en/5.2/howto/static-files/deployment/).
- [Servicios y volúmenes de Docker Compose](https://docs.docker.com/reference/compose-file/services/).
- [Proxy HTTP de Nginx](https://nginx.org/en/docs/http/ngx_http_proxy_module.html).
- [Integración de django-browser-reload](https://github.com/adamchainz/django-browser-reload).

## Enunciados de Viaje de Estudios y Compose 1–4

Los cuatro enunciados se recuperaron el 20 de septiembre de 2026 a partir de los
materiales del profesor. Se mantienen los nombres públicos de las tareas, las
entregas en GitHub y las rúbricas cuando figuran en el original.

| Fragmento | Fuente y alcance |
| --- | --- |
| `dapw/viaje-estudios.html` | `README.md` de `6-Viaje-estudios-votacion.zip`, publicado en DAPW como «practica viaje» el 30 de octubre de 2025. Construcción y ejecución mediante comandos: Flask/Gunicorn, red `webnet` y Nginx. |
| `dapw/compose-1.html` | `README.md` y código de [compose-01.zip, enlazado en la diapositiva 117](https://drive.google.com/file/d/1I9znLac-E7TxhHEAtZE3bZedqWWGcCJf/view?usp=sharing). Completar el servicio PostgreSQL del proyecto de Apache. Los nombres `ejemplo`, `usuario` y `pg_pass` se contrastan con el CGI y el Compose originales. |
| `dapw/compose-2-3.html` | Diapositivas 118 y 122: Flask Cat App y Dice App con Compose, en dos bloques separados. Se incorporan los requisitos de la aplicación del [documento original de Flask Cat App](https://docs.google.com/document/d/1E-U95T-MHzXg8tQ0FOPDXZLWHzogp60Mqh5U7icc-wY/edit?tab=t.0), adaptando la construcción y el arranque a Compose. Dice App conserva las tres comprobaciones de `.env` de la diapositiva 122. |
| `dapw/compose-4.html` | `README.md` y código del adjunto original `4-Viaje-estudios-votacion.zip`. Crear `docker-compose.yaml` con `fiesta_app` y `fiesta_nginx` en la red predeterminada de Compose; el Dockerfile y la configuración de Nginx ya se proporcionan. |

La publicación «bug tarea viaje-estudios», del 31 de octubre de 2025, corrige
la ubicación de `templates`, que debe ir dentro de `app`. El ZIP contiene además
una ruta explícita `template_folder="../templates"` en `app.py`; el enunciado
aclara que hay que cambiarla por la ubicación predeterminada de Flask y
reconstruir la imagen. No se modifica el ZIP original ni se entrega una solución.
El ajuste se contrasta con la [API de Flask](https://flask.palletsprojects.com/en/stable/api/#flask.Flask).
El montaje de secretos de Compose 1 se contrasta con la
[documentación de Docker Compose](https://docs.docker.com/compose/how-tos/use-secrets/).

Se incorporan dos copias exactas de los materiales originales en
`ejercicios/assets/dapw/`:

- `6-Viaje-estudios-votacion.zip`: SHA-256 `6a81b3e612b5ae5fb4f029ff5dc55a1d2afd23bf8a4aa9538de836122c48c420`.
- `compose-01.zip`: SHA-256 `06c378d449f37c4ad88be6960904bbbae976583b3e4833b87cb69208d42a092a`.

En los PDF, `exercise-block--long` permite que los enunciados extensos continúen
en la página siguiente sin desplazar el bloque entero. `exercise-assessment`
mantiene unida la rúbrica y su ampliación opcional.

Compose 2 reutiliza el `templates.zip` ya publicado en Flask Cat App y Compose 3
enlaza al material de Dice App en Drive. Compose 4 conserva su adjunto original.
Viaje de Estudios y Compose 4 siguen sin enlace a una diapositiva concreta, por
indicación del profesor. No se incorporan entregas ni información del alumnado.

## Defensa final

`dapw/defensa-final.html` aplica, por indicación del profesor, las tres etapas
de Compose a la práctica propia desarrollada con Lydia en Backend de segundo
de DAW. Enlaza a Dev Stage, Prod Stage 1 y Prod Stage 2 mediante URLs públicas
para que las referencias también funcionen en el PDF. Los nombres de módulos,
servicios y rutas deben adaptarse al proyecto del alumno; no se adjunta el ZIP
de Laura. Se conserva la obligación original de entregar el repositorio y un ZIP
con la práctica final aunque ya se haya realizado la defensa. La tarea sigue
sin enlace a una diapositiva específica.

## Referencias de Desarrollo de Interfaces

Se han contrastado las ocho tareas de DI con las 49 diapositivas de la
[presentación publicada de Desarrollo de Interfaces](https://docs.google.com/presentation/d/e/2PACX-1vQjSCFaYOks61DHA7HLPfKcNM3FRX-cdEMkOVCL2Kq3hNAgg6dtyZqQemcE4F0JKA/pub),
consultada el 21 de septiembre de 2026. La correspondencia concreta es
«RA2,RA7 -Generar ejecutable. exe». La entrada solo añade `slides`: conserva
las instrucciones y la entrega existentes, e incluye los enlaces en su PDF
y en los ZIP de DI. Cada rango abre su primera diapositiva mediante un ID estable.

| Referencia | Diapositivas | Identificador de inicio |
| --- | --- | --- |
| Generar el .exe con PyInstaller, recursos y archivo .spec | 13–15 | `g3a7d6d50509_1_51` |
| Firma digital del ejecutable | 16–24 | `g3a7d6d50509_2_179` |
| Instalador con Inno y ejecución desatendida | 25–41 | `g3a7d6d50509_2_303` |
| Publicación en GitHub Releases | 42–44 | `g3a8f78e2a57_0_1` |
| Apoyo RA2: reconocimiento de voz | 45–49 | `g3a8f78e2a57_0_36` |

El bloque de voz se identifica como apoyo de RA2, según la correspondencia
del temario en la diapositiva 4. Las otras siete tareas no reciben enlaces:
las menciones generales a MiniOffice, componentes o FastAPI en el mapa de RA
no contienen sus enunciados ni el desarrollo de las prácticas.

## Referencias de Lenguaje de Marcas

Las 18 tareas públicas de LM 1DAW enlazan desde la cabecera a la
[presentación publicada de Lenguaje de Marcas](https://docs.google.com/presentation/d/e/2PACX-1vSgGxnpcx0d7veUB6VO_9h_39i1KS80H405V9xurcaIgrDlWmbL7saxlkiWKzoafg/pub),
consultada el 21 de septiembre de 2026 (394 diapositivas). Se añaden únicamente
referencias `slides` en `overrides.json`, conservando los enunciados y materiales.
Los enlaces usan el identificador estable `slide=id.…`; los rangos abren su
primera diapositiva y permiten continuar por las siguientes en la presentación.

| Tarea | Diapositivas de referencia | Correspondencia |
| --- | --- | --- |
| XML 1 | 35 | Enunciado de recetas: la captura coincide con la de la tarea. |
| XML2 | 36 | Enunciado de historia de la informática: la tabla coincide con la de la tarea. |
| XML 3 | 37–38 | Teoría de XML bien formado para corregir el archivo de planetas adjunto. |
| XML 4 | 26–27; 32–33 | Teoría de estructura y atributos para el XML de una universidad. |
| XML 5 | 26–27; 32–33 | Teoría de estructura y atributos para el XML del almacén. |
| XML-6 | 42–44 | Teoría de namespaces para productos y expositores; contrastada con el PDF adjunto. |
| xml 7 | 42–44 | Teoría de namespaces para productos y clientes. |
| xml - 8 | 26–27; 42–44 | Teoría de estructura XML y namespaces para Liga Fantasy y la feria de libros. |
| HTML 1..4 | 66–69 | Ejercicios HTML 1–4. |
| LM 5..8 | 80–83 | Ejercicios HTML 5–8, continuación del grupo anterior. |
| HTML 9..17 | 86–94; 95–101; 122 | Accesos a los grupos 9–13, 14–16 (incluido 14.2) y al ejercicio 17. |
| HTML 17..24 | 122; 135–143; 152–154; 161 | Ejercicio 17, grupo 18–22, vídeo/audio e incrustación. |
| RA2 -PRACTICA FINAL HTML --DEFENSA | 162–166 | Práctica HTML-RA2 (25), con sus capturas de referencia. |
| EJERCICIOS HTML | Desde 66 | Acceso al primer ejercicio de HTML; la tarea solo indica «ADJUNTAD ZIP» y no concreta un rango. |
| RA2-FINAL CSS (50%) | 241 | La práctica de Flexbox, imágenes redondeadas y hover coincide con el enunciado. |
| RA3- JS DOM | 292–296 | Ejercicios DOM 5–9; el ejercicio 5 de la diapositiva 279 trata de números primos y pertenece a otro bloque. |
| RA4-Validadores, JSON, JSON SCHEMA | 367; 325–342; 343–366 | Práctica final de JSON y teoría de XML Schema, JSON y JSON Schema. |
| RA5,6- JSON TO CSV, SQLITE | 367 | La diapositiva enlaza al mismo documento de la tarea, con las partes de CSV y SQLite. |

Las referencias de apoyo de XML se rotulan como «Teoría»: no se ha localizado
en la presentación un enunciado específico de esas seis tareas. La numeración
24 de HTML aparece tanto en audio (154) como en incrustación (161); se conservan
ambos destinos. Los 28 enlaces se incluyen también en los PDF regenerados y
en las descargas completas y por selección de LM.

## Documentación de Proyecto Intermodular

`pi/documentacion.html` conserva la entrega hasta el apartado 4 y la captura
original. Añade el índice completo y ejemplos de ocho proyectos, con sus enlaces
a una carpeta específica del Drive personal del profesor.

El índice se ha exportado sin modificaciones desde
[Indice Orientativo - Proyecto Intermodular - 2º DAW](https://docs.google.com/document/d/1MO2M3DZ0YIXtRvkcLrDn3sI6ld1nEqrXZhN8VbUEiS4/edit).
Su texto coincide con la captura. La copia de dos páginas se conserva en Drive
y se enlaza desde el enunciado y los materiales de la tarea.
SHA-256: `18f8102e8369c14ec27bdc8db538c3cc6aec5b0af60406ba4b6520576c81ca6c`.

Los nueve PDF de ejemplo proceden de `entregas-alumnos/PI/ENTREGAS.zip` del
respaldo de Teams. Se usa la última versión de cada memoria final y se omiten
duplicados y borradores anteriores. SportAccess se identifica como documentación
parcial: conserva sus dos documentos complementarios. La entrega original de
APPALUMNO incluye su memoria, presentación y enlace al repositorio; su código se
ofrece en un ZIP independiente.

Los enlaces de las memorias y del ZIP de APPALUMNO permitieron recuperar estas
copias del código el 24 de septiembre de 2026:

| Proyecto | Repositorio | Revisión |
| --- | --- | --- |
| Automalize · web | `Alejandro-Shadow/TFG-Miralmonte` | `328c4a3ccd0246539587deb7ab7571daff1f2286` |
| Automalize · escritorio | `harold1094/tfg-aplicacion-de-escritorio` | `cabb3a74a6815a49c57e5edd6034ecd424786019` |
| Automalize · n8n | `martinmunozb/n8nAutomatizacionVerifactu` | `840762e2f5aad924a5829b12851723e12c5eae89` |
| APPALUMNO | `enriquegit24/appAlumno` | `4a01c73cde4db28c4a58d22250805d8d7d0ea695` |

La copia de n8n sustituye una clave de servicio por un marcador e incluye un
LEEME para configurar credenciales propias. El repositorio de facturación
`gabrieljs26/Facturacion_Automanize` devolvía 404 y no se anuncia como disponible.
Los archivos del alumnado se alojan en Drive; el repositorio de la web solo
contiene sus enlaces. La descarga individual de la tarea y ambos ZIP de PI se
regeneran para incluir los enlaces de los ejemplos.
