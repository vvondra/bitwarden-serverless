import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import omit from 'lodash/omit';
import {
  User
} from './lib/models';
import {
  TYPE_LOGIN,
  TYPE_NOTE,
  TYPE_CARD,
  TYPE_IDENTITY
} from  './lib/bitwarden';

export const migrateHandler = async (event, context, callback) => {
  console.log('Data migration handler triggered', JSON.stringify(event, null, 2));

  if (!event.email) {
    callback(null, 'E-mail must be supplied');
    return;
  }

  let user;
  try {
    [user] = (await User.scan()
      .where('email').equals(event.email.toLowerCase())
      .execAsync()).Items;
  } catch (e) {
    callback(null, 'User not found');
    return;
  }

  let ciphers;
  try {
    // TODO await in parallel
    ciphers = (await Cipher.query(user.get('uuid')).execAsync()).Items;
  } catch (e) {
    callback(null, 'Server error loading vault items');
    return;
  }

  ciphers.forEach(async (cipher) => {
    const version = cipher.get('version');

    switch (version) {
      case 1:
        // up-to-date
        console.log("Already up-to-date")
        break;
      case null:
        const fields = {
          version: 1,
        };
        const data = cipher.get('data');

        if (data) {
          fields.name = data.Name;
          fields.notes = data.Notes;
          fields.fields = data.Fields;
          if (cipher.get('type') == TYPE_LOGIN) {
            fields.login = {
              Uris: {
                Uri: data.Uri,
                Match: null
              }
            };
          }
        }

        const fmap = {
          [TYPE_LOGIN]: "login",
          [TYPE_NOTE]: "securenote",
          [TYPE_CARD]: "card",
          [TYPE_IDENTITY]: "identity",
        }

        fields[fmap[cipher.get('type')]] = omit(data, ['Name', 'Notes', 'Fields', 'Uri']);

        console.log("Updating with fields", fields);
        cipher.set(fields);
        const wait = await cipher.updateAsync();
        break;
    }
  })
};