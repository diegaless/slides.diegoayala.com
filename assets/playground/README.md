# Modo interactivo de la portada

Espacio abre el modo interactivo desde la portada. Esc, otra pulsación de
Espacio o el botón de cierre regresan a ella. El atajo respeta los botones,
desplegables, enlaces, formularios y otros diálogos; mantener la tecla pulsada
no abre varias instancias ni cierra el modo recién abierto.

El motor, los estilos del anillo y los sonidos se adaptan del código servido por
[iansilber.com](https://iansilber.com/) el 11 de noviembre de 2026:

- `engine.mjs`: JavaScript de su página, conservando las físicas, la tipografía
  circular, los rebotes y colores, la deformación y explosión, los gestos de
  arrastre y pinza y el hockey de 15 segundos con doble clic o doble toque.
- `ring.css`: estilos de `https://iansilber.com/styles.css`.
- `assets/balloon-squeeze.b64` y `assets/balloon-pop.b64`: los sonidos servidos
  en las mismas rutas bajo `https://iansilber.com/assets/`.

La integración usa un diálogo con un marco independiente, cargado al solicitar
el modo. El texto contiene exclusivamente los seis nombres completos de las
asignaturas de la portada, con sus mayúsculas y tildes originales. Los espacios
separan los nombres; no se añaden letras, signos ni texto introductorio.
La ayuda inferior se ha eliminado. `transition.mjs` mide únicamente esas letras
con `Range` y mantiene una correspondencia por posición: cada letra de cada
asignatura pasa al mismo lugar de su nombre en el círculo, sin intercambiarlas
por otras iguales de la página. Conserva su tipografía y peso; el tamaño se
adapta de manera uniforme para no comprimir las letras en pantallas pequeñas.

La entrada y la vuelta usan un elemento por letra animado con `transform` mediante
Web Animations. No hay un lienzo a pantalla completa, bucle de JavaScript por
fotograma, sustitución de caracteres ni dos versiones de una misma letra
superpuestas. Los textos originales se ocultan solo mientras se muestran sus
copias y se restauran al cerrar o cancelar. El motor espera a que acabe la entrada
antes de activar las físicas. `glyph-atlas.mjs` rasteriza cada carácter diferente
una sola vez por tamaño y color; los fotogramas del círculo reutilizan esos píxeles.
La entrada conserva el color, el texto y el fondo con resplandor del tema activo.
Los cambios de paleta de los rebotes se mantienen. Con movimiento reducido se
omite el recorrido de letras. Durante una partida o explosión, la salida usa un
fundido breve en lugar de reconstruir un anillo que ya no está completo.
Los puntos de entrada llevan `?v=3` para no mezclar el marco, el motor y los
estilos nuevos con las copias anteriores de la caché de GitHub Pages.

Los colores, eventos y sonidos del motor quedan dentro del marco; al cerrar se
elimina para liberar las animaciones, temporizadores y audio y recuperar el
foco. Los ajustes del motor solo aparecen con `?tweaks` en la URL del marco.

Se han traducido los controles y resultados. Las flechas impulsan el círculo;
Intro entra y sale del hockey. La clasificación usa `leaderboard.mjs` y la
clave `slides-playground-leaderboard-v1` del almacenamiento del navegador.
No se utiliza la API de la referencia ni se envían iniciales o resultados a
ningún servidor. Si el almacenamiento está bloqueado, se mantienen los
resultados de la sesión mientras siga abierto el modo.

La portada habitual sigue disponible sin JavaScript. El modo interactivo usa
módulos y necesita HTTP; para probarlo, ejecutar `python3 scripts/preview.py`
y abrir la dirección local que imprime. `npm test` comprueba también el orden,
validación y funcionamiento sin almacenamiento de la clasificación, la identidad
y orden de las letras, la coincidencia de los seis nombres y la reutilización
de los glifos en lugar de rasterizarlos en cada fotograma.
