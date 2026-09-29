import {visibility} from './domain.mjs';

const section=document.querySelector('.task-solutions[data-solution-id]');
if(section) {
  const status=document.createElement('p');
  status.className='solution-availability';
  status.setAttribute('role','status');
  section.append(status);
  const links=[...section.querySelectorAll('a[data-solution-kind]')];
  let timeout, busy=false, preview;
  const urls=new Set();

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
    busy=true;
    const link=event.currentTarget;
    const kind=link.dataset.solutionKind;
    links.forEach(item=>item.setAttribute('aria-disabled','true'));
    section.setAttribute('aria-busy','true');
    status.textContent=kind==='pdf'?'Abriendo el PDF…':'Preparando el ZIP…';
    try {
      const client=await import('./client.mjs');
      await client.currentUser();
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
    } finally {
      busy=false;
      links.forEach(item=>item.removeAttribute('aria-disabled'));
      section.removeAttribute('aria-busy');
    }
  }
  links.forEach(link=>link.addEventListener('click',openSolution));

  async function refresh() {
    clearTimeout(timeout);
    if(busy)return;
    try {
      const {getState,currentUser,isTeacher}=await import('./client.mjs');
      const [state,user]=await Promise.all([getState(section.dataset.solutionId),currentUser()]);
      if(!busy)status.textContent=visibility(state)==='public'?'Abre el PDF o descarga el ZIP.':
        isTeacher(user)?'Acceso de profesor. Estas soluciones siguen privadas para el alumnado.':
        'Soluciones privadas. Los enlaces abren Drive o GitHub, donde necesitas permiso.';
      if(state?.mode==='scheduled')timeout=setTimeout(refresh,60_000);
    } catch {
      if(!busy)status.textContent='Si la solución no está disponible, el enlace abrirá su original.';
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
