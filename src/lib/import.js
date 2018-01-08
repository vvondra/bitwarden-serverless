import { Folder } from './models';
import * as bitwardenCrypto from './crypto';

export async function loadFolders(user, masterKey) {
  return (await Folder.query(user.get('uuid')).execAsync())
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
}
