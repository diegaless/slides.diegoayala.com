export const LEADERBOARD_LIMIT = 10;
export const MAX_SCORE = Number.MAX_SAFE_INTEGER;

export function validateScore(initials, score) {
  if (typeof initials !== 'string' || !/^[A-Z]{3}$/.test(initials) ||
      !Number.isSafeInteger(score) || score < 0 || score > MAX_SCORE) {
    throw new Error('Introduce tres letras de la A a la Z y una puntuación válida.');
  }
}

export function replacementForScore(previous, initials, score) {
  validateScore(initials, score);
  return previous && previous.score >= score ? null : { initials, score };
}

// Load authentication and the database only when the results are requested.
const client = () => import('./score-client.mjs?v=6');
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
export async function saveScore(initials, score) {
  validateScore(initials, score);
  return remote(async () => (await client()).saveSharedScore(initials, score),
    'No se ha podido guardar la marca. Comprueba la conexión e inténtalo de nuevo.');
}
