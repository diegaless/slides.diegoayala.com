import {after,before,test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {
  initializeTestEnvironment, assertFails, assertSucceeds,
} from '@firebase/rules-unit-testing';
import {doc,getDoc,getDocs,collection,setDoc,updateDoc,deleteDoc,Timestamp,serverTimestamp,Bytes} from 'firebase/firestore';

let env;
const uid='teacher-test';
const claims={email:'teacher@example.test',email_verified:true,firebase:{sign_in_provider:'google.com'}};
const account=(id=uid,overrides={})=>env.authenticatedContext(id,{...claims,...overrides}).firestore();
const guest=()=>env.unauthenticatedContext().firestore();
const state=(db,id)=>doc(db,'solutionStates',id);
const file=(db,id)=>doc(db,'solutionFiles',`${id}-pdf`);
const part=(db,id)=>doc(db,'solutionFiles',`${id}-pdf`,'parts','sha-0');
before(async()=>{
  env=await initializeTestEnvironment({projectId:'demo-slides-profesor',firestore:{rules:await readFile('firestore.rules','utf8')}});
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore();
    await setDoc(doc(db,'teacherAccounts',uid),{enabled:true});
    await setDoc(doc(db,'teacherAccounts','disabled-teacher'),{enabled:false});
    const now=Date.now();
    for(const [id,mode,publishAt] of [
      ['di-private','private',null],['di-public','public',null],
      ['di-future','scheduled',Timestamp.fromMillis(now+86400000)],
      ['di-past','scheduled',Timestamp.fromMillis(now-86400000)],
      ['di-mutable','private',null],
    ]) {
      await setDoc(state(db,id),{mode,publishAt,updatedAt:Timestamp.now()});
      await setDoc(file(db,id),{taskId:id,parts:1,size:3,sha256:'sha'});
      await setDoc(part(db,id),{bytes:Bytes.fromUint8Array(new Uint8Array([1,2,3]))});
    }
    await setDoc(file(db,'di-orphan'),{taskId:'di-missing',parts:1,size:3});
    await setDoc(part(db,'di-orphan'),{bytes:Bytes.fromUint8Array(new Uint8Array([1,2,3]))});
  });
});
after(async()=>{await env?.cleanup();});

test('cualquiera puede consultar un estado conocido, sin leer archivos privados',async()=>{
  await assertSucceeds(getDoc(state(guest(),'di-private')));
  await assertFails(getDoc(file(guest(),'di-private')));
  await assertFails(getDoc(part(guest(),'di-private')));
});
test('solo el profesor puede enumerar todos los estados',async()=>{
  await assertFails(getDocs(collection(guest(),'solutionStates')));
  await assertFails(getDocs(collection(account('student'),'solutionStates')));
  await assertSucceeds(getDocs(collection(account(),'solutionStates')));
});
test('un alumno no puede publicar, retirar, borrar o inventar tareas',async()=>{
  for(const db of [guest(),account('student')]) {
    await assertFails(updateDoc(state(db,'di-private'),{mode:'public',publishAt:null,updatedAt:serverTimestamp()}));
    await assertFails(deleteDoc(state(db,'di-public')));
    await assertFails(setDoc(state(db,'di-invented'),{mode:'public',publishAt:null,updatedAt:serverTimestamp()}));
  }
});
test('ni el correo del profesor sin su UID ni el proveedor incorrecto conceden permisos',async()=>{
  await assertFails(getDoc(file(account('impostor'),'di-private')));
  await assertFails(getDoc(file(account(uid,{email_verified:false}),'di-private')));
  await assertFails(getDoc(file(account(uid,{firebase:{sign_in_provider:'password'}}),'di-private')));
  await assertFails(getDoc(file(account('disabled-teacher'),'di-private')));
});
test('nadie puede asignarse permisos de profesor desde el cliente',async()=>{
  await assertFails(setDoc(doc(account('student'),'teacherAccounts','student'),{enabled:true}));
  await assertFails(updateDoc(doc(account(),'teacherAccounts',uid),{enabled:false}));
  await assertFails(getDoc(doc(account('student'),'teacherAccounts',uid)));
  await assertFails(getDocs(collection(account(),'teacherAccounts')));
});
test('el profesor consulta los archivos privados y su propia autorización',async()=>{
  await assertSucceeds(getDoc(file(account(),'di-private')));
  await assertSucceeds(getDoc(part(account(),'di-private')));
  await assertSucceeds(getDoc(doc(account(),'teacherAccounts',uid)));
});
test('publicar y volver a cerrar revoca también el acceso directo a las partes',async()=>{
  const db=account();
  await assertSucceeds(updateDoc(state(db,'di-mutable'),{mode:'public',publishAt:null,updatedAt:serverTimestamp()}));
  await assertSucceeds(getDoc(file(guest(),'di-mutable')));
  await assertSucceeds(getDoc(part(guest(),'di-mutable')));
  await assertSucceeds(updateDoc(state(db,'di-mutable'),{mode:'private',publishAt:null,updatedAt:serverTimestamp()}));
  await assertFails(getDoc(file(guest(),'di-mutable')));
  await assertFails(getDoc(part(guest(),'di-mutable')));
});
test('los archivos públicos se leen sin iniciar sesión; la colección completa no se lista',async()=>{
  await assertSucceeds(getDoc(file(guest(),'di-public')));
  await assertSucceeds(getDoc(part(guest(),'di-public')));
  await assertFails(getDocs(collection(guest(),'solutionFiles')));
  await assertFails(getDocs(collection(guest(),'solutionFiles','di-public-pdf','parts')));
});
test('programación determinada por el reloj del servidor y ausencia de permisos heredados',async()=>{
  await assertFails(getDoc(file(guest(),'di-future')));
  await assertFails(getDoc(part(guest(),'di-future')));
  await assertSucceeds(getDoc(file(guest(),'di-past')));
  await assertSucceeds(getDoc(part(guest(),'di-past')));
  await assertFails(getDoc(file(guest(),'di-orphan')));
  await assertFails(getDoc(part(guest(),'di-orphan')));
});
test('solo se aceptan cambios de estado con campos y tipos válidos',async()=>{
  const db=account(), ref=state(db,'di-mutable');
  for(const bad of [
    {mode:'administrator'},{publishAt:'mañana'}, {mode:true}, {extra:'injected'},
    {updatedAt:Timestamp.fromMillis(0)}, {mode:'scheduled',publishAt:null},
    {mode:'scheduled',publishAt:Timestamp.fromMillis(Date.now()-10000)},
    {mode:'scheduled',publishAt:Timestamp.fromMillis(Date.now()+367*86400000)},
    {mode:'public',publishAt:Timestamp.fromMillis(Date.now()+86400000)},
  ]) await assertFails(updateDoc(ref,{updatedAt:serverTimestamp(),...bad}));
  await assertFails(setDoc(ref,{mode:'public',updatedAt:serverTimestamp()}));
  await assertSucceeds(updateDoc(ref,{mode:'scheduled',publishAt:Timestamp.fromMillis(Date.now()+86400000),updatedAt:serverTimestamp()}));
});
test('archivos, hashes y relaciones con otras tareas son inmutables desde el cliente',async()=>{
  for(const db of [account(),account('student'),guest()]) {
    await assertFails(updateDoc(file(db,'di-private'),{taskId:'di-public'}));
    await assertFails(updateDoc(part(db,'di-private'),{bytes:'malicious'}));
    await assertFails(deleteDoc(file(db,'di-public')));
    await assertFails(setDoc(doc(db,'other','document'),{admin:true}));
  }
});
