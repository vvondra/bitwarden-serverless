import * as utils from './lib/api_utils';
import { User } from './lib/models';
import { buildUserDocument } from './lib/bitwarden';

export const handler = async (event, context, callback) => {
  console.log('Registration handler triggered', JSON.stringify(event, null, 2));
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

  if (!/^0\..+\|.+/.test(body.key)) {
    callback(null, utils.validationError('supply a valid key'));
    return;
  }

  try {
    const existingUser = await User.scan()
      .where('email').equals(body.email.toLowerCase())
      .select('COUNT')
      .execAsync();

    console.log(existingUser);

    if (existingUser.Count > 0) {
      callback(null, utils.validationError('E-mail already taken'));
      return;
    }

    await User.createAsync(buildUserDocument(body));

    callback(null, {
      statusCode: 200,
      body: '',
    });
  } catch (e) {
    callback(null, utils.serverError(e.message, e));
  }
};
