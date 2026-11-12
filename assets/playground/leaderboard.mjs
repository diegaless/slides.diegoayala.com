export const LEADERBOARD_LIMIT = 10;
export const MAX_SCORE = Number.MAX_SAFE_INTEGER;
export const MAX_NAME_LENGTH = 24;

export function normalizePlayerName(name) {
  return typeof name === 'string' ? name.normalize('NFC').trim().replace(/\s+/gu, ' ') : '';
}

export function validateScore(name, score) {
  const normalized = normalizePlayerName(name);
  if (!normalized || normalized.length > MAX_NAME_LENGTH ||
      !/^[\p{L}\p{N}][\p{L}\p{M}\p{N} ._'’-]*$/u.test(normalized)) {
    throw new Error('Introduce un nombre de 1 a 24 caracteres: letras, números, espacios, puntos, guiones o apóstrofos.');
  }
  if (!Number.isSafeInteger(score) || score < 0 || score > MAX_SCORE) {
    throw new Error('La puntuación no es válida.');
  }
  return normalized;
}

export function replacementForScore(previous, name, score) {
  // Retain the stored field so existing three-letter records remain compatible.
  const initials = validateScore(name, score);
  return previous && previous.score >= score ? null : { initials, score };
}

// Load authentication and the database only when the results are requested.
const client = () => import('./score-client.mjs?v=7');
async function remote(operation, message) {
  let timer;
  try {
    return await Promise.race([operation(), new Promise((_resolve, reject) => {
      timer = setTimeout(() => reject(new Error('timeout')), 12000);
    })]);
  } catch {
    throw new Error(message);
  } finally { clearTimeout(timer); }
}
export async function readLeaderboard() {
  return remote(async () => (await client()).readSharedLeaderboard(),
    'No se ha podido cargar la clasificación. Comprueba la conexión e inténtalo de nuevo.');
}
export async function saveScore(name, score) {
  const normalized = validateScore(name, score);
  return remote(async () => (await client()).saveSharedScore(normalized, score),
    'No se ha podido guardar la marca. Comprueba la conexión e inténtalo de nuevo.');
}
