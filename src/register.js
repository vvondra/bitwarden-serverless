import * as utils from './lib/api_utils';
import { User } from './lib/models';
import { buildUserDocument } from './lib/bitwarden';

export const handler = async (event, context, callback) => {
  console.log('Registration handler triggered', JSON.stringify(event, null, 2));
  if (process.env.DISABLE_USER_REGISTRATION === 'true') {
    callback(null, utils.validationError('Signups are not permitted'));
    return;
  }

  if (!event.body) {
    callback(null, utils.validationError('Missing request body'));
    return;
  }

  const body = utils.normalizeBody(JSON.parse(event.body));

  if (!body.masterpasswordhash) {
    callback(null, utils.validationError('masterPasswordHash cannot be blank'));
    return;
  }

  if (!/^.+@.+\..+$/.test(body.email)) {
    callback(null, utils.validationError('supply a valid e-mail'));
    return;
  }

  if (!/^\d\..+\|.+/.test(body.key)) {
    callback(null, utils.validationError('supply a valid key'));
    return;
  }

  try {
    const existingUser = await User.scan()
      .where('email').equals(body.email.toLowerCase())
      .select('COUNT')
      .execAsync();

    if (existingUser.Count > 0) {
      callback(null, utils.validationError('E-mail already taken'));
      return;
    }

    await User.createAsync(buildUserDocument(body));

    callback(null, utils.okResponse(''));
  } catch (e) {
    callback(null, utils.serverError(e.message, e));
  }
};
