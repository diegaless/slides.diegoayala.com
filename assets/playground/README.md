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
El cargador, el marco, el motor y el cliente de clasificación llevan `?v=6`;
los estilos del marco llevan `?v=4`, para evitar mezclar archivos nuevos con
copias anteriores de la caché de GitHub Pages. Las letras conservan sus colores
originales y los controles y resultados usan la tinta del tema para asegurar contraste.

Los colores, eventos y sonidos del motor quedan dentro del marco; al cerrar se
elimina para liberar las animaciones, temporizadores y audio y recuperar el
foco. Los ajustes del motor solo aparecen con `?tweaks` en la URL del marco.

Se han traducido los controles y resultados. Las flechas impulsan el círculo;
Intro entra y sale del hockey. Al terminar los 15 segundos se muestra la
**clasificación general**, compartida entre los jugadores de esta web.
Los tres campos de iniciales permiten guardar una marca que entra en el top 10.

## Clasificación compartida

`leaderboard.mjs` carga `score-client.mjs` únicamente al solicitar los resultados.
Se utiliza Firestore Lite 12.19.0 y Auth anónimo en el proyecto existente
`slides-profesor-diego`, base Standard `(default)`, `europe-west1`, plan Spark
sin facturación. No usa la API ni las puntuaciones de iansilber.com.

La app de Firebase `playground-scores` mantiene una identidad de juego separada
de la app `soluciones` del profesor. No necesita Google ni datos de contacto.
La identidad se recuerda en este navegador; otro dispositivo o borrar su
almacenamiento crea otro jugador. No se importan automáticamente las antiguas
marcas locales de `slides-playground-leaderboard-v1`.

Cada documento `playgroundScores/{uid}` guarda exclusivamente `initials`
(tres letras A–Z), `score` (entero seguro no negativo de JavaScript, hasta
9.007.199.254.740.991) y `updatedAt` (reloj del servidor). El cliente y las reglas
comparten ese límite de precisión; las bonificaciones no se recortan a 999.
Cada rebote del disco duplica el valor del siguiente gol: `2 ** min(rebotes, 30)`.
Por ejemplo, catorce rebotes dan 16.384 puntos. La clasificación conserva la
suma de puntos de la partida, aunque la interfaz original utilice la etiqueta «goles».
Solo su propietario anónimo puede crearlo o mejorar su récord, con 15 segundos
entre escrituras. Una transacción evita sustituir una marca mejor por otra peor.
La consulta general requiere una identidad y un límite máximo de diez; se
ordena por puntuación descendente y no necesita un índice compuesto. La interfaz
solo presenta iniciales y goles. La lectura individual está limitada al propietario.

El marcador es un juego casual: se validan esquema, identidad, límites e
intervalo, pero la simulación y la puntuación se calculan en el cliente.
Las reglas no pretenden constituir un sistema de competición con verificación
completa de las jugadas en un servidor.

Para habilitar únicamente el proveedor anónimo, conservando la configuración
de Google y verificando antes que no hay facturación:

```sh
node scripts/configure-playground.mjs --enable-anonymous
npx firebase deploy --only firestore:rules --project slides-profesor-diego
```

`npm run test:rules` ejecuta 18 pruebas en emuladores, incluidas las anteriores
de las soluciones. Se comprueban consultas anónimas y sin límite (rechazadas),
lectura individual ajena, escritura en otra identidad, asignación de roles,
borrado, campos adicionales, campos ausentes, tipos incorrectos, cadenas grandes,
fechas inventadas, puntuaciones fuera de rango, reducción del récord y escrituras
demasiado próximas (rechazadas). También acepta marcas de 10.000 y 16.384 y
comprueba el extremo superior seguro. Dos clientes con Auth anónimo y Firestore Lite
comparten una marca y el segundo no puede modificar la del primero.

Para probar la interfaz sin escribir en producción, arrancar los emuladores de
Auth y Firestore del proyecto `demo-slides-profesor`, servir la web local y abrir
`http://localhost:4173/?scores=emulator`. Esta opción solo se admite en localhost
y utiliza otra app y el proyecto demo; no se publica ninguna configuración de prueba.

La portada habitual sigue disponible sin JavaScript. El modo interactivo usa
módulos y necesita HTTP; para probarlo, ejecutar `python3 scripts/preview.py`
y abrir la dirección local que imprime. `npm test` comprueba también el orden,
validación y conservación de la mejor marca, la identidad y orden de las letras,
la coincidencia de los seis nombres y la reutilización
de los glifos en lugar de rasterizarlos en cada fotograma.
