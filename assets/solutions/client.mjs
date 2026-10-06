import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import {
  initializeAuth, GoogleAuthProvider, signInWithPopup, signOut,
  setPersistence, browserSessionPersistence, connectAuthEmulator, browserPopupRedirectResolver,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {
  getFirestore, doc, getDoc, getDocs, collection,
  updateDoc, serverTimestamp, Timestamp, connectFirestoreEmulator,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore-lite.js';
import {firebaseConfig} from './config.mjs';
import {validId, publicationChange, downloadName} from './domain.mjs';

let services;
export function backend() {
  if (services) return services;
  // Emuladores únicamente en la copia local: nunca se leen host o puertos de la URL.
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  const config = local && !firebaseConfig ? {
    apiKey:'demo-key', projectId:'demo-slides-profesor', authDomain:'localhost',
  } : firebaseConfig;
  if (!config) throw new Error('El acceso de profesor todavía no está activado.');
  const app = initializeApp(config, 'soluciones');
  // Restaurar la sesión sin cargar el iframe de Google en cada enunciado.
  // El resolver de la ventana de acceso solo se activa al iniciar sesión.
  const auth = initializeAuth(app, {persistence:browserSessionPersistence});
  const db = getFirestore(app);
  if (local && config.projectId.startsWith('demo-')) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', {disableWarnings:true});
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }
  services = {auth, db};
  return services;
}

export function isTeacher(user) {
  return Boolean(user && services?.teacherUID === user.uid && user.emailVerified &&
    user.providerData.some(provider => provider.providerId === 'google.com'));
}

async function authorize(user) {
  services.teacherUID = null;
  if (!user?.emailVerified || !user.providerData.some(provider=>provider.providerId==='google.com')) return;
  try {
    const access=await getDoc(doc(services.db,'teacherAccounts',user.uid));
    if (access.exists() && access.data().enabled === true) services.teacherUID=user.uid;
  } catch (error) {
    if (!error.code?.includes('permission-denied')) throw error;
  }
}

export async function currentUser() {
  const {auth} = backend();
  await auth.authStateReady();
  await authorize(auth.currentUser);
  return auth.currentUser;
}

export async function login() {
  const {auth} = backend();
  await setPersistence(auth, browserSessionPersistence);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({prompt:'select_account'});
  const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
  await authorize(result.user);
  if (!isTeacher(result.user)) {
    await signOut(auth);
    throw new Error('Esta cuenta no tiene acceso de profesor. Entra con tu cuenta autorizada.');
  }
  return result.user;
}

export function logout() { services.teacherUID=null; return signOut(backend().auth); }

export async function getState(id) {
  if (!validId(id)) throw new Error('Tarea no válida.');
  const snap = await getDoc(doc(backend().db, 'solutionStates', id));
  return snap.exists() ? snap.data() : null;
}

export async function getAllStates() {
  const snap = await getDocs(collection(backend().db, 'solutionStates'));
  return new Map(snap.docs.map(item => [item.id, item.data()]));
}

export async function setState(id, mode, date) {
  if (!validId(id)) throw new Error('Tarea no válida.');
  const change = publicationChange(mode, date);
  await updateDoc(doc(backend().db, 'solutionStates', id), {
    mode:change.mode,
    publishAt:change.publishAt ? Timestamp.fromDate(change.publishAt) : null,
    updatedAt:serverTimestamp(),
  });
  return getState(id);
}

export async function getFile(id, kind) {
  const name = downloadName(id, kind);
  const {db} = backend();
  // Firestore Lite siempre consulta el servidor, sin caché ni acceso offline.
  // Las reglas vuelven a comprobar el permiso en el manifiesto y en cada parte.
  const manifest = await getDoc(doc(db, 'solutionFiles', `${id}-${kind}`));
  if (!manifest.exists()) throw new Error('No se ha encontrado el archivo.');
  const data = manifest.data();
  if (data.taskId !== id || !Number.isInteger(data.parts) || data.parts < 1 || data.parts > 100) {
    throw new Error('El archivo no está disponible.');
  }
  const chunks = [];
  for (let i = 0; i < data.parts; i++) {
    const part = await getDoc(doc(db, 'solutionFiles', `${id}-${kind}`, 'parts', `${data.sha256}-${i}`));
    if (!part.exists()) throw new Error('El archivo está incompleto.');
    chunks.push(part.data().bytes.toUint8Array());
  }
  const blob = new Blob(chunks, {type:kind === 'pdf' ? 'application/pdf' : 'application/zip'});
  if (blob.size !== data.size) throw new Error('No se ha podido comprobar la descarga.');
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer()))]
    .map(byte => byte.toString(16).padStart(2, '0')).join('');
  if (hash !== data.sha256) throw new Error('La descarga está incompleta. Vuelve a intentarlo.');
  return {blob, name};
}

export function friendlyError(error) {
  if (error.code?.includes('permission-denied')) return 'Esta solución está privada o su acceso acaba de cerrarse.';
  if (error.code === 'auth/popup-closed-by-user') return 'Se ha cancelado el inicio de sesión.';
  if (error.code === 'auth/popup-blocked') return 'Permite la ventana de Google en tu navegador y vuelve a intentarlo.';
  if (error.code === 'auth/unauthorized-domain') return 'El acceso desde este dominio no está activado.';
  if (error.code?.includes('network') || error.code === 'unavailable') return 'No se ha podido conectar. Revisa tu conexión y vuelve a intentarlo.';
  return error.message || 'No se ha podido completar la operación.';
}
