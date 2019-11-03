import S3 from 'aws-sdk/clients/s3';
import * as utils from './lib/api_utils';
import { loadContextFromHeader, buildCipherDocument, touch } from './lib/bitwarden';
import { mapCipher } from './lib/mappers';
import { Cipher, Attachment } from './lib/models';

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

    await touch(user);

    callback(null, utils.okResponse({ ...await mapCipher(cipher), Edit: true }));
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
    await touch(user);

    callback(null, utils.okResponse({ ...await mapCipher(cipher), Edit: true }));
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

  let attachments;
  try {
    // Remove attachments. First retrieve associated attachments to the cipher.
    attachments = (await Attachment.query(cipherUuid).execAsync()).Items;
    attachments.forEach(async (attachment) => {
      // Remove it from S3 bucket
      const params = {
        Bucket: process.env.ATTACHMENTS_BUCKET,
        Key: cipherUuid + '/' + attachment.get('uuid'),
      };

      const s3 = new S3();
      await new Promise((resolve, reject) => s3.deleteObject(params, (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(data);
      }));

      // Remove it from table attachments
      Attachment.destroyAsync(cipherUuid, attachment.get('uuid'));
    });

    // Remove cipher from table ciphers
    await Cipher.destroyAsync(user.get('uuid'), cipherUuid);
    await touch(user);

    callback(null, utils.okResponse(''));
  } catch (e) {
    callback(null, utils.validationError(e.toString()));
  }
};
