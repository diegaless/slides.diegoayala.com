// Only enables the game's guest provider; does not replace the Google configuration.
import { api, assertNoBilling, project } from './solutions-admin.mjs';
await assertNoBilling();
const url = `https://identitytoolkit.googleapis.com/admin/v2/projects/${project}/config`;
let config = await api(url);
if (process.argv.includes('--enable-anonymous') && config.signIn?.anonymous?.enabled !== true) {
  config = await api(`${url}?updateMask=signIn.anonymous.enabled`, {
    method: 'PATCH', body: { name: `projects/${project}/config`, signIn: { anonymous: { enabled: true } } },
  });
}
console.log(JSON.stringify({ project, anonymousEnabled: config.signIn?.anonymous?.enabled === true, billingEnabled: false }));
