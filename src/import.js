import { normalizeBody, validationError, okResponse } from './lib/api_utils';
import { Cipher, Folder } from './lib/models';
import { loadContextFromHeader, buildCipherDocument, touch } from './lib/bitwarden';

const MAX_RETRIES = 4;

const resolveHandler = async (promiseList, user, fcb) => {
  const output = [];
  let retryCount = 0;
  let failedPromises = promiseList;
  while (failedPromises.length > 0 && retryCount < MAX_RETRIES) {
    retryCount += 1;
    failedPromises = await Promise.all(failedPromises) // eslint-disable-line
      .then((results) => {
        const toRetry = [];
        for (let i = 0; i < results.length; i += 1) {
          const res = results[i];
          if (!res.success) {
            output.push('ERR: ' + res.code);
            console.error('ERR: ' + res.code);
            const { model } = res;
            const retryPromise = new Promise((resolve) => {
              // Delay by 1-3s to get throughput lower
              // lambda has a limit of 30s for functions on API GWs
              setTimeout(resolve, Math.floor(Math.random() * 3000));
            }).then(() => fcb(model, user));
            toRetry.push(retryPromise);
          }
        }
        const msg = 'DONE, total: ' + results.length
          + ', error: ' + toRetry.length
          + ', rounds: ' + retryCount;
        console.log(msg);
        output.push(msg);
        return toRetry;
      });

    console.log('Retrying ' + failedPromises + ' calls');
  }
  return {
    output,
    failedPromises,
  };
};

export const postHandler = async (event, context, callback) => {
  console.log('Bitwarden import handler triggered');

  /**
   * Data validation
   */

  let user;
  try {
    ({ user } = await loadContextFromHeader(event.headers.Authorization));
  } catch (e) {
    callback(null, validationError('User not found: ' + e.message));
    return;
  }

  if (!event.body) {
    callback(null, validationError('Request body is missing'));
    return;
  }

  const body = normalizeBody(JSON.parse(event.body));

  /**
   * Folder creation
   */

  if (!Array.isArray(body.folders)) {
    callback(null, validationError('Folders is not an array'));
    return;
  }

  const createFolder = (f, u) => (Folder
    .createAsync({
      name: f.name,
      userUuid: u.get('uuid'),
    })
    .then(result => ({ success: true, result, model: f }))
    .catch(error => ({ success: false, error, model: f }))
  );

  const folderPromises = body.folders.map(folder => createFolder(folder, user));

  const {
    output: folderOutput,
    failedPromises: folderFailedPromises,
  } = await resolveHandler(folderPromises, user, createFolder);

  if (folderFailedPromises.length > 0) {
    folderOutput.push('Unable to complete for ' + folderFailedPromises.length + ' folders');
    callback(null, validationError(folderOutput.join(' ')));
  }

  /**
   * Cipher creation
   */
  if (!Array.isArray(body.ciphers)) {
    callback(null, validationError('Ciphers is not an array'));
    return;
  }
  if (!Array.isArray(body.folderrelationships)) {
    callback(null, validationError('FolderRelationships is not an array'));
    return;
  }

  const createCipher = cipher => (
    Cipher.createAsync(cipher)
      .then(result => ({ success: true, result, model: cipher }))
      .catch(error => ({ success: false, error, model: cipher }))
  );

  const cipherPromises = [];
  for (let i = 0; i < body.ciphers.length; i += 1) {
    const cipher = buildCipherDocument(normalizeBody(body.ciphers[i]), user);
    const destFolder = body.folderrelationships.filter(fr => fr.key === i);
    if (destFolder.length === 1) {
      const whichFolder = destFolder[0].value;
      if (folderPromises.length > whichFolder) {
        const { result: folder } = await folderPromises[whichFolder]; // eslint-disable-line
        cipher.folderUuid = folder.uuid;
      } else {
        callback(null, validationError('Folder defined in folder relationships was missing'));
        return;
      }
    }
    cipherPromises.push(createCipher(cipher));
  }

  const {
    output: cipherOutput,
    failedPromises: cipherFailedPromises,
  } = await resolveHandler(cipherPromises, user, createCipher);

  if (cipherFailedPromises.length > 0) {
    cipherOutput.push('Unable to complete for ' + cipherFailedPromises.length + ' ciphers');
    callback(null, validationError(cipherOutput.join(' ')));
  }

  await touch(user);

  callback(null, okResponse(''));
};
