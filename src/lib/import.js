import fastcsv from 'fast-csv';
import { Folder } from './models';
import * as bitwardenCrypto from './crypto';

export async function loadFolders(user, masterKey, csv, folderNameCallback) {
  const folderNames = await collectFolderNames(csv, folderNameCallback);

  const encrypt = (value) => {
    const s = bitwardenCrypto
      .encryptWithMasterPasswordKey(value, user.get('key'), masterKey)
      .toString();

    return s;
  };

  const existingFolders = (await Folder.query(user.get('uuid')).execAsync())
    .Items
    .reduce((acc, folder) => {
      const folderName = bitwardenCrypto.decryptWithMasterPasswordKey(
        folder.get('name'),
        user.get('key'),
        masterKey,
      );
      acc[folderName] = folder.get('uuid');

      return acc;
    }, {});

  for (const folderName of folderNames) { // eslint-disable-line
    if (!existingFolders[folderName]) {
      try {
        // Create folder if missing
        /* eslint-disable no-await-in-loop */
        const folder = await Folder.createAsync({ userUuid: user.get('uuid'), name: encrypt(folderName) });
        /* eslint-enable no-await-in-loop */
        existingFolders[folderName] = folder.get('uuid');
      } catch (e) {
        console.error('Error creating folder', e);
      }
    }
  }

  return existingFolders;
}

export function collectFolderNames(csv, folderNameCallback) {
  const folderNames = [];
  return new Promise((resolve) => {
    fastcsv.fromString(csv, { headers: true })
      .on('data', (row) => {
        folderNames.push(folderNameCallback(row));
      })
      .on('end', () => {
        resolve(folderNames.filter(f => !!f));
      });
  });
}
