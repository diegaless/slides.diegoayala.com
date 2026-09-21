# RM Skills · Desarrollo web

Módulo de apoyo para la modalidad 17, incorporado a la navegación de DAM/DAW,
SEF y los ejercicios. Usa los colores, tipografía y tema persistente del sitio.
No requiere dependencias de producción, servicios externos ni compilación.

## Contenido y fuentes

Revisión de fuentes: **21 de septiembre de 2026**.

| Contenido | Fuente primaria y ubicación |
| --- | --- |
| Evento RMurciaSkills 2027: 3 y 4 de marzo, IFELOR, Lorca | [Portal regional 2027](https://www.llegarasalto.com/rmurciaskills2027/) |
| Curso 2026–2027; edad desde 01/01/2006; selección por el centro; condiciones de SpainSkills 2028 | [Convocatoria del 13/04/2026](https://servicios.educarm.es/templates/portal/ficheros/websDinamicas/45/Convocatoria%20C.I%2052775%2013-4-26.pdf), páginas 4–5 del PDF |
| Solicitudes 14–24/04/2026; tutor 02–15/09/2026; participantes hasta 22/12/2026 | Misma convocatoria, página 5 |
| CEIPS Miralmonte: una plaza en Desarrollo web | [Selección de centros, firmada el 21/05/2026](https://www.llegarasalto.com/wp-content/uploads/2026/06/Resol.-Seleccion-de-Centros_RMurciaSkills27_Def-COPIA.pdf), página 2 del PDF |
| Tramitación inicial cerrada | [Sede CARM, procedimiento 4454](https://sede.carm.es/web/pagina?IDCONTENIDO=4454&IDTIPO=240) |
| Test project regional 2023 | [PDF oficial](https://www.llegarasalto.com/wp-content/uploads/2023/05/TestProjectSkill17.pdf), enlazado en [el archivo de 2023](https://www.llegarasalto.com/rmskills2023/): palíndromos (p. 5), suma de subconjuntos (p. 6), lista DECO (p. 7). Puntuaciones y bonificación: pp. 8–9 |
| Descripción técnica regional 2023 | [PDF oficial](https://www.llegarasalto.com/wp-content/uploads/2023/03/17-DT_DesarrolloWeb-RMSkills2023-v01.pdf) |
| Descripción técnica regional 2025 | [PDF oficial](https://www.llegarasalto.com/wp-content/uploads/2025/02/17-DT_DesarrolloWeb-RMSkills2025-v01.docx-1.pdf): Java, 6,5 h, criterios en p. 5 y herramientas/restricciones en pp. 5–6 |
| SpainSkills 2024 | [Paquete oficial](https://spain-skills.es/images/spainskills2024/pp/PLAN_DE_PRUEBAS_17_Desarrollo%20WEB_2024.zip), enlazado en [planes de prueba 2024](https://spain-skills.es/competiciones/estatal/spainskills-2024/planes-prueba). Inspeccionados el PDF de enunciados y la presencia del ZIP de materiales dentro del paquete |
| SpainSkills 2026 | [Plan oficial](https://spain-skills.es/images/spainskills2026/pp/PLAN_DE_PRUEBAS_SK_2026_17_Desarrollo_Web.pdf), enlazado en [planes de prueba 2026](https://spain-skills.es/competiciones/estatal/spainskills-2026/planes-de-prueba). Programa: p. 3; módulos I–VI: pp. 4, 11, 13, 19, 22 y 27 del visor, respectivamente |
| Tecnologías del material nacional 2026 | [Descripción técnica](https://spain-skills.es/images/spainskills2026/dt/DT_17_SK2026.pdf), especialmente pp. 5–6 |

Se enlazan los originales; no se reescriben los test projects ni se publican
soluciones. Los títulos breves y resúmenes facilitan localizar cada documento.
Las páginas de los enlaces `#page=` cuentan desde la primera página del archivo,
no desde la numeración impresa. Los documentos originales se inspeccionaron
también visualmente para comprobar el programa y la fila de Miralmonte.

## Límites del material disponible

- No se ha localizado una descripción técnica ni un test project de Desarrollo
  web de **2027** en el portal consultado. Esto se comunica como pendiente de
  confirmar; no se trasladan automáticamente las condiciones de otro año.
- El portal de **2025** enlaza la descripción técnica, pero su celda TP no tiene
  un enlace de descarga. Por ello se presenta como descripción técnica.
- El ejercicio 3 de **2023** requiere clases e interfaces de apoyo que no se
  adjuntan al PDF. Se avisa dentro de la ficha.
- El plan nacional de **2026** cita recursos de una dirección privada de la red
  de competición. No se ofrecen esos enlaces como descargas públicas.
- La diferencia entre Java regional (2023 y DT 2025) y desarrollo web nacional
  (2024 y 2026) es explícita. No se presupone el lenguaje de RMurciaSkills 2027.
- Las cuatro actividades de entrenamiento y sus tiempos son propuestas de aula.
  La duración de 3 h + 3 h 30 min del simulacro toma 2025 como referencia.

## Mantenimiento

- `rm-skills/index.html`: texto, enlaces, fechas y fuentes. Revisar los estados de
  los plazos y ambas fechas de última comprobación cuando cambie la información.
- `rm-skills/skills.css`: estilos acotados al módulo, con variantes claras y
  oscuras y adaptación a móvil.
- `rm-skills/skills.js`: ocho marcas de preparación, guardadas en
  `diego-ayala.rm-skills.progress.v1`. No se envían datos. Un almacenamiento
  bloqueado o inválido no impide usar la lista durante la sesión.
- El contenido y los desplegables funcionan sin JavaScript. En ese caso no se
  ofrece persistencia del progreso.
- `scripts/import-exercises.py` adapta el enlace de RM Skills al copiar la
  cabecera común a listados y tareas. El cambio de navegación no requiere
  regenerar PDF ni ZIP: la cabecera solo se muestra en pantalla.

Cuando se publique la DT 2027, añadirla junto a la convocatoria, comprobar sus
tecnologías y reglas, y ajustar el plan de preparación. Mantener el archivo
histórico identificado por edición y ámbito.

## Validación y vista previa

Con un servidor estático del proyecto en el puerto 4173:

```bash
PLAYWRIGHT_MODULE=/ruta/al/modulo/playwright node scripts/check-rm-skills.cjs
```

La comprobación cubre navegación, anchors, desplegables, persistencia y reinicio
de la lista, almacenamiento bloqueado, funcionamiento sin JavaScript, temas y
desbordamiento en tamaños móviles. No accede a servicios de publicación.

Las fuentes externas se comprobaron mediante peticiones HTTP y se contrastaron
con los documentos descargados para revisión. Se mantiene la web estática y sin
seguimiento automático de convocatorias.
