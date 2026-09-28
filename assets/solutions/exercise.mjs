import {visibility} from './domain.mjs';
const section=document.querySelector('.task-solutions[data-solution-id]');
if(section) {
  const status=document.createElement('p');
  status.className='solution-availability'; status.setAttribute('aria-live','polite');
  status.style.cssText='font-size:.75rem;color:var(--muted);margin:12px 0 0;line-height:1.5';
  section.append(status);
  let timeout;
  async function refresh() {
    clearTimeout(timeout);
    try {
      const {getState,currentUser,isTeacher}=await import('./client.mjs');
      const [state,user]=await Promise.all([getState(section.dataset.solutionId),currentUser()]);
      status.textContent=visibility(state)==='public'?'Disponibles para descargar.':
        isTeacher(user)?'Puedes verlas como profesor. Aún no están disponibles para el alumnado.':
        'El profesor aún no ha abierto estas soluciones.';
      if(state?.mode==='scheduled')timeout=setTimeout(refresh,60_000);
    } catch {
      status.textContent='Abre la solución para comprobar su disponibilidad.';
    }
  }
  await refresh();
  window.addEventListener('focus',refresh);
  window.addEventListener('pagehide',()=>clearTimeout(timeout));
}
