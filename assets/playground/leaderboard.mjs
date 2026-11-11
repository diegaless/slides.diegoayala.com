const key = 'slides-playground-leaderboard-v1';
let sessionEntries = [];

function normalize(entries) {
  return (Array.isArray(entries) ? entries : [])
    .filter(entry => entry && /^[A-Z]{3}$/.test(entry.initials) &&
      Number.isSafeInteger(entry.score) && entry.score >= 0 && entry.score <= 1_000_000)
    .map(({ initials, score }) => ({ initials, score }))
    .sort((a, b) => b.score - a.score).slice(0, 10);
}

export function readLeaderboard(storage) {
  try {
    sessionEntries = normalize(JSON.parse(storage.getItem(key) || '[]'));
  } catch { /* Retain this session's results when storage is unavailable. */ }
  return sessionEntries.map(entry => ({ ...entry }));
}

export function saveScore(initials, score, storage) {
  if (!/^[A-Z]{3}$/.test(initials) || !Number.isSafeInteger(score) || score < 0 || score > 1_000_000) {
    throw new Error('Introduce tres letras de la A a la Z y una puntuación válida.');
  }
  const entries = readLeaderboard(storage);
  const qualified = entries.length < 10 || score > entries.at(-1).score;
  if (qualified) entries.push({ initials, score });
  sessionEntries = normalize(entries);
  let persisted = false;
  try {
    storage.setItem(key, JSON.stringify(sessionEntries));
    persisted = true;
  } catch { /* The game also works without persistent browser storage. */ }
  return { entries: sessionEntries.map(entry => ({ ...entry })), qualified, persisted };
}
