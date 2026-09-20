# Ampliaciones de los enunciados

`overrides.json` relaciona la ruta pública de cada tarea con un fragmento HTML de
instrucciones y, opcionalmente, materiales adicionales. El importador sustituye
el bloque de instrucciones, conserva los materiales originales y añade los nuevos.
Los fragmentos no deben incluir el contenedor `.instructions` ni la cabecera.

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
