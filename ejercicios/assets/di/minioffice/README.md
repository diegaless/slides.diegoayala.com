# Demos de MiniOffice

Capturas reales de los ejecutables Windows x64 publicados en la [versión de demos](https://github.com/diegaless/slides.diegoayala.com/releases/tag/minioffice-demos-2026-09-27). Los binarios se distribuyen como ZIP portables en GitHub Releases, fuera del historial Git de la web. `manifest.json` recoge las versiones, tamaños y SHA-256 de los archivos originales y de las descargas.

| Ejercicio | Aplicación | Captura |
| --- | --- | --- |
| Alfa | Mini Word de Sonia Guevara García | miniword-editor.png |
| Final | MiniDock de Joaquín Carrasco Gómez | minidock-busqueda.png |
| Final | MiniOffice de Javier Alcaraz Martín | javier-busqueda.png |

Se han usado los ZIP aportados por el docente, con estas adaptaciones:

- Mini Word: tamaños enteros de Qt y etiquetas de negrita/cursiva cuando faltan los iconos.
- MiniDock: iconos relativos al módulo, cancelación correcta de Abrir/Guardar y cierre del panel sobre el dock.
- Javier: guardado de texto explícitamente como UTF-8.
- Las tres: lanzador que abre un documento de ejemplo y establece un tamaño inicial legible.

Compilación en Windows con Python 3.13.14 x64, PySide6-Essentials y shiboken6 6.10.1, PyInstaller 6.17.0, SpeechRecognition 3.14.5 y PyAudio 0.2.14. Se usa `--onedir --windowed --noupx`, se recogen los datos de SpeechRecognition, su metadato y el módulo pyaudio, y se añaden los iconos necesarios. El PATH del proceso de compilación se limita a Python y Windows para evitar incluir DLL de otros programas.

Cada ZIP contiene el ejecutable, `_internal`, `ejemplo.txt`, instrucciones de uso, cambios y avisos de terceros. La versión de Javier conserva su licencia AGPL-3.0 e incluye en `fuentes/` el código correspondiente, recursos, dependencias fijadas e instrucciones de reconstrucción.

Verificación realizada en Windows 11: arranque de los tres ejecutables, búsqueda desde la interfaz de MiniDock y Javier, e inicio de la versión de Javier después de extraer el ZIP en otra ruta con espacios. La copia extraída carga Python y Qt desde su propia carpeta. También se comprobaron en las fuentes abrir/guardar UTF-8, cancelación de diálogos, búsqueda en ambos sentidos, reemplazo, entrada vacía, deshacer/rehacer y contador. No se activó el micrófono ni se probó el servicio de voz.

Los fragmentos de `scripts/exercise-content/di/mini-office-*.html` y las entradas de `overrides.json` conservan las imágenes y descargas al regenerar los ejercicios. Las capturas también se incluyen en los dos PDF y en el lote de DI.

Autorías contrastadas con las entregas de Teams y los repositorios originales: [Sonia Guevara García](https://github.com/soniag017/Mini-Word) y [Joaquín Carrasco Gómez](https://github.com/JCGDeveloper/MiniDockQT6). El código de los ZIP aportados coincide con las revisiones indicadas en `manifest.json`.
