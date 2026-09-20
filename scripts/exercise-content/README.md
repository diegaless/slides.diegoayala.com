# Ampliaciones de los enunciados

`overrides.json` relaciona la ruta pública de cada tarea con un fragmento HTML de
instrucciones y, opcionalmente, materiales adicionales. El importador sustituye
el bloque de instrucciones, conserva los materiales originales y añade los nuevos.
Los fragmentos no deben incluir el contenedor `.instructions` ni la cabecera.

Los recursos compartidos de estas ampliaciones se mantienen en
`ejercicios/assets/dapw/`, fuera de las carpetas que se reconstruyen por asignatura.
Se reutiliza una única copia del ZIP original de Laura en las tres etapas de Compose.
El backup y el ZIP de origen no se modifican.

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
