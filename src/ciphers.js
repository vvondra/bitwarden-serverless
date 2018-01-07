import * as utils from './lib/api_utils';
import { loadContextFromHeader, buildCipherDocument } from './lib/bitwarden';
import { mapCipher } from './lib/mappers';
import { Cipher } from './lib/models';

export const postHandler = async (event, context, callback) => {
  console.log('Cipher create handler triggered', JSON.stringify(event, null, 2));

  if (!event.body) {
    callback(null, utils.validationError('Request body is missing'));
    return;
  }

  const body = utils.normalizeBody(JSON.parse(event.body));

  let user;
  try {
    ({ user } = await loadContextFromHeader(event.headers.Authorization));
  } catch (e) {
    callback(null, utils.validationError('User not found: ' + e.message));
    return;
  }

  if (!body.type || !body.name) {
    callback(null, utils.validationError('Missing name and type of vault item'));
    return;
  }

  try {
    const cipher = await Cipher.createAsync(buildCipherDocument(body, user));

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ ...mapCipher(cipher), Edit: true }),
    });
  } catch (e) {
    callback(null, utils.serverError('Server error saving vault item', e));
  }
};

export const putHandler = async (event, context, callback) => {
  console.log('Cipher edit handler triggered', JSON.stringify(event, null, 2));
  if (!event.body) {
    callback(null, utils.validationError('Request body is missing'));
    return;
  }

  const body = utils.normalizeBody(JSON.parse(event.body));

  let user;
  try {
    ({ user } = await loadContextFromHeader(event.headers.Authorization));
  } catch (e) {
    callback(null, utils.validationError('User not found: ' + e.message));
    return;
  }

  if (!body.type || !body.name) {
    callback(null, utils.validationError('Missing name and type of vault item'));
    return;
  }

  const cipherUuid = event.pathParameters.uuid;
  if (!cipherUuid) {
    callback(null, utils.validationError('Missing vault item ID'));
  }

  try {
    let cipher = await Cipher.getAsync(user.get('uuid'), cipherUuid);

    if (!cipher) {
      callback(null, utils.validationError('Unknown vault item'));
      return;
    }

    cipher.set(buildCipherDocument(body, user));

    cipher = await cipher.updateAsync();

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ ...mapCipher(cipher), Edit: true }),
    });
  } catch (e) {
    callback(null, utils.serverError('Server error saving vault item', e));
  }
};

export const deleteHandler = async (event, context, callback) => {
  console.log('Cipher delete handler triggered', JSON.stringify(event, null, 2));

  let user;
  try {
    ({ user } = await loadContextFromHeader(event.headers.Authorization));
  } catch (e) {
    callback(null, utils.validationError('User not found: ' + e.message));
  }

  const cipherUuid = event.pathParameters.uuid;
  if (!cipherUuid) {
    callback(null, utils.validationError('Missing vault item ID'));
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

export const getHandler = async (event, context, callback) => {
  console.log('Get handler triggered', JSON.stringify(event, null, 2));

  let user;
  try {
    ({ user } = await loadContextFromHeader(event.headers.Authorization));
  } catch (e) {
    callback(null, utils.validationError('User not found'));
  }

  let ciphers;
  try {
    if (event.pathParameters) {
      const cipherUuid = event.pathParameters.uuid;
      if (!cipherUuid) {
        callback(null, utils.validationError('Missing vault item ID'));
      }
      ciphers = await Cipher.getAsync(user.get('uuid'), cipherUuid);

      if (!ciphers) {
        callback(null, utils.validationError('Unknown vault item'));
        return;
      }
    } else {
      ciphers = (await Cipher.query(user.get('uuid')).execAsync()).Items;
    }
  } catch (e) {
    callback(null, utils.serverError('Server error loading vault items', e));
    return;
  }

  const response = {
    Data: ciphers.map(mapCipher),
    Object: 'list',
  };
  try {
    callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response),
    });
  } catch (e) {
    callback(null, utils.validationError(e.toString()));
  }
};
