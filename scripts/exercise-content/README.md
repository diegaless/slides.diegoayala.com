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

`dapw/docker-1-10.html` desarrolla la tarea «Docker 1..10» desde la
[presentación publicada de DAPW](https://docs.google.com/presentation/d/e/2PACX-1vTw-DZSe_JoloOOoBuGynxYXvCZ31fSif3pI7ijGYLHFs9t7eIO8DFnGYahfhgsYdl-N1GGRDX2Ab1R/pub),
consultada el 20 de septiembre de 2026. Se conserva la entrega original en PDF
con capturas. Se aclaran las comprobaciones y los archivos, sin incluir soluciones.

| Ejercicio | Diapositiva e identificador | Contenido |
| --- | --- | --- |
| 1 | 16 · `g385b3c8d33d_0_97` | Array de saludos aleatorios en `getGreeting.js`. |
| 2 | 17 · `g385b3c8d33d_0_111` | Placeholder de `AddNewItemForm.jsx`, conservando el texto solicitado. |
| 3 | 18 · `g385b3c8d33d_0_122` | Color de fondo en `index.scss`. |
| 4 | 26 · `g385b3c8d33d_0_230` | Publicar `ejercicio4` mediante comandos; contexto de construcción y subida en las diapositivas 23–25. |
| 5 | 27 · `g385b3c8d33d_0_240` | Publicar una imagen desde VS Code. |
| 6 | 52 · `g36ca059bd8e_0_121` | Alpine activo con posibilidad de ejecutar comandos. |
| 7 y 8 | No aparecen en la presentación publicada. | Pendientes, por indicación expresa del profesor; no se inventan ejercicios. |
| 9 | 54 · `g36ca059bd8e_0_142` | Imagen Java, `java -version` y búsqueda de una imagen JRE más pequeña. |
| 10 | 55 · `g36ca059bd8e_0_165` | Enlace al [documento de Suma.java](https://docs.google.com/document/d/1bCh8zcwTmcTxv4XaGONjjTVBlV9puPRXs5FxbZXmDaw/edit?usp=sharing): entrada por teclado, prueba local, Dockerfile, compilación y ejecución en Docker. |

Cada ejercicio de Docker tiene un bloque independiente con número, título y
enlace a su diapositiva mediante `slide=id.…`. Los ejercicios 7 y 8 siguen
pendientes, sin enlaces inventados. Los bloques usan los estilos compartidos
de `tarea-web.css` y conservan su separación en el PDF.

Se han extraído las capturas originales de la presentación, sin recrearlas:

| Recurso local en `ejercicios/assets/dapw/` | Procedencia y uso |
| --- | --- |
| `docker-todo-app.png` | Misma captura en las diapositivas 16, 17 y 18; se reutiliza en los ejercicios 1, 2 y 3. |
| `docker-image-list.png` | Diapositiva 24: referencia de `docker image ls` para el ejercicio 4. |
| `docker-vscode-editor.png` | Diapositiva 22: conectar Docker Hub desde VS Code, como apoyo al ejercicio 5. |
| `docker-vscode-images.png` | Diapositiva 22: menú de imágenes con Push, como apoyo al ejercicio 5. |

Las seis apariciones de estas cuatro imágenes tienen texto alternativo, enlace
para ampliar el original y enlace a la diapositiva de procedencia. Los enlaces
principales de los ejercicios 4 y 5 apuntan a sus enunciados (26 y 27), mientras
que sus pies de imagen apuntan al material de apoyo (24 y 22).

El resto de tareas de DAPW enlaza desde la cabecera del enunciado:

| Tarea | Diapositivas e identificadores |
| --- | --- |
| COMPOSE 1 | 97 · `g3a063833045_0_119` |
| COMPOSE 2 Y 3 --SOLO ALUMNOS AUSENTES | 98 · `g3a0e417b5f2_0_27`; 102 · `g3a0e417b5f2_0_36` |
| Flask Cat App – Evaluable | 98 · `g3a0e417b5f2_0_27` |
| DICE-APP_EVALUABLE | 102 · `g3a0e417b5f2_0_36` |
| COMPOSE -- DEV STAGE | 115 · `g3aa2083d3bb_0_0` |
| COMPOSE - PROD STAGE 1 | 116 · `g3aa2083d3bb_0_12`; 117 · `g3aa2083d3bb_0_22` |
| COMPOSE -- PROD STAGE 2 | 118 · `g3aa2083d3bb_0_34`; 119 · `g3aa2083d3bb_0_46`; 120 · `g3aa711bcff2_0_0`; 121 · `g3aa2083d3bb_0_71`; 122 · `g3ad665943a1_0_0` |

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
| `dapw/compose-1.html` | `README.md` y código de [compose-01.zip, enlazado en la diapositiva 97](https://drive.google.com/file/d/1I9znLac-E7TxhHEAtZE3bZedqWWGcCJf/view?usp=sharing). Completar el servicio PostgreSQL del proyecto de Apache. Los nombres `ejemplo`, `usuario` y `pg_pass` se contrastan con el CGI y el Compose originales. |
| `dapw/compose-2-3.html` | Diapositivas 98 y 102: Flask Cat App y Dice App con Compose, en dos bloques separados. Se incorporan los requisitos de la aplicación del [documento original de Flask Cat App](https://docs.google.com/document/d/1E-U95T-MHzXg8tQ0FOPDXZLWHzogp60Mqh5U7icc-wY/edit?tab=t.0), adaptando la construcción y el arranque a Compose. Dice App conserva las tres comprobaciones de `.env` de la diapositiva 102. |
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
