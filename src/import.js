import fastcsv from 'fast-csv';
import { User, Folder, Cipher } from './lib/models';
import * as bitwardenCrypto from './lib/crypto';
import * as bitwarden from './lib/bitwarden';

export const bitwardenHandler = async (event, context, callback) => {
  console.log('Bitwarden import handler triggered', JSON.stringify(event, null, 2));

  const output = [];

  if (!event.email) {
    callback(null, 'E-mail must be supplied');
    return;
  }

  if (!event.masterPassword) {
    callback(null, 'Master password must be supplied');
    return;
  }

  if (!event.csv) {
    callback(null, 'CSV must be supplied');
    return;
  }

  const email = event.email.toLowerCase();
  let user;
  try {
    [user] = (await User.scan()
      .where('email').equals(email)
      .execAsync()).Items;
  } catch (e) {
    callback(null, 'User not found');
    return;
  }

  try {
    const passwordHash = await bitwardenCrypto.hashPasswordAsync(event.masterPassword, email);
    if (passwordHash !== user.get('passwordHash')) {
      throw new Error('Invalid password supplied');
    }

    const masterKey = await bitwardenCrypto.makeKeyAsync(event.masterPassword, user.get('email'));

    const folders = (await Folder.query(user.get('uuid')).execAsync())
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

    const savePromises = [];

    fastcsv.fromString(event.csv, { headers: true })
      .on('data', (row) => {
        if (!row.name) {
          return;
        }
        output.push('Storing ' + row.name);

        const cipher = {
          userUuid: user.get('uuid'),
          favorite: parseInt(row.favorite, 10) === 1,
        };

        if (folders[row.folder]) {
          cipher.folderUuid = folders[row.folder];
        }

        const encrypt = value =>
          bitwardenCrypto
            .encryptWithMasterPasswordKey(value, user.get('key'), masterKey)
            .toString();

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
                    setTimeout(resolve, Math.floor(Math.random() * 30));
                  }).then(() => {
                    Cipher.createAsync(cipher)
                      .then(result => ({ success: true, result, cipher }))
                      .catch(error => ({ success: false, error, cipher }));
                  });
                  toRetry.push(retryPromise);
                } else {
                  output.push(res.result);
                  console.log(res.result);
                }
              }

              const msg = 'DONE, total: ' + results.length + ', error: ' + toRetry.length;
              console.log(msg);
              output.push(msg);

              return toRetry;
            });

          console.log('Retrying ' + failedPromises + ' calls');
        }

        callback(null, output.map(JSON.stringify).join('\n'));
      });
  } catch (e) {
    console.error('Exception processing import data', e);
    callback(null, 'ERROR: ' + e);
  }
};
