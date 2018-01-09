import * as utils from './lib/api_utils';
import * as bitwardenCrypto from './lib/crypto';
import { regenerateTokens, loadContextFromHeader, hashesMatch } from './lib/bitwarden';

export const handler = async (event, context, callback) => {
  console.log('Password handler triggered', JSON.stringify(event, null, 2));
  if (!event.body) {
    callback(null, utils.validationError('Missing request body'));
    return;
  }

  const body = utils.normalizeBody(JSON.parse(event.body));

  let user;
  let device;
  try {
    ({ user, device } = await loadContextFromHeader(event.headers.Authorization));
  } catch (e) {
    callback(null, utils.validationError('User not found: ' + e.message));
    return;
  }

  if (!body.key || !body.masterpasswordhash || !body.newmasterpasswordhash) {
    callback(null, utils.validationError('Missing parameter'));
    return;
  }

  if (!bitwardenCrypto.CipherString.fromString(body.key)) {
    callback(null, utils.validationError('Invalid key'));
    return;
  }

  if (hashesMatch(user.get('passwordHash'), body.masterpasswordhash)) {
    user.set({ key: body.key });
    user.set({ passwordHash: body.newmasterpasswordhash });
  } else {
    callback(null, utils.validationError('Wrong current password'));
    return;
  }

  const tokens = regenerateTokens(user, device);

  device.set({ refreshToken: tokens.refreshToken });

  device = await device.updateAsync();
  await user.updateAsync();

  try {
    callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    callback(null, utils.serverError('Internal error', e));
  }
};
