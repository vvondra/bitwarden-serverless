import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import * as utils from './lib/api_utils';
import { User } from './lib/models';

export const setupHandler = async (event, context, callback) => {
  console.log('2FA setup handler triggered', JSON.stringify(event, null, 2));

  if (!event.email) {
    callback(null, utils.validationError('E-mail must be supplied'));
  }

  let user;
  try {
    [user] = (await User.scan()
      .where('email').equals(event.email.toLowerCase())
      .execAsync()).Items;
  } catch (e) {
    callback(null, utils.validationError('User not found'));
  }

  try {
    const secret = speakeasy.generateSecret();

    user.set({ totpSecretTemp: secret.base32 });
    await user.updateAsync();

    const code = await qrcode.toDataURL(secret.otpauth_url);

    callback(null, code);
  } catch (e) {
    callback(null, utils.validationError(e.toString()));
  }
};

export const completeHandler = async (event, context, callback) => {
  console.log('2FA complete handler triggered', JSON.stringify(event, null, 2));

  if (!event.email) {
    callback(null, utils.validationError('E-mail must be supplied'));
  }

  if (!event.code) {
    callback(null, utils.validationError('Verification code must be supplied'));
  }

  let user;
  try {
    [user] = (await User.scan()
      .where('email').equals(event.email.toLowerCase())
      .execAsync()).Items;
  } catch (e) {
    callback(null, utils.validationError('User not found'));
  }

  try {
    const verified = speakeasy.totp.verify({
      secret: user.get('totpSecretTemp'),
      encoding: 'base32',
      token: event.code,
    });

    if (verified) {
      user.set({
        totpSecretTemp: null,
        totpSecret: user.get('totpSecretTemp'),
        securityStamp: undefined,
      });

      await user.updateAsync();

      callback(null, 'OK, 2FA setup.');
    } else {
      callback(null, 'ERROR, Could not verify supplied code, please try again.');
    }
  } catch (e) {
    callback(null, utils.validationError(e.toString()));
  }
};
