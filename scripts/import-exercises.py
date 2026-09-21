"""Copia la biblioteca HTML existente, con una selección para la web pública.

Uso: python3 scripts/import-exercises.py /ruta/a/teams-backup/web
No modifica el backup. Usa la biblioteca estándar de Python y regenera los PDF
con Node.js, Playwright y Chromium locales.
"""

import base64
import json
import re
import shutil
import subprocess
import sys
import zipfile
import zlib
from html import escape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote, unquote, urlsplit


DESTINATION = Path(__file__).resolve().parents[1] / "ejercicios"
CONTENT = Path(__file__).with_name("exercise-content")
# Último curso disponible de cada asignatura, utilizado como biblioteca base.
# Las rutas públicas no dependen del año de la clase de origen.
SUBJECTS = [
    ("LM 1DAW", "lm"),
    ("2DAM DI", "di"),
    ("DAPW", "dapw"),
    ("PI", "pi"),
]
SUBJECT_LABELS = {
    "LM 1DAW": "Lenguaje de Marcas",
    "2DAM DI": "Desarrollo de Interfaces",
    "DAPW": "Despliegue de aplicaciones Web",
    "PI": "Proyecto Intermodular",
}
# Tareas individualizadas o retiradas de la selección pública.
# Los identificadores permiten excluirlas sin reproducir los nombres del alumnado.
EXCLUDED_IDS = {
    "e4c0d408-c67b-4f15-b0c8-bab67578a541",
    "1c45e86c-6039-48da-bc36-a47518991dc6",
    "fa7504d6-d671-4312-b968-0dcf2f8102c5",
    # LM 1DAW: tareas retiradas del material base.
    "783587d4-0e83-4442-9dff-48ef6b6777c6",
    "cc04bf3e-ca9d-4b7e-8255-8253a4afe803",
    "d0135e33-6a41-412e-b907-05518aac35cd",
    # Exámenes de LM: excluir de la web y conservar los originales del backup.
    "49797c2a-c1d5-4da0-bf2a-d759a1dae0e0",
    "8ac7fe8d-1713-4498-9e2d-24abf55de7b4",
    "834c2929-68a2-4cbb-b40d-eaaddc450ef5",
    # DI: tareas retiradas del material base.
    "50d9c285-26eb-472b-86e1-9f694db8e7c8",
    "d69ee668-d2cb-48d2-9301-ddd04073867a",
    # DAPW: retirar la tarea CV de la selección pública.
    "c2999e9b-ce02-46b7-aae0-a05225740cf2",
    # Sustituida por las tres etapas de Compose del blog personal.
    "12c8b5e0-7ca5-48fc-9eeb-91f95367ca09",
}


class Links(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.files = set()
        self.pdf = None
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        url = attrs.get("src" if tag == "img" else "href", "")
        parsed = urlsplit(url)
        if parsed.scheme or parsed.netloc or not parsed.path:
            return
        path = unquote(parsed.path)
        if tag in ("a", "img") and not path.startswith(("../", "/")):
            self.files.add(path)
        if attrs.get("id") == "task-pdf-download":
            self.pdf = path


def read(path):
    return path.read_text(encoding="utf-8-sig")


def select_tasks(source, slug):
    manifest = json.loads(read(source / "manifest_web.json"))
    tasks = [task for task in manifest["Tareas"]
             if task["Estado"] == "PUBLICADA" and task["Id"] not in EXCLUDED_IDS]
    tasks.sort(key=lambda task: task.get("FechaCreacion") or "")
    for extra in json.loads(read(CONTENT / "additional-tasks.json")).get(slug, []):
        folder = extra["folder"]
        if not folder or folder in (".", "..") or "/" in folder or "\\" in folder:
            raise ValueError(f"Carpeta de tarea adicional inválida: {folder}")
        if any(task["Id"] == extra["id"] or task["Carpeta"].casefold() == folder.casefold() for task in tasks):
            raise ValueError(f"Tarea adicional duplicada: {slug}/{folder}")
        pdf = (CONTENT / extra["pdf"]).resolve()
        if not pdf.is_relative_to(CONTENT.resolve()) or not pdf.is_file() or pdf.suffix.lower() != ".pdf":
            raise ValueError(f"PDF original inválido: {slug}/{folder}")
        previous = next((i for i, task in enumerate(tasks) if task["Carpeta"] == extra["after"]), None)
        if previous is None:
            raise ValueError(f"Falta la tarea anterior a {slug}/{folder}: {extra['after']}")
        tasks.insert(previous + 1, {"Id": extra["id"], "Carpeta": folder,
                                  "Titulo": extra["title"], "PdfOriginal": extra["pdf"]})
    return tasks


def without_deliveries(html):
    html = re.sub(r"<!-- entregas-locales -->.*?<!-- /entregas-locales -->", "", html, flags=re.S)
    html = re.sub(r'<td class="delivery-cell">.*?</td>', "", html, flags=re.S)
    html = html.replace('<th scope="col">Entregas</th>', "")
    html = re.sub(r'<p class="general-access">.*?</p>', "", html, flags=re.S)
    return html


def adapt_header(html, home, assets):
    site = home.removesuffix("index.html")
    header = re.search(r'<header class="site-header">.*?</header>',
                       read(DESTINATION.parent / "index.html"), flags=re.S)[0]
    header = header.replace('href="./"', f'href="{home}"')
    header = header.replace('href="sef/"', f'href="{site}sef/"')
    header = header.replace('href="rm-skills/"', f'href="{site}rm-skills/"')
    html = re.sub(r'<header class="site-header">.*?</header>', lambda m: header, html, count=1, flags=re.S)
    html = html.replace('<html lang="es">', '<html lang="es" data-theme="dark">', 1)
    html = re.sub(r'<body(?: class="([^"]*)")?>',
                  lambda m: '<body class="exercises-page' + (' ' + m[1] if m[1] else '') + '">', html, count=1)
    html = html.replace('<title>Biblioteca de tareas · ', '<title>Ejercicios · ')
    html = re.sub(r'<footer class="wrap footer">.*?</footer>', '', html, flags=re.S)
    html = html.replace('<meta name="theme-color" content="#16243d">',
                        f'<meta name="theme-color" content="#030405"><script src="{site}theme.js"></script>')
    html = html.replace('</head>',
                        f'<link rel="stylesheet" href="{site}styles.css" media="screen">'
                        f'<link rel="stylesheet" href="{assets}web.css" media="screen">'
                        f'<link rel="icon" type="image/svg+xml" href="{site}assets/favicon.svg"></head>')
    return html


def apply_task_content(html, key):
    overrides = json.loads(read(CONTENT / "overrides.json"))
    override = overrides.get(key)
    if not override:
        return html
    if override.get("instructions"):
        instructions = read(CONTENT / override["instructions"]).strip()
        html, count = re.subn(
            r'<h2>Instrucciones</h2>.*?(?=<h2>Materiales de la tarea</h2>)',
            lambda m: '<h2>Instrucciones</h2><div class="instructions authored-instructions">\n' + instructions + '\n</div>\n',
            html, count=1, flags=re.S)
        if count != 1:
            raise ValueError(f"Falta el bloque de instrucciones: {key}")
    slides = override.get("slides", [])
    if slides:
        links = ''.join(
            '<a class="slide-link" href="' + escape(slide["href"], quote=True)
            + '" target="_blank" rel="noopener noreferrer"><span>' + escape(slide["label"])
            + '</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" '
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></a>'
            for slide in slides)
        html, count = re.subn(
            r'</h1>', lambda m: m[0] + '\n<nav class="task-slide-links" aria-label="Diapositivas de esta tarea">'
            + links + '</nav>', html, count=1)
        if count != 1:
            raise ValueError(f"Falta el título de la tarea: {key}")
    materials = override.get("materials", [])
    if materials:
        items = []
        for material in materials:
            href = escape(material["href"], quote=True)
            external = urlsplit(material["href"]).scheme == "https"
            attributes = ' target="_blank" rel="noopener noreferrer"' if external else ' download'
            action = 'M7 17 17 7M7 7h10v10' if external else 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5'
            items.append(
                f'<li><a class="attachment-link" href="{href}"{attributes}>'
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" '
                'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H5v18h14V8Z"/>'
                '<path d="M14 3v5h5M8 12h8M8 16h5"/></svg><span><strong>'
                + escape(material["label"]) + '</strong><small>' + escape(material["detail"]) + '</small></span>'
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" '
                f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{action}"/></svg></a></li>')
        added = '\n'.join(items)
        existing = re.search(r'<ul class="attachments">.*?</ul>', html, flags=re.S)
        if existing:
            html = html[:existing.end()-5] + added + html[existing.end()-5:]
        else:
            html, count = re.subn(r'<p class="subtle">No hay archivos adjuntos en esta tarea\.</p>',
                                  lambda m: '<ul class="attachments">' + added + '</ul>', html, count=1)
            if count != 1:
                raise ValueError(f"Falta el bloque de materiales: {key}")
    return html


def copy_task(source, destination, content_key=None):
    html = without_deliveries(read(source / "TAREA.html"))
    html = html.replace('href="../assets/', 'href="../../assets/')
    sidebar = re.search(r'<aside class="task-aside"[^>]*>.*?</aside>', html, flags=re.S)
    download = re.search(r'<a\b[^>]*\bid="task-pdf-download"[^>]*>.*?</a>',
                         sidebar[0] if sidebar else '', flags=re.S)
    if not download:
        raise ValueError(f"Falta el botón de descarga PDF: {source.name}")
    html = (html[:sidebar.start()]
            + '<aside class="task-aside task-download" aria-label="Descarga de la tarea">'
            + download[0] + '</aside>' + html[sidebar.end():])
    html = html.replace('</head>', '<link rel="stylesheet" href="../../assets/tarea-web.css"></head>')
    html = adapt_header(html, "../../../index.html", "../../assets/")
    if content_key:
        html = apply_task_content(html, content_key)
    links = Links(html)
    destination.mkdir(parents=True, exist_ok=True)
    for filename in links.files:
        original = (source / filename).resolve()
        if not original.is_relative_to(source.resolve()) or not original.is_file():
            raise ValueError(f"Recurso local inválido: {source.name}/{filename}")
        target = destination / filename
        target.parent.mkdir(parents=True, exist_ok=True)
        # El PDF del enunciado se genera desde el HTML público; los adjuntos
        # mantienen sus bytes originales, incluidos los que también son PDF.
        if filename != links.pdf:
            shutil.copyfile(original, target)
    (destination / "TAREA.html").write_text(html, encoding="utf-8")
    if not links.pdf:
        raise ValueError(f"Falta el enlace PDF: {source.name}")
    return links.pdf


def copy_additional_task(task, destination, slug):
    original = CONTENT / task["PdfOriginal"]
    html = read(CONTENT / "task-template.html").format(
        title=escape(task["Titulo"]), subject=escape(slug.upper()),
        pdf_href=quote(original.name, safe=""), pdf_name=escape(original.name, quote=True))
    html = adapt_header(html, "../../../index.html", "../../assets/")
    html = apply_task_content(html, f'{slug}/{task["Carpeta"]}')
    destination.mkdir(parents=True, exist_ok=True)
    (destination / "TAREA.html").write_text(html, encoding="utf-8")
    # El documento proporcionado es el enunciado completo. No regenerarlo
    # a partir del resumen HTML, ni en la descarga individual ni en los ZIP.
    shutil.copyfile(original, destination / original.name)
    return original.name


def copy_index(source, destination, tasks):
    html = without_deliveries(read(source / "INDICE.html"))
    html = html.replace('href="assets/', 'href="../assets/').replace('src="assets/', 'src="../assets/')
    html = html.replace('</head>', '<link rel="stylesheet" href="../assets/listado-web.css"></head>')
    html = html.replace('<script src="../assets/aula.js" defer></script>', '')

    def prepare_item(row):
        checkbox = re.search(r'<input\b[^>]*class="pdf-select"[^>]*>', row)
        link = re.search(r'(<a class="task-link"[^>]*>)(.*?)</a>', row, flags=re.S)
        if not checkbox or not link:
            raise ValueError(f"Falta el enlace o la selección de PDF: {source.name}")
        return ('<li class="exercise-item">'
                '<label class="exercise-select" data-pdf-control hidden>' + checkbox[0] + '</label>'
                + link[1] + '<span class="task-title">' + link[2] + '</span>'
                '<svg class="task-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
                'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
                '<path d="M5 12h14m-6-6 6 6-6 6"/></svg></a></li>')

    rows = {re.search(r'data-id="([^"]+)"', match[0])[1]: match[0]
            for match in re.finditer(r'<tr class="task-row"[^>]*>.*?</tr>', html, flags=re.S)}
    for task in tasks:
        if task.get("PdfOriginal"):
            title = escape(task["Titulo"], quote=True)
            rows[task["Id"]] = (f'<input type="checkbox" class="pdf-select" value="{escape(task["Id"], quote=True)}" '
                                f'aria-label="Seleccionar PDF: {title}">'
                                f'<a class="task-link" href="{quote(task["Carpeta"], safe="")}/TAREA.html">{title}</a>')
    # El manifiesto está ordenado por fecha; las ampliaciones siguen a su tarea base.
    # La lista funciona sin JavaScript. Los adjuntos permanecen dentro de la tarea.
    items = '\n'.join(prepare_item(rows[task['Id']]) for task in tasks)
    count = len(tasks)
    download_all = re.search(r'<a\b[^>]*id="pdf-all"[^>]*>.*?</a>', html, flags=re.S)
    if not download_all:
        raise ValueError(f"Falta la descarga de todos los PDF: {source.name}")
    download_all = re.sub(r'Descargar todos los PDF \(\d+\)',
                          f"Descargar todos los PDF ({count})", download_all[0])
    main = f'''<main class="wrap" id="contenido">
<a class="back-link" href="../../index.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6"/></svg>Volver a las asignaturas</a>
<div class="results-heading"><h1 id="results-title">{SUBJECT_LABELS[source.name]}</h1><p class="results-count" id="results-count">{count} ejercicios</p></div>
<ul class="exercise-list" id="task-list" aria-labelledby="results-title" role="list">
{items}
</ul>
<section class="pdf-toolbar" aria-label="Descargar ejercicios en PDF">
<div class="pdf-selection-tools" data-pdf-control hidden>
<label class="pdf-select-all"><input type="checkbox" id="pdf-select-all">Seleccionar todos</label>
<button class="pdf-clear" id="pdf-clear" type="button" disabled>Quitar selección</button>
</div>
{download_all}
<button class="button" id="pdf-selected" type="button" data-pdf-control hidden disabled>Descargar seleccionados (0)</button>
<p id="pdf-selection-status" role="status" aria-live="polite">Descarga los ejercicios en PDF, agrupados en un ZIP.</p>
</section>
</main>'''
    html, replacements = re.subn(r'<main\b[^>]*>.*?</main>', lambda m: main, html, count=1, flags=re.S)
    if replacements != 1:
        raise ValueError(f"Falta el contenido del índice: {source.name}")
    html = adapt_header(html, "../../index.html", "../assets/")
    (destination / "INDICE.html").write_text(html, encoding="utf-8")


def pdf_bundle(destination, tasks, pdfs):
    records = []
    used = set()
    with zipfile.ZipFile(destination / "PDF_TAREAS.zip", "w", zipfile.ZIP_DEFLATED) as bundle:
        for task, filename in zip(tasks, pdfs):
            data = (destination / task["Carpeta"] / filename).read_bytes()
            name = filename
            suffix = 2
            while name.casefold() in used:
                name = f"{Path(filename).stem} ({suffix}).pdf"
                suffix += 1
            used.add(name.casefold())
            entry = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            bundle.writestr(entry, data)
            records.append({"id": task["Id"], "name": name, "crc": zlib.crc32(data), "data": base64.b64encode(data).decode("ascii")})
    (destination / "assets").mkdir(exist_ok=True)
    payload = {"className": destination.name, "zipName": f"{destination.name} - Selección de tareas.zip", "files": records}
    (destination / "assets/pdf-datos.js").write_text("window.bibliotecaPDF = " + json.dumps(payload) + ";\n", encoding="utf-8")


def main(source):
    renderer = Path(__file__).with_name("render-exercise-pdfs.cjs")
    # Comprobar el navegador antes de sustituir las carpetas de salida.
    subprocess.run(["node", str(renderer), "--check"], check=True)
    shared = DESTINATION / "assets"
    shared.mkdir(parents=True, exist_ok=True)
    # Los ajustes visuales de la web se mantienen separados del CSS original.
    for name in ("aula.css", "listado.css", "pdf.css"):
        shutil.copyfile(source / "interfaz" / name, shared / name)
    # pdf-lotes.js se mantiene en el repositorio junto al diseño de la lista;
    # no sobrescribirlo con la versión de tablas y filtros del backup.
    report = []
    pdf_jobs = []
    bundles = []
    for source_name, slug in SUBJECTS:
        origin = source / source_name
        target = DESTINATION / slug
        tasks = select_tasks(origin, slug)
        # Eliminar únicamente salidas anteriores de este importador evita conservar
        # material retirado del manifiesto al regenerar la copia pública.
        if target.exists():
            shutil.rmtree(target)
        target.mkdir(parents=True)
        pdfs = [copy_additional_task(task, target / task["Carpeta"], slug) if task.get("PdfOriginal")
                else copy_task(origin / task["Carpeta"], target / task["Carpeta"], f'{slug}/{task["Carpeta"]}')
                for task in tasks]
        copy_index(origin, target, tasks)
        pdf_jobs.extend({"html": str(target / task["Carpeta"] / "TAREA.html"),
                         "pdf": str(target / task["Carpeta"] / filename)}
                        for task, filename in zip(tasks, pdfs) if not task.get("PdfOriginal"))
        bundles.append((target, tasks, pdfs))
        report.append({"subject": slug, "tasks": len(tasks), "attachments": sum(
            read(target / task["Carpeta"] / "TAREA.html").count('class="attachment-link"') for task in tasks)})
    subprocess.run(["node", str(renderer)], input=json.dumps(pdf_jobs), text=True, check=True)
    # Los ZIP reúnen los PDF generados y los originales de las tareas adicionales.
    for target, tasks, pdfs in bundles:
        pdf_bundle(target, tasks, pdfs)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main(Path(sys.argv[1]).resolve())
