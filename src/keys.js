import querystring from 'querystring';
import speakeasy from 'speakeasy';
import * as utils from './lib/api_utils';
import { User, Device } from './lib/models';
import { regenerateTokens, hashesMatch, DEFAULT_VALIDITY } from './lib/bitwarden';

export const handler = async (event, context, callback) => {
  console.log('Keys handler triggered', JSON.stringify(event, null, 2));
  if (!event.body) {
    callback(null, utils.validationError('Missing request body'));
    return;
  }

  const body = utils.normalizeBody(querystring.parse(event.body));

  let user;
  try {
    ({ user } = await loadContextFromHeader(event.headers.Authorization));
  } catch (e) {
    callback(null, utils.validationError('User not found: ' + e.message));
    return;
  }

  var re = new RegExp("/^2\..+\|.+/");
  if (!re.test(body.encryptedprivatekey)) {
    callback(null, utils.validationError('Invalid key'));
    return;
  }

  user['privateKey'] = body.encryptedprivatekey
  user['publicKey'] = body.publicKey

  const tokens = regenerateTokens(user, device);

  try{
    callback(null, {
      statusCode: 200,
      headers: {
         'Access-Control-Allow-Origin':'*'
      },
      body: JSON.stringify({
        access_token: tokens.accessToken,
        expires_in: DEFAULT_VALIDITY,
        token_type: 'Bearer',
        refresh_token: tokens.refreshToken,
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
        Organizations: "[]",
        Object : "profile",
      }),
    });
  } catch (e) {
    callback(null, utils.serverError('Internal error', e));
  }
};
