import * as utils from './lib/api_utils';
import { findDeviceByRefreshToken } from './lib/devices';
import { findUserByEmail } from './lib/users';

export const handler = async (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  if (!event.body) {
    callback(null, utils.validationError("Bad request"));
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
            callback(null, utils.validationError(param + " must be supplied"));
            return true;
          }
        });

        if (!ok) {
          return;
        }

        if (body.scope != 'api offline_access') {
          callback(null, utils.validationError("Scope not supported"));
          return;
        }

        const user = await findUserByEmail(body.username);

        if (!user) {
          callback(null, utils.validationError("Invalid e-mail/username"));
          return;
        }

        if (!user.matchesPasswordHash(body.password)) {
          callback(null, utils.validationError("Invalid password"));
          return;
        }

        break;
      case 'refresh_token':
        if (!body.refresh_token) {
          callback(null, utils.validationError("Refresh token must be supplied"));
          return;
        }

        device = await findDeviceByRefreshToken(body.refresh_token);
        break;
      default:
        callback(null, utils.validationError("Unsupported grant type"));
        return;
    }
  } catch (e) {

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