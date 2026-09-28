// Solo el propietario administrativo puede autorizar una cuenta que ya entró con Google.
import {api,assertNoBilling,project,commit,write} from './solutions-admin.mjs';
const email=process.argv[2];
if(!email||!email.includes('@'))throw new Error('Uso: node scripts/grant-teacher.mjs correo-del-profesor');
await assertNoBilling();
const result=await api(`https://identitytoolkit.googleapis.com/v1/projects/${project}/accounts:lookup`,{method:'POST',body:{email:[email]}});
const user=result.users?.find(user=>user.email.toLowerCase()===email.toLowerCase());
if(!user||!user.emailVerified||!user.providerUserInfo?.some(provider=>provider.providerId==='google.com')||user.disabled) {
  throw new Error('La cuenta debe haber iniciado sesión con Google y tener el correo verificado.');
}
await commit([write(`teacherAccounts/${user.localId}`,{enabled:true})]);
console.log('Cuenta de profesor autorizada. Puede volver a iniciar sesión.');
