import * as utils from './lib/api_utils';
import { loadContextFromHeader } from './lib/bitwarden';
import { getRevisionDateAsMillis } from './lib/mappers';

export const revisionDateHandler = async (event, context, callback) => {
  console.log('Account revision date handler triggered', JSON.stringify(event, null, 2));

  let user;
  try {
    ({ user } = await loadContextFromHeader(event.headers.Authorization));
  } catch (e) {
    callback(null, utils.validationError('User not found: ' + e.message));
  }

  try {
    callback(null, {
      statusCode: 200,
      headers: Object.assign(utils.CORS_HEADERS, {
        'Content-Type': 'text/plain',
      }),
      body: getRevisionDateAsMillis(user),
    });
  } catch (e) {
    callback(null, utils.serverError(e.toString()));
  }
};
