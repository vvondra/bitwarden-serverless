import * as utils from './lib/api_utils';
import { User, Device } from './lib/models';
import { regenerateTokens, DEFAULT_VALIDITY } from './lib/bitwarden';

export const handler = async (event, context, callback) => {
  console.log('Login handler triggered', JSON.stringify(event, null, 2));
  if (!event.body) {
    callback(null, utils.validationError('Bad request'));
    return;
  }

  const body = JSON.parse(event.body);

  var device;

  try {
    switch (body.grant_type) {
      case 'password':
        const ok = [
          'client_id',
          'grant_type',
          'deviceIdentifier',
          'deviceName',
          'deviceType',
          'password',
          'scope',
          'username'
        ].some((param) => {
          if (!body[param]) {
            callback(null, utils.validationError(param + ' must be supplied'));
            return true;
          }
        });

        if (!ok) {
          return;
        }

        if (body.scope != 'api offline_access') {
          callback(null, utils.validationError('Scope not supported'));
          return;
        }

        const user = await User.scan()
          .where('email').equals(body.email.toLowerCase())
          .execAsync()
          .Items[0];

        if (!user) {
          callback(null, utils.validationError('Invalid e-mail/username'));
          return;
        }

        if (!user.matchesPasswordHash(body.password)) {
          callback(null, utils.validationError('Invalid password'));
          return;
        }

        device = await Device.getAsync(body.deviceIdentifier);
        console.log('aaa', device);
        if (device && device.get('userUuid') != user.get('uuid')) {
          await device.destroyAsync();
          device = null;
        }

        if (!device) {
          device = await Device.createAsync({
            userUuid: user.get('uuid'),
            uuid: body.deviceIdentifier
          });
        }

        device.set({
          type: body.deviceType,
          name: body.deviceName,
          pushToken: body.devicePushToken,
        });

        break;
      case 'refresh_token':
        if (!body.refresh_token) {
          callback(null, utils.validationError('Refresh token must be supplied'));
          return;
        }

        device = await findDeviceByRefreshToken(body.refresh_token);
        break;
      default:
        callback(null, utils.validationError('Unsupported grant type'));
        return;
    }

    device.set(regenerateTokens(user, device));
    
    device = await device.updateAsync();

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        access_token: device.get('accessToken'),
        expires_in: DEFAULT_VALIDITY,
        token_type: 'Bearer',
        refresh_token: device.get('refreshToken'),
        Key: user.get('key'),
      })
    });
  } catch (e) {
    callback(null, utils.serverError('Internal error'));
  }
};

function buildUser(body) {
  return {
    email: body.email.toLowerCase(),
    password_hash: body.masterpasswordhash,
    password_hint: body.masterpasswordhint,
    key: body.key,
    culture: 'en-US', // Hard-coded unless supplied from elsewhere
    premium: true,
  };
};
