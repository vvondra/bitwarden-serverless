import fastcsv from 'fast-csv';
import { User, Folder, Cipher } from './lib/models';
import * as bitwardenCrypto from './lib/crypto';
import * as bitwarden from './lib/bitwarden';
import { loadFolders } from './lib/import';

async function loadUser(event) {
  if (!event.email) {
    throw new Error('E-mail must be supplied');
  }

  if (!event.masterPassword) {
    throw new Error('Master password must be supplied');
  }

  if (!event.csv) {
    throw new Error('CSV must be supplied');
  }

  const email = event.email.toLowerCase();
  try {
    const [user] = (await User.scan()
      .where('email').equals(email)
      .execAsync()).Items;

    const passwordHash = await bitwardenCrypto.hashPasswordAsync(event.masterPassword, email);
    if (passwordHash !== user.get('passwordHash')) {
      throw new Error('Invalid password supplied');
    }

    return user;
  } catch (e) {
    throw new Error('User not found');
  }
}

export const bitwardenHandler = async (event, context, callback) => {
  console.log('Bitwarden import handler triggered', JSON.stringify(event, null, 2));

  const output = [];

  let user;
  try {
    user = await loadUser(event);
  } catch (e) {
    callback(null, e.message);
    return;
  }

  try {
    const masterKey = await bitwardenCrypto.makeKeyAsync(event.masterPassword, user.get('email'));

    const folders = await loadFolders(user, masterKey);
    console.log('Already known folders', folders);

    const savePromises = [];

    fastcsv.fromString(event.csv, { headers: true })
      .on('data', async (row) => {
        if (!row.name) {
          return;
        }
        output.push('Storing ' + row.name);

        const cipher = {
          userUuid: user.get('uuid'),
          favorite: parseInt(row.favorite, 10) === 1,
        };

        const encrypt = (value) => {
          const s = bitwardenCrypto
            .encryptWithMasterPasswordKey(value, user.get('key'), masterKey)
            .toString();

          return s;
        };

        if (row.folder) {
          if (folders[row.folder]) {
            cipher.folderUuid = folders[row.folder];
          } else {
            try {
              // Create folder if missing
              const folder = await Folder.createAsync({ userUuid: user.get('uuid'), name: encrypt(row.folder) });
              cipher.folderUuid = folder.get('uuid');
              folders[row.folder] = folder.get('uuid');
            } catch (e) {
              console.error('Error creating folder', e);
              output.push('ERROR creating folder ' + row.folder);
            }
          }
        }

        switch (row.type) {
          case 'login':
            cipher.type = bitwarden.TYPE_LOGIN;
            break;
          case 'note':
            cipher.type = bitwarden.TYPE_NOTE;
            break;
          case 'card':
            cipher.type = bitwarden.TYPE_CARD;
            break;
          default:
            throw new Error('Unknown item type: ' + row.type);
        }

        cipher.data = {
          Name: encrypt(row.name),
          Notes: row.notes ? encrypt(row.notes) : undefined,
          Uri: row.login_uri ? encrypt(row.login_uri) : undefined,
          Username: row.login_username ? encrypt(row.login_username) : undefined,
          Password: row.login_password ? encrypt(row.login_password) : undefined,
          Totp: row.login_totp ? encrypt(row.login_totp) : undefined,
        };

        if (row.fields) {
          cipher.data.Fields = [];
          const [key, value] = row.fields.split(': ', 2);
          cipher.data.Fields.push({
            Type: 0, // 0 = text, 1 = hidden, 2 = boolean
            Name: encrypt(key),
            Value: encrypt(value),
          });
        }

        // We always resolve so Promise.all doesn't use fail-fast
        savePromises.push(Cipher.createAsync(cipher)
          .then(result => ({ success: true, result, cipher }))
          .catch(error => ({ success: false, error, cipher })));
      })
      .on('error', (e) => {
        console.error('Error parsing CSV row', e);
        output.push('ERROR parsing import row:' + e);
      })
      .on('end', async () => {
        console.log('Waiting for imports to finish');
        let failedPromises = savePromises;
        while (failedPromises.length > 0) {
          failedPromises = await Promise.all(failedPromises) // eslint-disable-line
            .then((results) => {
              const toRetry = [];
              for (let i = 0; i < results.length; i += 1) {
                const res = results[i];
                if (!res.success) {
                  output.push('ERR: ' + res.code);
                  console.error('ERR: ' + res.code);

                  const { cipher } = res;
                  const retryPromise = new Promise((resolve) => {
                    // Delay by 1-30s to get throughput lower
                    setTimeout(resolve, Math.floor(Math.random() * 30000));
                  }).then(() => {
                    Cipher.createAsync(cipher)
                      .then(result => ({ success: true, result, cipher }))
                      .catch(error => ({ success: false, error, cipher }));
                  });
                  toRetry.push(retryPromise);
                }
              }

              const msg = 'DONE, total: ' + results.length + ', error: ' + toRetry.length;
              console.log(msg);
              output.push(msg);

              return toRetry;
            });

          console.log('Retrying ' + failedPromises + ' calls');
        }

        callback(null, output);
      });
  } catch (e) {
    console.error('Exception processing import data', e);
    callback(null, 'ERROR: ' + e);
  }
};

export const lastpassHandler = async (event, context, callback) => {
  console.log('Lastpass import handler triggered', JSON.stringify(event, null, 2));

  const output = [];

  let user;
  try {
    user = await loadUser(event);
  } catch (e) {
    callback(null, e.message);
    return;
  }


  try {
    const masterKey = await bitwardenCrypto.makeKeyAsync(event.masterPassword, user.get('email'));

    const folders = await loadFolders(user, masterKey);
    console.log('Already known folders', folders);

    const savePromises = [];

    fastcsv.fromString(event.csv, { headers: true })
      .on('data', async (row) => {
        if (!row.name) {
          return;
        }
        output.push('Storing ' + row.name);

        const cipher = {
          userUuid: user.get('uuid'),
          favorite: parseInt(row.fav, 10) === 1,
        };

        const encrypt = (value) => {
          const s = bitwardenCrypto
            .encryptWithMasterPasswordKey(value, user.get('key'), masterKey)
            .toString();

          return s;
        };

        if (row.grouping) {
          if (folders[row.grouping]) {
            cipher.folderUuid = folders[row.grouping];
          } else {
            try {
              // Create folder if missing
              const folder = await Folder.createAsync({ userUuid: user.get('uuid'), name: encrypt(row.grouping) });
              cipher.folderUuid = folder.get('uuid');
              folders[row.grouping] = folder.get('uuid');
            } catch (e) {
              console.error('Error creating folder', e);
              output.push('ERROR creating folder ' + row.grouping);
            }
          }
        }

        cipher.data = {
          Name: encrypt(row.name),
          Notes: row.extra ? encrypt(row.extra) : undefined,
          Uri: row.url ? encrypt(row.url) : undefined,
          Username: row.username ? encrypt(row.username) : undefined,
          Password: row.password ? encrypt(row.password) : undefined,
        };

        if (row.url === 'http://sn') {
          cipher.type = bitwarden.TYPE_NOTE;
          cipher.data.SecureNote = { Type: 0 };
        } else {
          cipher.type = bitwarden.TYPE_LOGIN;
        }

        // We always resolve so Promise.all doesn't use fail-fast
        savePromises.push(Cipher.createAsync(cipher)
          .then(result => ({ success: true, result, cipher }))
          .catch(error => ({ success: false, error, cipher })));
      })
      .on('error', (e) => {
        console.error('Error parsing CSV row', e);
        output.push('ERROR parsing import row:' + e);
      })
      .on('end', async () => {
        console.log('Waiting for imports to finish');
        let failedPromises = savePromises;
        while (failedPromises.length > 0) {
          failedPromises = await Promise.all(failedPromises) // eslint-disable-line
            .then((results) => {
              const toRetry = [];
              for (let i = 0; i < results.length; i += 1) {
                const res = results[i];
                if (!res.success) {
                  output.push('ERR: ' + res.code);
                  console.error('ERR: ' + res.code);

                  const { cipher } = res;
                  const retryPromise = new Promise((resolve) => {
                    // Delay by 1-30s to get throughput lower
                    setTimeout(resolve, Math.floor(Math.random() * 30000));
                  }).then(() => {
                    Cipher.createAsync(cipher)
                      .then(result => ({ success: true, result, cipher }))
                      .catch(error => ({ success: false, error, cipher }));
                  });
                  toRetry.push(retryPromise);
                }
              }

              const msg = 'DONE, total: ' + results.length + ', error: ' + toRetry.length;
              console.log(msg);
              output.push(msg);

              return toRetry;
            });

          console.log('Retrying ' + failedPromises + ' calls');
        }

        callback(null, output);
      });
  } catch (e) {
    console.error('Exception processing import data', e);
    callback(null, 'ERROR: ' + e);
  }
};
