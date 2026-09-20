# Selector de material por asignatura

Propuesta: desplegar las pestañas «Diapositivas» y «Ejercicios» bajo la asignatura seleccionada. Cada apertura empieza en «Diapositivas». Los ejercicios se abren en la biblioteca HTML existente, conservando su diseño y sus descargas. Se toma únicamente el último curso disponible de cada asignatura como base, sin mostrar etiquetas ni un selector de curso.

## Concepto con imagegen

Generado con la herramienta integrada de imagegen a partir de una captura de la web original.

![Concepto generado](imagegen.png)

## Implementación

![Selector en la web](selector.png)

![Biblioteca HTML reutilizada](biblioteca.png)

## Prompt utilizado

```text
Use case: ui-mockup
Asset type: high fidelity desktop website proposal, based on the attached screenshot.
Primary request: edit the reference website screenshot to show the proposed inline subject resource selector after clicking “Desarrollo de Interfaces”. Preserve the existing minimalist academic website and show a realistic implementable change.
Input image: existing site screenshot is the edit target and visual reference. Preserve header “DIEGO AYALA”, centered “DAM / DAW” and “SEF”, sun icon, footer links, nearly black background, subtle central indigo glow, clean system sans-serif typography, single centered list of five subjects, ample negative space.
Change: “Desarrollo de Interfaces” becomes the selected subject in bright white and a slightly heavier weight, with a thin violet underline. Directly underneath it, expand a restrained centered panel, width about 430px, rounded corners, barely visible charcoal-violet background and hairline border. The remaining subjects move down naturally; no overlap.
Panel content: at top a compact two-tab segmented control with a small outlined slide icon plus exact text “Diapositivas” as the selected violet-tinted tab and a small outlined code icon plus exact text “Ejercicios” as the inactive muted tab. Under the tabs, centered muted text exactly “Todo el material de clase, en un solo lugar.” Then a compact soft-violet primary action with exact text “Abrir diapositivas” and an external-link arrow.
Preserve these five subject names in this order: “Lenguaje de Marcas”, “Desarrollo de Interfaces”, “Despliegue de aplicaciones Web”, “Proyecto Intermodular”, “Sistemas informáticos”. The selected item is the second. Do not add a page heading, sidebar, cards for fake exercises, course counts, badges, brands, illustrations, annotations, browser chrome, or explanations. Show one desktop viewport, wide landscape composition, sharp legible Spanish text. Treat this as a website screenshot, not a presentation board.
```
