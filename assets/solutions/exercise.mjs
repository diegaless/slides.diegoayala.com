import {visibility,timestampMillis} from './domain.mjs';

const section=document.querySelector('.task-solutions[data-solution-id]');
if(section) {
  const heading=document.createElement('div');
  heading.className='solution-heading';
  const title=section.querySelector('h2');
  title.before(heading); heading.append(title);
  const publish=document.createElement('button');
  publish.type='button'; publish.className='solution-publish'; publish.hidden=true;
  publish.setAttribute('role','switch');
  publish.setAttribute('aria-label','Publicar las soluciones de esta tarea');
  publish.setAttribute('aria-checked','false');
  publish.innerHTML='<span class="solution-publish-track" aria-hidden="true"><span class="solution-publish-thumb">'+
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+
    '<rect x="5" y="10" width="14" height="11" rx="2"/><path class="lock-closed" d="M8 10V6a4 4 0 0 1 8 0v4"/>'+
    '<path class="lock-open" d="M8 10V6a4 4 0 0 1 7.5-2"/><path d="M12 14v3"/></svg></span></span>'+
    '<span class="solution-publish-label" aria-hidden="true">Privada</span>';
  heading.append(publish);
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
  let timeout, busy=false, preview, revision=0, teacherAccess=false, publicationState=null, stateReady=false;
  const urls=new Set();

  function setTeacher(teacher) {
    teacherAccess=teacher;
    publish.hidden=!teacher;
    if(!teacher) {publicationState=null; stateReady=false;}
    renderPublication();
    const code=links.find(link=>link.dataset.solutionKind==='codigo');
    if(code)code.querySelector('span').textContent=teacher?'Código en GitHub':'Código ZIP';
  }

  function setBusy(value) {
    busy=value; logout.disabled=value;
    publish.disabled=value||!stateReady;
    links.forEach(link=>value?link.setAttribute('aria-disabled','true'):link.removeAttribute('aria-disabled'));
    if(value)section.setAttribute('aria-busy','true');
    else section.removeAttribute('aria-busy');
  }

  function renderPublication() {
    const mode=visibility(publicationState);
    publish.setAttribute('aria-checked',String(mode==='public'));
    publish.disabled=busy||!stateReady;
    publish.querySelector('.solution-publish-label').textContent=!stateReady?'Sin estado':
      mode==='public'?'Pública':mode==='scheduled'?'Programada':'Privada';
    let description=mode==='public'?'Hacer privadas las soluciones de esta tarea':'Publicar el PDF y el código de esta tarea';
    const date=timestampMillis(publicationState?.publishAt);
    if(mode==='scheduled'&&Number.isFinite(date)) {
      description=`Programada para ${new Date(date).toLocaleString('es-ES')}. Pulsa para publicar ahora.`;
    }
    publish.title=stateReady?description:'No se ha podido consultar el estado. Recarga la página para volver a intentarlo.';
  }

  function scheduleRefresh() {
    clearTimeout(timeout);
    if(visibility(publicationState)==='scheduled')timeout=setTimeout(refresh,60_000);
  }

  publish.addEventListener('click',async()=>{
    if(busy||!teacherAccess||!stateReady)return;
    const mode=visibility(publicationState)==='public'?'private':'public';
    revision++; clearTimeout(timeout); setBusy(true);
    status.textContent='Guardando el acceso a las soluciones…';
    try {
      const client=await import('./client.mjs');
      setTeacher(client.isTeacher(await client.currentUser()));
      if(!teacherAccess)throw new Error('teacher-access');
      publicationState=await client.setState(section.dataset.solutionId,mode);
      stateReady=Boolean(publicationState);
      status.textContent=visibility(publicationState)==='public'?
        'Soluciones públicas: el alumnado ya puede abrir el PDF y descargar el código.':
        'Soluciones privadas: el acceso del alumnado está cerrado.';
    } catch {
      // Una respuesta perdida no significa que la escritura haya fallado.
      // Consultar de nuevo antes de mostrar el estado definitivo.
      stateReady=false;
      if(teacherAccess) {
        try {
          const client=await import('./client.mjs');
          publicationState=await client.getState(section.dataset.solutionId);
          stateReady=Boolean(publicationState);
        } catch { /* Se mantiene desactivado hasta poder consultar el estado. */ }
      }
      status.textContent=!teacherAccess?'Tu sesión ya no tiene acceso de profesor.':stateReady?
        'No se ha podido completar el cambio. Se muestra el estado actual; vuelve a intentarlo.':
        'No se ha podido confirmar el cambio. Recarga la página para comprobar el estado.';
    } finally {
      renderPublication(); setBusy(false); scheduleRefresh();
    }
  });

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
    stateReady=false; publish.disabled=true;
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
      const state=await getState(section.dataset.solutionId);
      if(check!==revision)return;
      publicationState=state; stateReady=Boolean(state); renderPublication();
      status.textContent=teacher?'Acceso de profesor: PDF en Drive y código en GitHub.':
        visibility(state)==='public'?'Abre el PDF o descarga el ZIP.':
        'Soluciones privadas. Los enlaces abren Drive o GitHub, donde necesitas permiso.';
      scheduleRefresh();
    } catch {
      if(check===revision) {
        renderPublication();
        status.textContent='No se ha podido consultar el estado. Los enlaces siguen abriendo Drive o GitHub.';
      }
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
