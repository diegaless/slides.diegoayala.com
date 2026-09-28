import {validId, visibility} from '../assets/solutions/domain.mjs';
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const id=params.get('tarea');
let client, busy=false;
const urls=new Set();
function cleanup() {
  $('preview').hidden=true; $('preview').removeAttribute('src');
  $('save-pdf').hidden=true; $('save-pdf').removeAttribute('href');
  urls.forEach(url=>URL.revokeObjectURL(url)); urls.clear();
}
async function load(kind) {
  if(busy)return;
  busy=true; $('pdf').disabled=true; $('code').disabled=true; $('error').hidden=true;
  $('status').textContent=kind==='pdf'?'Preparando el PDF…':'Preparando el código…';
  try {
    const file=await client.getFile(id,kind);
    const url=URL.createObjectURL(file.blob); urls.add(url);
    if(kind==='pdf') {
      $('preview').src=url; $('preview').hidden=false;
      $('save-pdf').href=url; $('save-pdf').download=file.name; $('save-pdf').hidden=false;
      $('status').textContent='Puedes leer la solución aquí o guardar el PDF.';
    } else {
      const link=document.createElement('a'); link.href=url; link.download=file.name;
      document.body.append(link); link.click(); link.remove();
      $('status').textContent='Descarga preparada. Extrae el ZIP y sigue las instrucciones del README.';
      setTimeout(()=>{URL.revokeObjectURL(url);urls.delete(url);},60_000);
    }
  } catch(error) {
    if(error.code?.includes('permission-denied')) {
      cleanup(); $('actions').hidden=true; $('closed').hidden=false;
    }
    $('error').textContent=client.friendlyError(error); $('error').hidden=false; $('status').textContent='';
  } finally {busy=false; $('pdf').disabled=false; $('code').disabled=false;}
}
$('pdf').addEventListener('click',()=>load('pdf'));
$('code').addEventListener('click',()=>load('codigo'));
window.addEventListener('pagehide',cleanup);
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
try {
  if(!validId(id))throw new Error('El enlace no corresponde a una tarea.');
  const response=await fetch('../assets/solutions/catalog.json');
  if(!response.ok)throw new Error('No se ha podido cargar la tarea. Recarga la página.');
  const catalog=await response.json();
  const task=catalog.find(item=>item.id===id);
  if(!task)throw new Error('No se ha encontrado esta tarea.');
  $('task-title').textContent=task.title; $('back').href=task.exercise;
  document.title=`${task.title} · Solución | Diego Ayala`;
  client=await import('../assets/solutions/client.mjs');
  const user=await client.currentUser();
  const state=await client.getState(id);
  if(visibility(state)!=='public'&&!client.isTeacher(user)) {
    $('status').textContent=state?.mode==='scheduled'?'La solución se abrirá en la fecha programada.':'Solución privada.';
    $('closed').hidden=false;
  } else {
    $('actions').hidden=false; $('status').textContent='Elige el PDF o el código de la solución.';
    const kind=params.get('archivo');
    if(['pdf','codigo'].includes(kind))await load(kind);
  }
} catch(error) {
  $('error').textContent=client?.friendlyError(error)||error.message; $('error').hidden=false; $('status').textContent='';
}
