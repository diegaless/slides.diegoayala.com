# Panel de soluciones

Acceso: https://slides.diegoayala.com/profesor/ y «Acceso profesor» en el pie.
El profesor inicia sesión con Google y elige, por tarea, **Publicar**, cerrar el
acceso o **Programar** una fecha. El alumnado no necesita iniciar sesión para
consultar soluciones públicas. Las copias que ya haya descargado se conservan.

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

Necesita Node 22+ y los repositorios privados `di-soluciones`, `lm-soluciones`
y `dapw-soluciones` como carpetas hermanas. Solo se empaquetan archivos
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
npx firebase deploy --only firestore --project slides-profesor-diego
```

Las pruebas de reglas requieren Java 21 y usan `demo-slides-profesor`, sin
credenciales ni datos de producción. Cubren acceso anónimo, cuentas ajenas,
suplantación del correo, privilegios, cierre, programación, esquema y archivos
inmutables. La interfaz se sirve localmente con `python3 scripts/preview.py`.
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
