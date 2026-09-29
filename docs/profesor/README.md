# Panel de soluciones

Acceso: https://slides.diegoayala.com/profesor/ y el candado del pie de página.
La entrada muestra el botón de Google centrado y el gag «Solo para Diego.
Prueba y me quedo tus datos. 😏». Solo aparecen otros mensajes cuando se está
preparando el acceso o hay un error. El texto es una broma; el cambio visual no
añade ninguna recogida de datos ni modifica los permisos de las cuentas.
El profesor inicia sesión con Google y elige, por tarea, **Publicar**, cerrar el
acceso o **Programar** una fecha. El alumnado no necesita iniciar sesión para
consultar soluciones públicas. Las copias que ya haya descargado se conservan.

Con sesión de profesor, **Solución PDF** abre el visor original de Drive y
**Código en GitHub** abre la carpeta del repositorio, sin descargar un ZIP.
Debajo aparecen **Panel de profesor** y **Cerrar sesión**, disponibles también
si no se puede consultar el estado de publicación. Cerrar sesión elimina el
acceso de profesor en esa pestaña y actualiza los enlaces del ejercicio.

Para el alumnado, una solución publicada abre el PDF sobre el ejercicio y
descarga el ZIP con un clic. Cada descarga comprueba el acceso en las reglas
del servidor. Sin acceso, los enlaces abren los originales de Drive o GitHub,
que mantienen sus permisos. También son la alternativa si falla la carga de la
copia, al abrir en otra pestaña o con JavaScript desactivado.

El panel enlaza directamente **PDF en Drive** y **Código en GitHub**. Los enlaces
antiguos al visor de la web siguen funcionando: al identificar al profesor,
redirigen al original del archivo elegido. Consultar no publica soluciones.

La sesión se conserva en la pestaña hasta cerrarla o pulsar **Cerrar sesión**.
Los enlaces internos del panel y de las soluciones mantienen esa pestaña para
no perder la identificación. En otra pestaña independiente se puede iniciar
sesión desde el propio visor. No se guarda una sesión permanente en el equipo.
Los enunciados con soluciones autorizan en su CSP la versión concreta del SDK
y los orígenes de Firebase necesarios para comprobar el estado y la cuenta;
el visor admite únicamente los PDF obtenidos como `blob:`. El resto de
restricciones de contenido se conservan. Al cerrar el visor se libera el archivo.

## Proyecto y coste

Proyecto independiente `slides-profesor-diego`, plan **Spark**, sin cuenta de
facturación. Solo utiliza Google Authentication y Firestore Standard, base
`(default)` en `europe-west1`, con cuota gratuita. No tiene Functions, Cloud Run,
Storage, copias de seguridad de pago ni recuperación PITR. La web sigue en
GitHub Pages. No vincular una cuenta de facturación ni actualizar a Blaze.
Si se agota una cuota, el servicio afectado queda limitado en lugar de generar
cargos. Los scripts administrativos comprueban que no hay facturación antes de
subir archivos o autorizar profesores.

## Protección del contenido

- `teacherAccounts/{uid}` autoriza exclusivamente una identidad de Google
  verificada. Ningún cliente puede crear o modificar roles.
- `solutionStates/{id}` guarda el estado. Solo el profesor puede cambiarlo,
  con un esquema cerrado. Las nuevas tareas nacen privadas.
- `solutionFiles/{id}-{pdf|codigo}` contiene el manifiesto de cada archivo;
  `parts/{sha256}-{n}` contiene fragmentos de hasta 512 KiB. El contenido nunca
  se incluye en GitHub Pages ni en el repositorio público.
- Las reglas comprueban el estado al solicitar cada parte. La programación
  usa el reloj del servidor, sin tareas programadas ni servicios de pago.
- Las descargas comprueban tamaño y SHA-256; no usan persistencia en disco del
  SDK. Cerrar el acceso impide nuevas lecturas, pero no borra copias descargadas.
- Los originales de Drive y GitHub mantienen sus permisos privados. El panel
  conserva enlaces a esos originales; el alumnado recibe las copias protegidas.

La configuración del SDK y los identificadores de tarea son públicos por
diseño. No sustituyen las reglas de acceso. Las credenciales administrativas
permanecen en Firebase CLI, fuera del repositorio y del navegador del alumnado.

## Actualizar soluciones

Necesita Node 22+ y los repositorios privados `di-soluciones`, `lm-soluciones`,
`dapw-soluciones` y `rmskills-soluciones` como carpetas hermanas. Solo se empaquetan archivos
versionados de `HEAD`; revisar y confirmar los cambios privados primero.

```sh
npm ci
npx firebase login
python3 scripts/prepare-solution-assets.py
node scripts/sync-solution-assets.mjs
```

La preparación deja PDF/ZIP y un manifiesto en `.private/solution-assets/`,
excluido de Git. `assets/solutions/catalog.json` solo contiene metadatos.
La sincronización sube primero las partes y después activa su manifiesto.
No reinicia el estado de tareas existentes; nuevas tareas quedan privadas.
Las partes antiguas se conservan para que terminen las descargas en curso.
Revisar la cuota de almacenamiento al realizar muchas actualizaciones grandes.

Los nuevos enlaces se conservan al regenerar tareas con
`scripts/import-exercises.py`. No regenerar PDF de enunciados por cambios del
panel: las soluciones se sirven por separado.

RM Skills utiliza `scripts/exercise-content/rm-skills-solutions.json`, con una
entrada por edición. El panel ofrece el filtro RM Skills y abre el desplegable
del año correspondiente. Los dos bloques comparten sesión, pero tienen estados
de publicación independientes. Cerrar sesión en uno oculta los controles de
profesor en ambos. En 2023 solo están resueltos los ejercicios 1 y 2; ListaDECO
se mantiene pendiente de los archivos auxiliares originales.

Para autorizar otra cuenta de profesor, esta debe haber intentado entrar con
Google primero. El propietario del proyecto ejecuta explícitamente:

```sh
node scripts/grant-teacher.mjs correo-del-profesor
```

No hay altas de profesor en la página. El script exige correo verificado y
proveedor Google; no autoriza por un correo escrito en el cliente.

## Comprobar y publicar

```sh
npm test
npm run test:rules
python3 tests/preview-security.py
npx firebase deploy --only firestore --project slides-profesor-diego
```

Las pruebas de reglas requieren Java 21 y usan `demo-slides-profesor`, sin
credenciales ni datos de producción. Cubren acceso anónimo, cuentas ajenas,
suplantación del correo, privilegios, cierre, programación, esquema y archivos
inmutables. La interfaz se sirve localmente con `python3 scripts/preview.py`.
La vista previa escucha solo en localhost y bloquea `.private`, los archivos
ocultos, dependencias, listados de carpetas y enlaces a archivos fuera de la web.
Con la configuración publicada conecta al proyecto real: no publicar tareas
reales al probar la interfaz. Para pruebas locales aisladas, dejar temporalmente
`firebaseConfig = null` en una copia local y arrancar los emuladores; nunca
publicar esa configuración ni archivos de prueba.

Tras desplegar las reglas, publicar el código por el flujo habitual de GitHub
Pages. La configuración del proveedor Google y los dominios autorizados se
gestionan en Firebase Authentication; no añadir un bloque `auth` a firebase.json
porque esta versión de Firebase CLI no despliega ese bloque.

Verificado el 29 de septiembre de 2026: 6 pruebas de lógica y 11 de reglas;
publicar/cerrar/programar/cancelar desde el panel; descarga anónima de PDF/ZIP y
rechazo tras cerrar, con el ZIP idéntico al original por SHA-256. Revisión visual
de escritorio y móvil (390 px), en modo claro y oscuro.

También se comprobó el acceso directo con Google desde una solución privada,
la lectura del PDF y descarga del ZIP sin publicarla, la conservación de sesión
al navegar entre panel, enunciado y visor, y el bloqueo tras cerrar sesión. La
vista simultánea de un visitante permaneció cerrada durante toda la prueba.

Acceso del alumnado verificado con una solución pública anónima en los
emuladores: PDF en el visor y ZIP idéntico por SHA-256. Tras cerrar la publicación
en el emulador, el mismo enlace lleva a GitHub; sin sesión en la web, el PDF
privado lleva a Drive. El profesor usa ahora esos originales directamente y
puede cerrar sesión desde el propio enunciado. No se cambia ninguna publicación
real durante estas pruebas.
