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
el modo. El texto se obtiene del nombre, título y navegación de la portada.
La ayuda inferior se ha eliminado. `transition.mjs` mide las letras visibles de
la página con `Range`, las reúne en las posiciones exactas que dibuja el motor
y las devuelve a la portada al cerrar. El motor espera a que termine la entrada
antes de activar las físicas, para evitar saltos entre la animación y el anillo.
La entrada conserva el color, el texto y el fondo con resplandor del tema activo.
Los cambios de paleta de los rebotes se mantienen. Con movimiento reducido se
omite el recorrido de letras. Durante una partida o explosión, la salida usa un
fundido breve en lugar de reconstruir un anillo que ya no está completo.

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
validación y funcionamiento sin almacenamiento de la clasificación, la
correspondencia única de letras y la continuidad de los extremos del recorrido.
