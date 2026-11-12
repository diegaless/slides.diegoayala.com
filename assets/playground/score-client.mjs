import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { initializeAuth, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence,
  signInAnonymously, connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getFirestore, connectFirestoreEmulator, collection, doc, query, orderBy, limit,
  getDoc, getDocs, runTransaction, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore-lite.js';
import { firebaseConfig } from '../solutions/config.mjs';
import { LEADERBOARD_LIMIT, replacementForScore } from './leaderboard.mjs?v=7';

const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
const emulated = local && window.frameElement?.dataset.scoreEmulator === 'true';
const config = emulated ? { projectId: 'demo-slides-profesor', apiKey: 'demo-key', authDomain: 'localhost' } : firebaseConfig;
const app = initializeApp(config, emulated ? 'playground-scores-emulator' : 'playground-scores');
// A separate app keeps the game's guest identity independent of the teacher session.
const auth = initializeAuth(app, { persistence: [browserLocalPersistence, browserSessionPersistence, inMemoryPersistence] });
const db = getFirestore(app);
if (emulated) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
let signingIn;
async function player() {
  await auth.authStateReady();
  if (!auth.currentUser) {
    signingIn ??= signInAnonymously(auth).finally(() => { signingIn = null; });
    await signingIn;
  }
  if (!auth.currentUser?.isAnonymous) throw new Error('No se ha podido identificar al jugador.');
  return auth.currentUser;
}

async function standings(user) {
  const [top, best] = await Promise.all([
    getDocs(query(collection(db, 'playgroundScores'), orderBy('score', 'desc'), limit(LEADERBOARD_LIMIT))),
    getDoc(doc(db, 'playgroundScores', user.uid)),
  ]);
  return {
    entries: top.docs.map(row => ({ initials: row.data().initials, score: row.data().score, mine: row.id === user.uid })),
    bestScore: best.exists() ? best.data().score : null,
  };
}

export async function readSharedLeaderboard() { return standings(await player()); }

export async function saveSharedScore(name, score) {
  const user = await player();
  const ref = doc(db, 'playgroundScores', user.uid);
  const improved = await runTransaction(db, async transaction => {
    const current = await transaction.get(ref);
    const replacement = replacementForScore(current.exists() ? current.data() : null, name, score);
    if (!replacement) return false;
    transaction.set(ref, { ...replacement, updatedAt: serverTimestamp() });
    return true;
  });
  const result = await standings(user);
  return { ...result, improved, qualified: result.entries.some(entry => entry.mine) };
}
