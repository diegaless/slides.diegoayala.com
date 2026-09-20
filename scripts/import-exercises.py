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
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


DESTINATION = Path(__file__).resolve().parents[1] / "ejercicios"
# Último curso disponible de cada asignatura, utilizado como biblioteca base.
# Las rutas públicas no dependen del año de la clase de origen.
SUBJECTS = [
    ("LM 1DAW", "lm"),
    ("2DAM DI", "di"),
    ("DAPW", "dapw"),
    ("PI", "pi"),
]
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


def without_deliveries(html):
    html = re.sub(r"<!-- entregas-locales -->.*?<!-- /entregas-locales -->", "", html, flags=re.S)
    html = re.sub(r'<td class="delivery-cell">.*?</td>', "", html, flags=re.S)
    html = html.replace('<th scope="col">Entregas</th>', "")
    html = re.sub(r'<p class="general-access">.*?</p>', "", html, flags=re.S)
    return html


def adapt_header(html, home, assets):
    html = re.sub(r'(<a class="brand" href=")[^"]+(" title=")[^"]+(" aria-label=")[^"]+',
                  lambda m: m[1] + home + m[2] + "Volver a las asignaturas" + m[3] + "Volver a las asignaturas", html)
    logo = home.removesuffix("index.html") + "assets/favicon.svg"
    html = re.sub(r'<span class="brand-mark">.*?</span>',
                  lambda m: f'<span class="brand-mark"><img src="{logo}" alt="" width="64" height="64"></span>',
                  html, count=1, flags=re.S)
    html = html.replace('<span>Biblioteca de tareas</span>', '')
    html = html.replace('<title>Biblioteca de tareas · ', '<title>Ejercicios · ')
    html = re.sub(r'<footer class="wrap footer">.*?</footer>', '', html, flags=re.S)
    html = html.replace('</head>',
                        f'<link rel="stylesheet" href="{assets}marca.css">'
                        f'<link rel="icon" type="image/svg+xml" href="{logo}"></head>')
    return html


def copy_task(source, destination):
    html = without_deliveries(read(source / "TAREA.html"))
    html = html.replace('href="../assets/', 'href="../../assets/')
    html = adapt_header(html, "../../../index.html", "../../assets/")
    sidebar = re.search(r'<aside class="task-aside"[^>]*>.*?</aside>', html, flags=re.S)
    download = re.search(r'<a\b[^>]*\bid="task-pdf-download"[^>]*>.*?</a>',
                         sidebar[0] if sidebar else '', flags=re.S)
    if not download:
        raise ValueError(f"Falta el botón de descarga PDF: {source.name}")
    html = (html[:sidebar.start()]
            + '<aside class="task-aside task-download" aria-label="Descarga de la tarea">'
            + download[0] + '</aside>' + html[sidebar.end():])
    html = html.replace('</head>', '<link rel="stylesheet" href="../../assets/tarea-web.css"></head>')
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


def copy_index(source, destination, tasks):
    html = without_deliveries(read(source / "INDICE.html"))
    html = html.replace('href="assets/', 'href="../assets/').replace('src="assets/', 'src="../assets/')
    html = adapt_header(html, "../../index.html", "../assets/")
    html = html.replace('</head>', '<link rel="stylesheet" href="../assets/listado-web.css"></head>')
    html = html.replace('<script src="../assets/aula.js" defer></script>', '')
    html = re.sub(r'<div class="list-intro">.*?</div>', '', html, count=1, flags=re.S)
    html = re.sub(r'<section class="toolbar"[^>]*>.*?</section>', '', html, flags=re.S)
    html = re.sub(r'<details class="help">.*?</details>', '', html, flags=re.S)
    html = re.sub(r'<section class="empty-state"[^>]*>.*?</section>', '', html, flags=re.S)
    html = re.sub(r'<noscript>.*?</noscript>', '', html, flags=re.S)
    html = re.sub(r'<p class="draft-note"[^>]*>.*?</p>', '', html, flags=re.S)
    html = re.sub(r'<th scope="col"(?: class="[^"]+")?>(?:Creación|Entrega prevista|Imágenes|Estado)</th>', '', html)
    html = re.sub(r'<h2 id="results-title">(.*?)</h2>', r'<h1 id="results-title">\1</h1>', html, count=1, flags=re.S)

    def prepare_row(row):
        row = re.sub(r'<td class="date-cell">.*?</td>', '', row, flags=re.S)
        # El primer contador corresponde a imágenes; el segundo, a adjuntos.
        row = re.sub(r'<td class="number-cell(?: subtle)?">.*?</td>', '', row, count=1, flags=re.S)
        return re.sub(r'<td><span class="(?:published-label|draft-label)">.*?</span></td>', '', row, flags=re.S)

    rows = {re.search(r'data-id="([^"]+)"', match[0])[1]: match[0]
            for match in re.finditer(r'<tr class="task-row"[^>]*>.*?</tr>', html, flags=re.S)}
    # El orden del manifiesto ya está normalizado por fecha de creación.
    # La tabla funciona sin JavaScript ni preferencias de filtros guardadas.
    ordered_rows = '\n'.join(prepare_row(rows[task['Id']]) for task in tasks)
    html = re.sub(r'(<tbody id="task-rows">).*?(</tbody>)',
                  lambda m: m[1] + ordered_rows + m[2], html, count=1, flags=re.S)
    count = len(tasks)
    html = re.sub(r'Descargar todos los PDF \(\d+\)', f"Descargar todos los PDF ({count})", html)
    html = html.replace("Todos los PDF incluye los borradores. ", "")
    html = re.sub(r'(<p class="results-count"[^>]*>)\d+ tareas', lambda m: m[1] + f"{count} tareas", html)
    downloads = re.search(r'<section class="pdf-toolbar"[^>]*>.*?</section>', html, flags=re.S)
    if not downloads:
        raise ValueError(f"Faltan los controles de descarga: {source.name}")
    html = html[:downloads.start()] + html[downloads.end():]
    html = html.replace('</main>', downloads[0] + '</main>', 1)
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
    batch_js = read(source / "interfaz/pdf-lotes.js")
    batch_js = re.sub(r'const pdfDataURL = .*?;', "const pdfDataURL = new URL('assets/pdf-datos.js', location.href).href;", batch_js, count=1, flags=re.S)
    batch_js = batch_js.replace("Todos los PDF incluye los borradores. ", "")
    (shared / "pdf-lotes.js").write_text(batch_js, encoding="utf-8")
    report = []
    pdf_jobs = []
    bundles = []
    for source_name, slug in SUBJECTS:
        origin = source / source_name
        target = DESTINATION / slug
        manifest = json.loads(read(origin / "manifest_web.json"))
        tasks = [task for task in manifest["Tareas"] if task["Estado"] == "PUBLICADA" and task["Id"] not in EXCLUDED_IDS]
        tasks.sort(key=lambda task: task.get("FechaCreacion") or "")
        # Eliminar únicamente salidas anteriores de este importador evita conservar
        # material retirado del manifiesto al regenerar la copia pública.
        if target.exists():
            shutil.rmtree(target)
        target.mkdir(parents=True)
        pdfs = [copy_task(origin / task["Carpeta"], target / task["Carpeta"]) for task in tasks]
        copy_index(origin, target, tasks)
        pdf_jobs.extend({"html": str(target / task["Carpeta"] / "TAREA.html"),
                         "pdf": str(target / task["Carpeta"] / filename)}
                        for task, filename in zip(tasks, pdfs))
        bundles.append((target, tasks, pdfs))
        report.append({"subject": slug, "tasks": len(tasks), "attachments": sum(t["Adjuntos"] for t in tasks)})
    subprocess.run(["node", str(renderer)], input=json.dumps(pdf_jobs), text=True, check=True)
    # Tanto el ZIP completo como la selección usan los PDF recién generados.
    for target, tasks, pdfs in bundles:
        pdf_bundle(target, tasks, pdfs)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main(Path(sys.argv[1]).resolve())
