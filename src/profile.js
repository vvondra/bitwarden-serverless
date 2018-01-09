import * as utils from './lib/api_utils';
import { regenerateTokens, loadContextFromHeader } from './lib/bitwarden';

export const handler = async (event, context, callback) => {
  console.log('Profile handler triggered', JSON.stringify(event, null, 2));

  let user;
  let device;
  try {
    ({ user, device } = await loadContextFromHeader(event.headers.Authorization));
  } catch (e) {
    callback(null, utils.validationError('User not found: ' + e.message));
    return;
  }

  const tokens = regenerateTokens(user, device);

  device.set({ refreshToken: tokens.refreshToken });

  device = await device.updateAsync();

  try {
    callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        Key: user.get('key'),
        Id: user.get('uuid'),
        Name: user.get('name'),
        Email: user.get('email'),
        EmailVerified: user.get('emailVerified'),
        Premium: user.get('premium'),
        MasterPasswordHint: user.get('passwordHint'),
        Culture: user.get('culture'),
        TwoFactorEnabled: user.get('totpSecret'),
        PrivateKey: user.get('privateKey'),
        SecurityStamp: user.get('securityStamp'),
        Organizations: '[]',
        Object: 'profile',
      }),
    });
  } catch (e) {
    callback(null, utils.serverError('Internal error', e));
  }
};
