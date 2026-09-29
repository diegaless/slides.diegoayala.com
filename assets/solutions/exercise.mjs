import {visibility} from './domain.mjs';

const section=document.querySelector('.task-solutions[data-solution-id]');
if(section) {
  const status=document.createElement('p');
  status.className='solution-availability';
  status.setAttribute('role','status');
  section.append(status);
  const session=document.createElement('div');
  session.className='solution-session'; session.hidden=true;
  session.innerHTML='<a href="/profesor/">Panel de profesor</a><button type="button">Cerrar sesión</button>';
  section.append(session);
  const logout=session.querySelector('button');
  const links=[...section.querySelectorAll('a[data-solution-kind]')];
  let timeout, busy=false, preview, revision=0;
  const urls=new Set();

  function setTeacher(teacher) {
    const code=links.find(link=>link.dataset.solutionKind==='codigo');
    if(code)code.querySelector('span').textContent=teacher?'Código en GitHub':'Código ZIP';
  }

  function setBusy(value) {
    busy=value; logout.disabled=value;
    links.forEach(link=>value?link.setAttribute('aria-disabled','true'):link.removeAttribute('aria-disabled'));
    if(value)section.setAttribute('aria-busy','true');
    else section.removeAttribute('aria-busy');
  }

  logout.addEventListener('click',async()=>{
    if(busy)return;
    revision++; clearTimeout(timeout); setBusy(true);
    status.textContent='Cerrando sesión…';
    try {
      const client=await import('./client.mjs');
      await client.logout();
      if(preview?.open)preview.close();
      urls.forEach(release);
      session.hidden=true; setTeacher(false);
      status.textContent='Sesión de profesor cerrada.';
    } catch {
      status.textContent='No se ha podido cerrar la sesión. Vuelve a intentarlo.';
    } finally {setBusy(false);}
  });

  function release(url) {
    URL.revokeObjectURL(url);
    urls.delete(url);
  }

  function showPDF(file,url) {
    if(!preview) {
      preview=document.createElement('dialog');
      preview.className='solution-preview';
      preview.setAttribute('aria-label','Solución PDF');
      preview.innerHTML='<div class="solution-preview-tools"><strong>Solución PDF</strong>'+
        '<a>Descargar PDF</a><button type="button" autofocus>Cerrar visor</button></div>'+
        '<iframe title="PDF con la solución del ejercicio"></iframe>';
      preview.querySelector('button').addEventListener('click',()=>preview.close());
      preview.addEventListener('close',()=>{
        const frame=preview.querySelector('iframe');
        const link=preview.querySelector('a');
        const old=link.getAttribute('href');
        frame.removeAttribute('src'); link.removeAttribute('href');
        if(old)release(old);
        refresh();
      });
      document.body.append(preview);
    }
    preview.querySelector('iframe').src=url+'#view=FitH';
    const link=preview.querySelector('a');
    link.href=url; link.download=file.name;
    preview.showModal();
  }

  async function openSolution(event) {
    // Conservar los gestos del navegador y un enlace útil incluso sin JavaScript.
    if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    event.preventDefault();
    if(busy)return;
    revision++; setBusy(true);
    const link=event.currentTarget;
    const kind=link.dataset.solutionKind;
    status.textContent=kind==='pdf'?'Abriendo el PDF…':'Abriendo el código…';
    try {
      const client=await import('./client.mjs');
      const user=await client.currentUser();
      if(client.isTeacher(user)) {
        window.location.assign(link.href);
        return;
      }
      // Las reglas deciden el acceso con la sesión y la hora del servidor.
      // No basta con el estado que se mostró al cargar el enunciado.
      const file=await client.getFile(section.dataset.solutionId,kind);
      const url=URL.createObjectURL(file.blob); urls.add(url);
      if(kind==='pdf') {
        showPDF(file,url);
        status.textContent='PDF abierto en el visor.';
      } else {
        const download=document.createElement('a');
        download.href=url; download.download=file.name;
        document.body.append(download); download.click(); download.remove();
        setTimeout(()=>release(url),60_000);
        status.textContent='ZIP preparado para descargar.';
      }
    } catch {
      // Los originales mantienen sus propios permisos. También sirven de
      // alternativa si la copia no puede cargarse por un fallo de conexión.
      status.textContent=kind==='pdf'?'Abriendo el original en Drive…':'Abriendo el código en GitHub…';
      window.location.assign(link.href);
    } finally {setBusy(false);}
  }
  links.forEach(link=>link.addEventListener('click',openSolution));

  async function refresh() {
    clearTimeout(timeout);
    if(busy)return;
    const check=++revision;
    try {
      const {backend,getState,currentUser,isTeacher}=await import('./client.mjs');
      const {auth}=backend();
      await auth.authStateReady();
      if(check!==revision)return;
      // Cerrar sesión sigue disponible aunque falle la consulta del estado.
      session.hidden=!auth.currentUser;
      const user=await currentUser();
      if(check!==revision)return;
      const teacher=isTeacher(user);
      setTeacher(teacher);
      if(teacher) {
        status.textContent='Acceso de profesor: PDF en Drive y código en GitHub.';
        return;
      }
      const state=await getState(section.dataset.solutionId);
      if(check!==revision)return;
      status.textContent=visibility(state)==='public'?'Abre el PDF o descarga el ZIP.':
        'Soluciones privadas. Los enlaces abren Drive o GitHub, donde necesitas permiso.';
      if(state?.mode==='scheduled')timeout=setTimeout(refresh,60_000);
    } catch {
      if(check===revision)status.textContent='Si la solución no está disponible, el enlace abrirá su original.';
    }
  }
  refresh();
  window.addEventListener('focus',refresh);
  window.addEventListener('pagehide',()=>{
    clearTimeout(timeout);
    if(preview?.open)preview.close();
    urls.forEach(release);
  });
  window.addEventListener('pageshow',event=>{if(event.persisted)refresh();});
}
