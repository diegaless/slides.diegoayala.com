# Diapositivas de clase de Diego Ayala

Página estática sencilla para que el alumnado encuentre las diapositivas por asignatura.

Diseño minimalista centrado con modo claro/nocturno y preferencia guardada en el navegador.

## Páginas

- `index.html`: diapositivas DAM / DAW.
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

Abre `index.html` y sustituye cada `href="#"` por la URL publicada de Google Slides.
Para evitar que Google pida cuenta en móvil, usa el enlace de `Archivo -> Compartir -> Publicar en la web`, con formato:
`https://docs.google.com/presentation/d/e/ID_PUBLICADO/pub?start=false&loop=false&delayms=3000`

Si prefieres abrir el visor privado de Google Slides, usa:
`https://docs.google.com/presentation/d/ID/preview`

Si alguna vez quieres forzar descarga como PDF, usa:
`https://docs.google.com/presentation/d/ID/export/pdf`

## Abrir

Puedes abrir `index.html` directamente en el navegador. No requiere servidor ni dependencias.
