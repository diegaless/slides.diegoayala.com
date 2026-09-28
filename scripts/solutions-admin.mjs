// Administración local. La credencial de Firebase CLI nunca se envía al navegador.
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const auth=require('firebase-tools/lib/auth');
export const project='slides-profesor-diego';
const hosts=new Set(['firestore.googleapis.com','identitytoolkit.googleapis.com','cloudbilling.googleapis.com','serviceusage.googleapis.com']);
let token;
async function accessToken() {
  if(token && token.expires_at>Date.now()+60_000)return token.access_token;
  const account=auth.getGlobalDefaultAccount();
  if(!account)throw new Error('Inicia sesión con firebase login antes de administrar el panel.');
  token=await auth.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform','https://www.googleapis.com/auth/firebase']);
  return token.access_token;
}
export async function api(url,{method='GET',body,allowMissing=false}={}) {
  const parsed=new URL(url);
  if(parsed.protocol!=='https:'||!hosts.has(parsed.hostname)||!parsed.pathname.includes(`/projects/${project}/`))throw new Error('Destino administrativo no permitido.');
  const response=await fetch(url,{method,headers:{Authorization:`Bearer ${await accessToken()}`,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
  const data=await response.json();
  if(allowMissing&&response.status===404)return null;
  if(!response.ok)throw new Error(`${method} ${parsed.pathname}: ${response.status} ${data.error?.message||'Error del servicio'}`);
  return data;
}
export async function assertNoBilling() {
  const billing=await api(`https://cloudbilling.googleapis.com/v1/projects/${project}/billingInfo`);
  if(billing.billingEnabled || billing.billingAccountName)throw new Error('Se requiere Spark sin cuenta de facturación. Se cancela la operación.');
  return billing;
}
export const documentRoot=`projects/${project}/databases/(default)/documents`;
export function fields(values) {
  return Object.fromEntries(Object.entries(values).map(([key,value])=>[key,
    value===null?{nullValue:null}:Buffer.isBuffer(value)?{bytesValue:value.toString('base64')}:
    value instanceof Date?{timestampValue:value.toISOString()}:
    typeof value==='boolean'?{booleanValue:value}:typeof value==='number'?{integerValue:String(value)}:{stringValue:value}
  ]));
}
export function getDocument(path) {return api(`https://firestore.googleapis.com/v1/${documentRoot}/${path}`,{allowMissing:true});}
export function commit(writes) {return api(`https://firestore.googleapis.com/v1/${documentRoot}:commit`,{method:'POST',body:{writes}});}
export function write(path,values,extra={}) {return {update:{name:`${documentRoot}/${path}`,fields:fields(values)},...extra};}
