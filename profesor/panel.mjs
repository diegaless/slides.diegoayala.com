import {visibility, visibleTasks, timestampMillis} from '../assets/solutions/domain.mjs';

const $ = id => document.getElementById(id);
let client, catalog = [], states = new Map(), pending = new Set();
const dateFormat = new Intl.DateTimeFormat('es-ES', {dateStyle:'medium',timeStyle:'short'});
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text != null) element.textContent = text;
  if (className) element.className = className;
  return element;
}
function error(error) {
  $('error').textContent = client?.friendlyError(error) || 'No se ha podido preparar el acceso. Recarga la página.';
  $('error').hidden = false;
  $('status').textContent = '';
}
function message(text) { $('error').hidden = true; $('status').textContent = text; }
function stateLabel(state) {
  if (visibility(state) === 'public') return 'Pública';
  if (state?.mode === 'scheduled') return `Programada · ${dateFormat.format(new Date(timestampMillis(state.publishAt)))}`;
  return 'Privada';
}
async function change(task, mode, date) {
  if (pending.has(task.id)) return;
  pending.add(task.id);
  const row = document.querySelector(`[data-task-id="${task.id}"]`);
  row.setAttribute('aria-busy','true');
  row.querySelectorAll('button,input').forEach(element => {element.disabled = true;});
  message('Guardando el acceso…');
  try {
    const result = await client.setState(task.id, mode, date);
    states.set(task.id, result);
    message(`${task.title}: ${stateLabel(result).toLowerCase()}.`);
  } catch (problem) { error(problem); }
  finally {
    pending.delete(task.id);
    render();
    document.querySelector(`[data-task-id="${task.id}"] .publish-switch`)?.focus();
  }
}
function render() {
  const tasks = visibleTasks(catalog, $('subject-filter').value, $('search-filter').value);
  $('task-list').replaceChildren();
  $('no-results').hidden = tasks.length !== 0;
  let publics=0, scheduled=0;
  for (const task of tasks) {
    const state = states.get(task.id);
    const mode = visibility(state);
    if (mode === 'public') publics++;
    if (mode === 'scheduled') scheduled++;
    const row = node('article',null,'solution-row'); row.dataset.taskId=task.id;
    const main = node('div',null,'row-main');
    const info = node('div');
    const heading = node('h3',null,'task-title');
    const link = node('a',task.title); link.href=task.exercise;
    heading.append(link); info.append(heading);
    const meta = node('div',null,'task-meta');
    const badge = node('span',state ? stateLabel(state) : 'Pendiente de preparar','visibility-label'); badge.dataset.mode=mode;
    meta.append(badge);
    const preview = node('a','Ver solución','preview-link');
    preview.href=`../soluciones/?tarea=${encodeURIComponent(task.id)}&archivo=pdf`;
    meta.append(preview);
    for (const [label,url] of [['PDF original',task.pdf],['Código original',task.github]]) {
      const reference = node('a',label,'reference-link'); reference.href=url; reference.target='_blank'; reference.rel='noopener'; meta.append(reference);
    }
    info.append(meta); main.append(info);
    const actions = node('div',null,'row-actions');
    const schedule = node('button','Programar','text-button'); schedule.type='button';
    schedule.setAttribute('aria-expanded','false'); schedule.setAttribute('aria-controls',`schedule-${task.id}`);
    const toggle = node('button',null,'publish-switch'); toggle.type='button'; toggle.setAttribute('role','switch');
    toggle.setAttribute('aria-checked',String(mode === 'public'));
    toggle.setAttribute('aria-label',`${mode === 'public' ? 'Cerrar acceso a' : 'Publicar'} ${task.title}`);
    const track = node('span',null,'switch-track'); track.setAttribute('aria-hidden','true');
    toggle.append(track,node('span',mode === 'public' ? 'Pública' : 'Publicar'));
    toggle.addEventListener('click',()=>change(task,visibility(states.get(task.id)) === 'public' ? 'private' : 'public'));
    actions.append(schedule,toggle); main.append(actions); row.append(main);
    const form = node('form',null,'schedule-form'); form.id=`schedule-${task.id}`; form.hidden=true;
    const fields = node('div',null,'schedule-fields');
    const label = node('label','Abrir las soluciones el');
    const input = node('input'); input.type='datetime-local'; input.required=true; input.name='publishAt';
    if (state?.mode === 'scheduled' && timestampMillis(state.publishAt)) {
      const date = new Date(timestampMillis(state.publishAt));
      input.value = new Date(date.getTime()-date.getTimezoneOffset()*60_000).toISOString().slice(0,16);
    }
    label.append(input); fields.append(label);
    const submit = node('button','Guardar fecha','primary-button'); submit.type='submit';
    const cancel = node('button','Cancelar programación','text-button'); cancel.type='button';
    cancel.hidden=state?.mode !== 'scheduled'; cancel.addEventListener('click',()=>change(task,'private'));
    fields.append(submit,cancel); form.append(fields);
    form.append(node('p',`Permanecerá privada hasta esa fecha. Hora del dispositivo: ${timezone}.`,'muted'));
    form.addEventListener('submit',event=>{event.preventDefault(); change(task,'scheduled',input.value);});
    schedule.addEventListener('click',()=>{
      form.hidden=!form.hidden; schedule.setAttribute('aria-expanded',String(!form.hidden));
      if (!form.hidden) input.focus();
    });
    row.append(form);
    if (!state || pending.has(task.id)) row.querySelectorAll('button,input').forEach(element=>{element.disabled=true;});
    $('task-list').append(row);
  }
  $('counts').textContent=`${tasks.length} tareas · ${publics} públicas · ${scheduled} programadas`;
}
async function showDashboard(user) {
  $('account-name').textContent=user.email;
  message('Cargando tus tareas…');
  const response = await fetch('../assets/solutions/catalog.json');
  if (!response.ok) throw new Error('No se ha podido cargar la lista de tareas.');
  catalog = await response.json();
  states = await client.getAllStates();
  $('login-screen').hidden=true; $('dashboard').hidden=false;
  render(); message('Puedes ver todas las soluciones sin publicarlas. Los cambios de acceso se guardan automáticamente.');
}
$('google-login').addEventListener('click',async()=>{
  $('google-login').disabled=true;
  message('Abriendo el acceso de Google…');
  try { await showDashboard(await client.login()); } catch (problem) { error(problem); }
  finally { $('google-login').disabled=false; }
});
$('logout').addEventListener('click',async()=>{
  try {
    await client.logout(); states.clear(); $('task-list').replaceChildren();
    $('dashboard').hidden=true; $('login-screen').hidden=false; message('Sesión cerrada.');
  } catch(problem) {error(problem);}
});
$('subject-filter').addEventListener('change',render);
$('search-filter').addEventListener('input',render);
window.addEventListener('pageshow', async event=>{
  if (event.persisted && client && !client.isTeacher(await client.currentUser())) location.reload();
});
try {
  client = await import('../assets/solutions/client.mjs');
  const user = await client.currentUser();
  $('google-login').disabled=false;
  if (client.isTeacher(user)) await showDashboard(user);
  else message('');
} catch(problem) {error(problem);}
