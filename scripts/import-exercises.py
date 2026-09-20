"""Copia la biblioteca HTML existente, con una selección para la web pública.

Uso: python3 scripts/import-exercises.py /ruta/a/teams-backup/web
No modifica el backup. Solo usa la biblioteca estándar de Python.
"""

import base64
import json
import re
import shutil
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
    ("2DAM DI", "di"),
    ("DAPW", "dapw"),
    ("PI", "pi"),
]
# Tareas individualizadas o con listados nominales: no son material público.
# Los identificadores permiten excluirlas sin reproducir los nombres del alumnado.
EXCLUDED_IDS = {
    "e4c0d408-c67b-4f15-b0c8-bab67578a541",
    "1c45e86c-6039-48da-bc36-a47518991dc6",
    "fa7504d6-d671-4312-b968-0dcf2f8102c5",
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


def adapt_header(html, home):
    html = re.sub(r'(<a class="brand" href=")[^"]+(" title=")[^"]+(" aria-label=")[^"]+',
                  lambda m: m[1] + home + m[2] + "Volver a las asignaturas" + m[3] + "Volver a las asignaturas", html)
    return html


def copy_task(source, destination):
    html = without_deliveries(read(source / "TAREA.html"))
    html = adapt_header(html, "../../../index.html")
    html = html.replace('href="../assets/', 'href="../../assets/')
    links = Links(html)
    destination.mkdir(parents=True, exist_ok=True)
    for filename in links.files:
        original = (source / filename).resolve()
        if not original.is_relative_to(source.resolve()) or not original.is_file():
            raise ValueError(f"Recurso local inválido: {source.name}/{filename}")
        target = destination / filename
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(original, target)
    (destination / "TAREA.html").write_text(html, encoding="utf-8")
    if not links.pdf:
        raise ValueError(f"Falta el enlace PDF: {source.name}")
    return links.pdf


def copy_index(source, destination, tasks):
    html = without_deliveries(read(source / "INDICE.html"))
    html = adapt_header(html, "../../index.html")
    html = html.replace('href="assets/', 'href="../assets/').replace('src="assets/', 'src="../assets/')
    ids = {task["Id"] for task in tasks}

    def keep_row(match):
        task_id = re.search(r'data-id="([^"]+)"', match[0])[1]
        return match[0] if task_id in ids else ""

    html = re.sub(r'<tr class="task-row"[^>]*>.*?</tr>', keep_row, html, flags=re.S)
    count = len(tasks)
    attachments = sum(task["Adjuntos"] for task in tasks)
    html = re.sub(r'(<div class="list-intro">.*?<p>).*?(</p>)',
                  lambda m: m[1] + f"{count} tareas · {attachments} adjuntos" + m[2], html, count=1, flags=re.S)
    html = re.sub(r'(<select id="task-status"[^>]*>).*?(</select>)',
                  lambda m: m[1] + f'<option value="PUBLICADA">Publicadas ({count})</option>' + m[2], html, count=1, flags=re.S)
    html = re.sub(r'Descargar todos los PDF \(\d+\)', f"Descargar todos los PDF ({count})", html)
    html = html.replace("Todos los PDF incluye los borradores. ", "")
    html = html.replace("Aquí puedes abrir todas las tareas y los borradores.", "Aquí puedes abrir todas las tareas.")
    html = re.sub(r'(<p class="results-count"[^>]*>)\d+ tareas', lambda m: m[1] + f"{count} tareas", html)
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
    shared = DESTINATION / "assets"
    shared.mkdir(parents=True, exist_ok=True)
    for name in ("aula.css", "listado.css", "pdf.css", "aula.js"):
        shutil.copyfile(source / "interfaz" / name, shared / name)
    batch_js = read(source / "interfaz/pdf-lotes.js")
    batch_js = re.sub(r'const pdfDataURL = .*?;', "const pdfDataURL = new URL('assets/pdf-datos.js', location.href).href;", batch_js, count=1, flags=re.S)
    batch_js = batch_js.replace("Todos los PDF incluye los borradores. ", "")
    (shared / "pdf-lotes.js").write_text(batch_js, encoding="utf-8")
    report = []
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
        pdf_bundle(target, tasks, pdfs)
        report.append({"subject": slug, "tasks": len(tasks), "attachments": sum(t["Adjuntos"] for t in tasks)})
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main(Path(sys.argv[1]).resolve())
