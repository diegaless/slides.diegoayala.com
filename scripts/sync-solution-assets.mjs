import {readFile} from 'node:fs/promises';
import {resolve,basename} from 'node:path';
import {createHash} from 'node:crypto';
import {assertNoBilling,project,getDocument,commit,write} from './solutions-admin.mjs';
import {validId} from '../assets/solutions/domain.mjs';

const root=resolve(import.meta.dirname,'../.private/solution-assets');
const files=JSON.parse(await readFile(resolve(root,'manifest.json'),'utf8'));
const catalog=JSON.parse(await readFile(new URL('../assets/solutions/catalog.json',import.meta.url),'utf8'));
const ids=new Set(catalog.map(task=>task.id));
await assertNoBilling();
console.log(`${project}: facturación desactivada. Sincronizando copias protegidas.`);
for(const file of files) {
  if(!validId(file.id)||!ids.has(file.id)||!['pdf','codigo'].includes(file.kind)||basename(file.path)!==file.path)throw new Error('Manifiesto local inválido.');
  const bytes=await readFile(resolve(root,file.path));
  if(bytes.length!==file.size||createHash('sha256').update(bytes).digest('hex')!==file.sha256)throw new Error(`Archivo cambiado: ${file.path}`);
  const path=`solutionFiles/${file.id}-${file.kind}`;
  const existing=await getDocument(path);
  if(existing?.fields?.sha256?.stringValue===file.sha256)continue;
  const chunkSize=512*1024, parts=Math.ceil(bytes.length/chunkSize);
  // Las versiones son inmutables. Primero todas las partes, después el manifiesto.
  // No se borran partes antiguas: una descarga en curso puede terminar su versión.
  for(let start=0;start<parts;start+=4) {
    const batch=[];
    for(let index=start;index<Math.min(parts,start+4);index++) {
      batch.push(write(`${path}/parts/${file.sha256}-${index}`,{bytes:bytes.subarray(index*chunkSize,(index+1)*chunkSize)}));
    }
    await commit(batch);
  }
  await commit([write(path,{taskId:file.id,parts,size:bytes.length,sha256:file.sha256})]);
  console.log(`Preparado: ${file.id} / ${file.kind}`);
}
for(const id of ids) {
  const artifacts=files.filter(file=>file.id===id);
  if(artifacts.length!==2||new Set(artifacts.map(file=>file.kind)).size!==2)throw new Error(`Faltan archivos: ${id}`);
  if(!(await getDocument(`solutionStates/${id}`))) {
    await commit([write(`solutionStates/${id}`,{mode:'private',publishAt:null,updatedAt:new Date()},{currentDocument:{exists:false}})]);
  }
}
console.log(`Sincronización completa: ${ids.size} tareas. Se conservan los estados anteriores.`);
