import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import omit from 'lodash/omit';
import {
  User,
  Cipher
} from './lib/models';
import {
  TYPE_LOGIN,
  TYPE_NOTE,
  TYPE_CARD,
  TYPE_IDENTITY
} from  './lib/bitwarden';

export const migrateHandler = async (event, context, callback) => {
  console.log('Data migration handler triggered', JSON.stringify(event, null, 2));

  let ciphers;
  try {
    ciphers = (await Cipher.scan().execAsync()).Items;
  } catch (e) {
    callback(null, 'Server error loading vault items ' + e.message);
    return;
  }

  let i = 0;
  ciphers.forEach(async (cipher) => {
    const version = cipher.get('version');
    console.log("Checking cipher " + cipher.get('uuid') + ' with version ' + version);
    switch (version) {
      case 1:
        // up-to-date
        console.log("Already up-to-date")
        break;
      default:
        i = i + 1;
        const fields = {
          version: 1,
        };
        const data = cipher.get('data');

        if (data) {
          fields.name = data.Name || null;
          fields.notes = data.Notes || null;
          fields.fields = data.Fields || null;
          if (cipher.get('type') == TYPE_LOGIN) {
            fields.login = {
              Uris: {
                Uri: data.Uri,
                Match: null
              }
            };
          }

          const fmap = {
            [TYPE_LOGIN]: "login",
            [TYPE_NOTE]: "securenote",
            [TYPE_CARD]: "card",
            [TYPE_IDENTITY]: "identity",
          }

          fields[fmap[cipher.get('type')]] = omit(data, ['Name', 'Notes', 'Fields', 'Uri']);
        }

        console.log("Updating with fields", fields);
        cipher.set(fields);
        const wait = await cipher.updateAsync();
        break;
    }
  });

  callback(null, 'Migrated ' + i + ' ciphers.');
};