export const SUBJECTS = {
  di: 'Desarrollo de Interfaces',
  lm: 'Lenguaje de Marcas',
  dapw: 'Despliegue de aplicaciones Web',
  pi: 'Proyecto Intermodular',
  rmskills: 'RM Skills',
};

export function timestampMillis(value) {
  if (value == null) return null;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  return Number.NaN;
}

export function visibility(state, now = Date.now()) {
  if (state?.mode === 'public') return 'public';
  if (state?.mode === 'scheduled') {
    const date = timestampMillis(state.publishAt);
    return Number.isFinite(date) && date <= now ? 'public' : 'scheduled';
  }
  return 'private';
}

export function publicationChange(mode, date, now = Date.now()) {
  if (!['private', 'public', 'scheduled'].includes(mode)) throw new Error('Estado no válido.');
  if (mode !== 'scheduled') return {mode, publishAt: null};
  const time = new Date(date).getTime();
  if (!Number.isFinite(time) || time <= now + 30_000) {
    throw new Error('Elige una fecha y hora futura, al menos un minuto después de ahora.');
  }
  if (time > now + 366 * 86_400_000) throw new Error('Programa la publicación dentro del próximo año.');
  return {mode, publishAt: new Date(time)};
}

export function validId(id) {
  return typeof id === 'string' && /^[a-z]+-[a-z0-9-]{1,100}$/.test(id);
}

export function downloadName(id, kind) {
  if (!validId(id) || !['pdf', 'codigo'].includes(kind)) throw new Error('Archivo no válido.');
  return `${id}-solucion.${kind === 'pdf' ? 'pdf' : 'zip'}`;
}

export function visibleTasks(catalog, subject, search) {
  const normalize = text => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const query = normalize(search.trim());
  return catalog.filter(task => (!subject || task.subject === subject) &&
    normalize(task.title).includes(query));
}
