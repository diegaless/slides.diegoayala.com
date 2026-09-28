"""Prepara copias privadas de PDF/código y un catálogo público sin soluciones.

Lee solamente archivos versionados de los repositorios de soluciones. Nunca
escribe esos bytes en carpetas públicas ni cambia permisos de Drive/GitHub.
"""
from pathlib import Path
from urllib.parse import unquote, urlsplit, quote
import hashlib, html, io, json, re, subprocess, zipfile

ROOT=Path(__file__).resolve().parents[1]
PROJECTS=ROOT.parent
OUTPUT=ROOT/'.private/solution-assets'
OUTPUT.mkdir(parents=True,exist_ok=True)
overrides=json.loads((ROOT/'scripts/exercise-content/overrides.json').read_text())
catalog=[]; uploads=[]
order={'di':0,'lm':1,'dapw':2,'pi':3}

def git(repo,*args):
    return subprocess.check_output(['git','-C',str(repo),*args])

for key,entry in overrides.items():
    if not entry.get('solutions'):continue
    subject,title=key.split('/',1)
    parts=urlsplit(entry['solutions']['github']).path.strip('/').split('/')
    assert parts[0]=='diegaless' and parts[2:4]==['tree','main'],key
    repo=PROJECTS/parts[1]
    folder=unquote('/'.join(parts[4:]))
    assert folder and '..' not in Path(folder).parts and not Path(folder).is_absolute()
    sid=subject+'-'+re.sub('[^a-z0-9]+','-',folder.lower()).strip('-')
    names=git(repo,'ls-tree','-r','--name-only','HEAD','--',folder).decode().splitlines()
    assert names,key
    pdf=f'{folder}/SOLUCION.pdf'
    assert pdf in names,(key,'falta SOLUCION.pdf')
    body=git(repo,'show',f'HEAD:{pdf}')
    assert body.startswith(b'%PDF-')
    (OUTPUT/f'{sid}.pdf').write_bytes(body)
    buffer=io.BytesIO()
    with zipfile.ZipFile(buffer,'w',zipfile.ZIP_DEFLATED) as archive:
        for name in names:
            relative=Path(name).relative_to(folder)
            if relative.name=='SOLUCION.pdf':continue
            assert not any(p in {'.git','.venv','node_modules','__pycache__'} for p in relative.parts),name
            assert relative.name not in {'.env','credentials.json','token.json'},name
            assert relative.suffix.lower() not in {'.pfx','.p12','.key','.pem','.exe'},name
            payload=git(repo,'show',f'HEAD:{name}')
            # Mismos bytes generan el mismo ZIP y no consumen otra subida.
            info=zipfile.ZipInfo(Path(folder,relative).as_posix(),date_time=(2020,1,1,0,0,0))
            info.compress_type=zipfile.ZIP_DEFLATED
            info.external_attr=0o644 << 16
            archive.writestr(info,payload)
    zipped=buffer.getvalue(); (OUTPUT/f'{sid}.zip').write_bytes(zipped)
    for kind,content,ext in [('pdf',body,'pdf'),('codigo',zipped,'zip')]:
        assert len(content)<50_000_000,(key,'archivo demasiado grande')
        uploads.append({'id':sid,'kind':kind,'path':f'{sid}.{ext}','size':len(content),'sha256':hashlib.sha256(content).hexdigest()})
    path=ROOT/'ejercicios'/key/'TAREA.html'
    if path.exists():
        heading=re.search(r'<h1[^>]*>(.*?)</h1>',path.read_text(),re.S)
        if heading:title=html.unescape(re.sub('<[^>]+>','',heading[1])).strip()
    catalog.append({'id':sid,'subject':subject,'title':title,'exercise':'/ejercicios/'+quote(key,safe='/')+'/TAREA.html',**entry['solutions']})
catalog.sort(key=lambda item:(order.get(item['subject'],9),item['id']))
assert len({item['id'] for item in catalog})==len(catalog)
(ROOT/'assets/solutions/catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(OUTPUT/'manifest.json').write_text(json.dumps(uploads,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'tareas':len(catalog),'archivos':len(uploads),'bytes':sum(x['size'] for x in uploads),'mayor_archivo':max(x['size'] for x in uploads)}))
