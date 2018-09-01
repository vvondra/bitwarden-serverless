import omit from 'lodash/omit';
import { Cipher, User } from './lib/models';
import {
  TYPE_LOGIN,
  TYPE_NOTE,
  TYPE_CARD,
  TYPE_IDENTITY,
} from './lib/bitwarden';

export const migrateHandler = async (event, context, callback) => {
  console.log('Data migration handler triggered', JSON.stringify(event, null, 2));

  let ciphers;
  let users;
  try {
    ciphers = (await Cipher.scan().execAsync()).Items;
    users = (await User.scan().execAsync()).Items;
  } catch (e) {
    callback(null, 'Server error loading vault items ' + e.message);
    return;
  }

  let userCount = 0;
  users.forEach(async (user) => {
    const version = user.get('version');
    console.log('Checking user ' + user.get('uuid') + ' with version ' + version);
    switch (version) {
      case 2:
        console.log('Already up-to-date');
        break;
      case 1:
        userCount += 1;
        user.set({ kdfIterations: 5000, version: 2 });
        await user.updateAsync();
        break;
      default:
        userCount += 1;
        user.set({ emailVerified: true, version: 1 });
        await user.updateAsync();
        break;
    }
  });

  let cipherCount = 0;
  ciphers.forEach(async (cipher) => {
    const version = cipher.get('version');
    console.log('Checking cipher ' + cipher.get('uuid') + ' with version ' + version);
    switch (version) {
      case 1:
        // up-to-date
        console.log('Already up-to-date');
        break;
      default: {
        cipherCount += 1;
        const fields = {
          version: 1,
        };
        const data = cipher.get('data');

        if (data) {
          fields.name = data.Name || null;
          fields.notes = data.Notes || null;
          fields.fields = data.Fields || null;

          const fmap = {
            [TYPE_LOGIN]: 'login',
            [TYPE_NOTE]: 'securenote',
            [TYPE_CARD]: 'card',
            [TYPE_IDENTITY]: 'identity',
          };

          fields[fmap[cipher.get('type')]] = omit(data, ['Name', 'Notes', 'Fields', 'Uri']);

          if (cipher.get('type') === TYPE_LOGIN) {
            fields.login.Uris = [
              {
                Uri: data.Uri,
                Match: null,
              },
            ];
          }
        }

        fields.data = null;

        console.log('Updating with fields', fields);
        cipher.set(fields);
        await cipher.updateAsync();
        break;
      }
    }
  });

  callback(null, 'Migrated ' + cipherCount + ' ciphers and ' + userCount + ' users.');
};
