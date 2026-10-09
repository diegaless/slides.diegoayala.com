"""Generate public SEO metadata, sitemap and responsive WebP images.

Run after importing exercises: python3 scripts/optimize-site.py
Validate the committed output: python3 scripts/optimize-site.py --check
Original images, PDFs and download links are kept unchanged.
"""

import argparse
import hashlib
import io
import json
import os
import re
from html import escape, unescape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote, unquote, urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://slides.diegoayala.com'
SUBJECTS = {'di': 'Desarrollo de Interfaces', 'lm': 'Lenguaje de Marcas',
            'dapw': 'Despliegue de aplicaciones Web', 'pi': 'Proyecto Intermodular',
            'psp': 'Programación de Servicios y Procesos'}
SIZES = '(max-width: 780px) calc(100vw - 44px), (max-width: 1100px) 65vw, 720px'
BEACON_SCRIPT = 'https://static.cloudflareinsights.com/beacon.min.js'
BEACON_ENDPOINT = 'https://cloudflareinsights.com'


class Tags(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.tags = []
        self.lines = [0]
        self.lines.extend(m.end() for m in re.finditer('\n', text))
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        line, column = self.getpos()
        start = self.lines[line - 1] + column
        self.tags.append((tag, dict(attrs), start, start + len(self.get_starttag_text())))


def public_pages():
    pages = [ROOT / 'index.html']
    pages += [ROOT / section / 'index.html' for section in ('sef', 'rm-skills', 'fem')]
    pages += sorted((ROOT / 'ejercicios').glob('*/INDICE.html'))
    pages += sorted((ROOT / 'ejercicios').glob('*/*/TAREA.html'))
    pages += sorted((ROOT / 'ejemplos').glob('*/*/index.html'))
    return pages


def canonical(path):
    relative = path.relative_to(ROOT).as_posix()
    if relative.endswith('index.html'):
        relative = relative.removesuffix('index.html')
    return ORIGIN + '/' + quote(relative, safe='/')


def plain(text):
    return ' '.join(unescape(re.sub(r'<[^>]+>', ' ', text)).split())


def description(path, html):
    subject = SUBJECTS[path.relative_to(ROOT).parts[1]]
    if path.relative_to(ROOT).parts[0] == 'ejemplos':
        return f'Ejemplos de {subject}: consulta el código, descarga los archivos y practica con los materiales de clase de Diego Ayala.'
    if path.name == 'INDICE.html':
        return f'Ejercicios de {subject}: consulta los enunciados, las referencias y los materiales de clase de Diego Ayala para DAM y DAW.'
    title = plain(re.search(r'<h1\b[^>]*>(.*?)</h1>', html, re.S)[1])
    return f'{title}: enunciado y materiales de la práctica de {subject}. Recursos de clase de Diego Ayala para DAM y DAW.'


def metadata(path, html):
    additions = []
    tags = Tags(html).tags
    if not any(tag == 'meta' and a.get('name') == 'description' for tag, a, _, _ in tags):
        additions.append(f'<meta name="description" content="{escape(description(path, html), quote=True)}">')
    url = canonical(path)
    links = [(start, end) for tag, a, start, end in tags if tag == 'link' and a.get('rel') == 'canonical']
    for start, end in reversed(links):
        html = html[:start] + html[end:]
    additions.append(f'<link rel="canonical" href="{escape(url, quote=True)}">')
    # Normalize internal links to the same homepage URL used in the sitemap.
    html = re.sub(r'href="((?:\.\./)*)index\.html"', lambda m: f'href="{m[1] or "./"}"', html)
    # Replacing at the same location makes repeated runs byte-for-byte stable.
    html = re.sub(r'\n\s*(?=</head>)', '', html, count=1)
    return html.replace('</head>', '\n' + '\n'.join(additions) + '\n</head>', 1)


def image_source(page, src):
    parsed = urlsplit(src)
    if parsed.scheme or parsed.netloc or not parsed.path:
        return None
    path = (ROOT / unquote(parsed.path).lstrip('/') if parsed.path.startswith('/')
            else page.parent / unquote(parsed.path)).resolve()
    if not path.is_relative_to(ROOT) or path.suffix.lower() not in ('.png', '.jpg', '.jpeg', '.gif'):
        return None
    if not path.is_file():
        raise ValueError(f'Image missing: {page.relative_to(ROOT)}: {src}')
    return path


def analytics(page, html):
    # Solo se llama para las páginas docentes públicas. La comprobación de host
    # del cargador evita enviar estadísticas desde localhost y las exportaciones.
    src = Path(os.path.relpath(ROOT / 'assets/analytics.js', page.parent)).as_posix()
    if not any(tag == 'script' and a.get('src') == src for tag, a, _, _ in Tags(html).tags):
        html = html.replace('</body>', f'<script src="{src}" defer></script>\n</body>', 1)
    for tag, a, start, end in reversed(Tags(html).tags):
        if tag != 'meta' or a.get('http-equiv', '').lower() != 'content-security-policy':
            continue
        directives = [part.strip().split() for part in a['content'].split(';') if part.strip()]
        for name, source in [('script-src', BEACON_SCRIPT), ('connect-src', BEACON_ENDPOINT)]:
            directive = next((part for part in directives if part[0] == name), None)
            if directive is None:
                directives.append([name, "'self'", source])
            elif source not in directive:
                directive.append(source)
        policy = '; '.join(' '.join(part) for part in directives)
        replacement = f'<meta http-equiv="Content-Security-Policy" content="{escape(policy, quote=True)}">'
        html = html[:start] + replacement + html[end:]
    return html


class Images:
    def __init__(self):
        self.cache = {}
        self.original_bytes = self.optimized_bytes = self.count = 0

    def variants(self, source):
        if source in self.cache:
            return self.cache[source]
        from PIL import Image, ImageOps
        original = source.read_bytes()
        key = hashlib.sha256(original + b'web-v1-quality90').hexdigest()[:16]
        with Image.open(source) as opened:
            image = ImageOps.exif_transpose(opened).convert('RGBA' if 'A' in opened.getbands() else 'RGB')
            width, height = image.size
            widths = sorted({min(width, 360), min(width, 720), min(width, 1440)})
            variants = []
            for size in widths:
                out = ROOT / 'assets' / 'optimized' / f'{key}-{size}.webp'
                if not out.exists():
                    resized = image if size == width else image.resize((size, round(height * size / width)), Image.Resampling.LANCZOS)
                    lossy, lossless = io.BytesIO(), io.BytesIO()
                    resized.save(lossy, 'WEBP', quality=90, method=6)
                    resized.save(lossless, 'WEBP', lossless=True, method=6)
                    data = lossless.getvalue() if lossless.tell() <= lossy.tell() * 1.2 else lossy.getvalue()
                    out.parent.mkdir(parents=True, exist_ok=True)
                    out.write_bytes(data)
                variants.append((size, out))
        self.original_bytes += len(original)
        self.optimized_bytes += variants[-1][1].stat().st_size
        self.cache[source] = width, height, variants
        return self.cache[source]

    def rewrite(self, page, html):
        changes = []
        number = 0
        for tag, a, start, end in Tags(html).tags:
            if tag != 'img':
                continue
            original = a.get('data-original-src', a.get('src', ''))
            source = image_source(page, original)
            if not source:
                continue
            def relative(path):
                return quote(Path(os.path.relpath(path, page.parent)).as_posix(), safe='/')
            if source.suffix.lower() == '.gif':
                # Conservar todos los fotogramas de las demostraciones animadas.
                from PIL import Image
                with Image.open(source) as animation:
                    width, height = animation.size
            else:
                width, height, variants = self.variants(source)
                a.update({'src': relative(variants[-1][1]),
                          'srcset': ', '.join(f'{relative(out)} {size}w' for size, out in variants),
                          'sizes': SIZES})
            a.update({'width': str(width), 'height': str(height),
                      'decoding': 'async', 'loading': 'eager' if number == 0 else 'lazy',
                      'data-original-src': original})
            if number == 0:
                a['fetchpriority'] = 'high'
            else:
                a.pop('fetchpriority', None)
            rendered = '<img ' + ' '.join(k if v is None else f'{k}="{escape(v, quote=True)}"' for k, v in a.items()) + '>'
            changes.append((start, end, rendered))
            number += 1
        self.count += number
        for start, end, replacement in reversed(changes):
            html = html[:start] + replacement + html[end:]
        return html


def check(pages):
    errors = []
    for page in pages:
        tags = Tags(page.read_text()).tags
        descriptions = [a.get('content', '') for tag, a, _, _ in tags if tag == 'meta' and a.get('name') == 'description']
        canonicals = [a.get('href') for tag, a, _, _ in tags if tag == 'link' and a.get('rel') == 'canonical']
        if len(descriptions) != 1 or not descriptions[0].strip():
            errors.append(f'{page}: missing or duplicated description')
        if canonicals != [canonical(page)]:
            errors.append(f'{page}: incorrect canonical')
        analytics_src = Path(os.path.relpath(ROOT / 'assets/analytics.js', page.parent)).as_posix()
        loaders = [a for tag, a, _, _ in tags if tag == 'script' and a.get('src') == analytics_src]
        if len(loaders) != 1 or 'defer' not in loaders[0]:
            errors.append(f'{page}: missing, duplicated or blocking analytics loader')
        for tag, a, _, _ in tags:
            if tag == 'meta' and a.get('http-equiv', '').lower() == 'content-security-policy':
                policy = dict((parts[0], parts[1:]) for text in a['content'].split(';') if (parts := text.split()))
                if BEACON_SCRIPT not in policy.get('script-src', []) or BEACON_ENDPOINT not in policy.get('connect-src', []):
                    errors.append(f'{page}: CSP does not allow Web Analytics')
        for tag, a, _, _ in tags:
            if tag == 'img':
                if not a.get('width') or not a.get('height'):
                    errors.append(f'{page}: missing image dimensions')
                for src in [a.get('src', '')] + [x.strip().split(' ')[0] for x in a.get('srcset', '').split(',') if x.strip()]:
                    parsed = urlsplit(src)
                    if not parsed.scheme and not parsed.netloc and not (page.parent / unquote(parsed.path)).is_file():
                        errors.append(f'{page}: missing image {src}')
                if a.get('fetchpriority') == 'high' and a.get('loading') == 'lazy':
                    errors.append(f'{page}: LCP image must not be lazy')
    tree = ET.parse(ROOT / 'sitemap.xml')
    urls = [node.text for node in tree.iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
    if sorted(urls) != sorted(canonical(page) for page in pages):
        errors.append('Sitemap differs from the public teaching pages')
    for section in ('profesor', 'soluciones', 'go'):
        html = (ROOT / section / 'index.html').read_text()
        if 'analytics.js' in html or 'cloudflareinsights.com' in html:
            errors.append(f'{section}: analytics must stay on public teaching pages')
        if not any(tag == 'meta' and a.get('name') == 'robots' and 'noindex' in a.get('content', '') for tag, a, _, _ in Tags(html).tags):
            errors.append(f'{section}: missing noindex')
    if errors:
        raise SystemExit('\n'.join(errors))
    print(f'OK: {len(pages)} public pages; metadata, images, sitemap, analytics and private noindex checked.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    pages = public_pages()
    if args.check:
        return check(pages)
    images = Images()
    changed = 0
    for page in pages:
        before = page.read_text()
        after = analytics(page, images.rewrite(page, metadata(page, before)))
        if after != before:
            page.write_text(after)
            changed += 1
    urls = '\n'.join(f'  <url><loc>{escape(canonical(page))}</loc></url>' for page in pages)
    (ROOT / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + '\n</urlset>\n')
    print(json.dumps({'pages_changed': changed, 'public_pages': len(pages), 'images': images.count,
                      'unique_sources': len(images.cache), 'original_bytes': images.original_bytes,
                      'webp_bytes_at_largest_size': images.optimized_bytes}, indent=2))
    check(pages)


if __name__ == '__main__':
    main()
