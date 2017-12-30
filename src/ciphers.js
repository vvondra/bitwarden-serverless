import * as utils from './lib/api_utils';
import { loadContextFromHeader, buildCipherDocument } from './lib/bitwarden';
import { mapCipher } from './lib/mappers';
import { Cipher } from './lib/models';

export const postHandler = async (event, context, callback) => {
  console.log('Cipher create handler triggered', JSON.stringify(event, null, 2));

  if (!event.body) {
    callback(null, utils.validationError('Bad request'));
    return;
  }

  const body = utils.normalizeBody(JSON.parse(event.body));

  let user;
  try {
    ({ user } = await loadContextFromHeader(event.headers.Authorization));
  } catch (e) {
    callback(null, utils.validationError('Cannot load user from access token: ' + e));
    return;
  }

  if (!body.type || !body.name) {
    callback(null, utils.validationError('Missing type or name of cipher'));
    return;
  }

  try {
    const cipher = await Cipher.createAsync(buildCipherDocument(body, user));

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ ...mapCipher(cipher), Edit: true }),
    });
  } catch (e) {
    callback(null, utils.serverError('Error saving cipher', e));
  }
};

export const putHandler = async (event, context, callback) => {
  console.log('Cipher edit handler triggered', JSON.stringify(event, null, 2));
  if (!event.body) {
    callback(null, utils.validationError('Bad request'));
    return;
  }

  const body = utils.normalizeBody(JSON.parse(event.body));

  let user;
  try {
    ({ user } = await loadContextFromHeader(event.headers.Authorization));
  } catch (e) {
    callback(null, utils.validationError('Cannot load user from access token: ' + e));
    return;
  }

  if (!body.type || !body.name) {
    callback(null, utils.validationError('Missing type or name of cipher'));
    return;
  }

  const cipherUuid = event.pathParameters.uuid;
  if (!cipherUuid) {
    callback(null, utils.validationError('Missing cipher UUID'));
  }

  try {
    let cipher = await Cipher.getAsync(user.get('uuid'), cipherUuid);

    cipher.set(buildCipherDocument(body, user));

    cipher = await cipher.updateAsync();

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ ...mapCipher(cipher), Edit: true }),
    });
  } catch (e) {
    callback(null, utils.serverError('Error saving cipher', e));
  }
};

export const deleteHandler = async (event, context, callback) => {
  console.log('Cipher delete handler triggered', JSON.stringify(event, null, 2));

  let user;
  try {
    ({ user } = await loadContextFromHeader(event.headers.Authorization));
  } catch (e) {
    callback(null, utils.validationError('Cannot load user from access token'));
  }

  const cipherUuid = event.pathParameters.uuid;
  if (!cipherUuid) {
    callback(null, utils.validationError('Missing cipher UUID'));
  }

  try {
    await Cipher.destroyAsync(user.get('uuid'), cipherUuid);

    callback(null, {
      statusCode: 200,
      body: '',
    });
  } catch (e) {
    callback(null, utils.validationError(e.toString()));
  }
};
