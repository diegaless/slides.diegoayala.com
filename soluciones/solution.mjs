import {validId, visibility} from '../assets/solutions/domain.mjs';
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const id=params.get('tarea');
let client, busy=false, checking=false;
const urls=new Set();
function showError(error) {
  $('error').textContent=client?.friendlyError(error)||error.message;
  $('error').hidden=false; $('status').textContent='';
}
function cleanup() {
  $('preview').hidden=true; $('preview').removeAttribute('src');
  $('save-pdf').hidden=true; $('save-pdf').removeAttribute('href');
  urls.forEach(url=>URL.revokeObjectURL(url)); urls.clear();
}
async function load(kind) {
  if(busy)return;
  busy=true; $('pdf').disabled=true; $('code').disabled=true; $('logout').disabled=true; $('error').hidden=true;
  $('status').textContent=kind==='pdf'?'Preparando el PDF…':'Preparando el código…';
  try {
    if(client.isTeacher(await client.currentUser())) {
      location.assign($(kind==='pdf'?'original-pdf':'original-code').href);
      return;
    }
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
      cleanup(); $('actions').hidden=true; $('closed').hidden=false; $('teacher-session').hidden=true;
    }
    showError(error);
  } finally {busy=false; $('pdf').disabled=false; $('code').disabled=false; $('logout').disabled=false;}
}
async function refreshAccess(autoOpen=false) {
  if(checking)return;
  checking=true;
  let allowed=false;
  try {
    const [user,state]=await Promise.all([client.currentUser(),client.getState(id)]);
    const teacher=client.isTeacher(user);
    const mode=visibility(state);
    allowed=mode==='public'||teacher;
    $('pdf').textContent=teacher?'Ver PDF en Drive':'Ver PDF';
    $('code').textContent=teacher?'Ver código en GitHub':'Descargar código ZIP';
    $('teacher-session').hidden=!teacher;
    $('teacher-note').textContent=mode==='public'?'Has accedido como profesor.':
      mode==='scheduled'?'Vista de profesor: esta solución sigue programada para el alumnado.':
      'Vista de profesor: esta solución sigue privada para el alumnado.';
    $('closed').hidden=allowed;
    $('actions').hidden=!allowed;
    if(!allowed) {
      cleanup();
      $('status').textContent=mode==='scheduled'?'La solución se abrirá en la fecha programada.':'Solución privada.';
    } else if($('preview').hidden) {
      $('status').textContent='Elige el PDF o el código de la solución.';
    }
  } finally {checking=false;}
  const kind=params.get('archivo');
  if(allowed&&autoOpen&&['pdf','codigo'].includes(kind))await load(kind);
}
$('pdf').addEventListener('click',()=>load('pdf'));
$('code').addEventListener('click',()=>load('codigo'));
$('teacher-login').addEventListener('click',async()=>{
  if(busy||checking)return;
  $('teacher-login').disabled=true; $('error').hidden=true;
  $('status').textContent='Abriendo el acceso de Google…';
  try {await client.login(); await refreshAccess(true);}
  catch(error) {showError(error);}
  finally {$('teacher-login').disabled=false;}
});
$('logout').addEventListener('click',async()=>{
  if(busy||checking)return;
  $('logout').disabled=true; $('error').hidden=true;
  try {
    await client.logout(); cleanup(); $('teacher-session').hidden=true;
    await refreshAccess();
  } catch(error) {showError(error);}
  finally {$('logout').disabled=false;}
});
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
  $('original-pdf').href=task.pdf; $('original-code').href=task.github;
  document.title=`${task.title} · Solución | Diego Ayala`;
  client=await import('../assets/solutions/client.mjs');
  await refreshAccess(true);
} catch(error) {
  showError(error);
}
