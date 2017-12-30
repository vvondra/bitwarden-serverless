import * as utils from './lib/api_utils';
import { loadContextFromHeader } from './lib/bitwarden';
import { mapUser, mapCipher, mapFolder } from './lib/mappers';
import { Cipher, Folder } from './lib/models';

export const handler = async (event, context, callback) => {
  console.log('Sync handler triggered', JSON.stringify(event, null, 2));

  let user;
  try {
    ({ user } = await loadContextFromHeader(event.headers.Authorization));
  } catch (e) {
    callback(null, utils.validationError('Cannot load user from access token'));
    return;
  }
  let ciphers;
  let folders;
  try {
    // TODO await in parallel
    ciphers = (await Cipher.query(user.get('uuid')).execAsync()).Items;
    folders = (await Folder.query(user.get('uuid')).execAsync()).Items;
  } catch (e) {
    callback(null, utils.serverError('Cannot load vault items', e));
    return;
  }

  const response = {
    Profile: mapUser(user),
    Folders: folders.map(mapFolder),
    Ciphers: ciphers.map(mapCipher),
    Domains: {
      EquivalentDomains: null,
      GlobalEquivalentDomains: [],
      Object: 'domains',
    },
    Object: 'sync',
  };

  callback(null, {
    statusCode: 200,
    body: JSON.stringify(response),
  });
};
