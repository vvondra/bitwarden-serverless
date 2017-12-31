import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { User } from './lib/models';

export const setupHandler = async (event, context, callback) => {
  console.log('2FA setup handler triggered', JSON.stringify(event, null, 2));

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

  try {
    const secret = speakeasy.generateSecret();

    user.set({ totpSecretTemp: secret.base32 });
    await user.updateAsync();

    const code = await qrcode.toDataURL(secret.otpauth_url);

    callback(null, code);
  } catch (e) {
    callback(null, 'ERROR: ' + e);
  }
};

export const completeHandler = async (event, context, callback) => {
  console.log('2FA complete handler triggered', JSON.stringify(event, null, 2));

  if (!event.email) {
    callback(null, 'E-mail must be supplied');
    return;
  }

  if (!event.code) {
    callback(null, 'Verification code must be supplied');
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
    callback(null, 'ERROR: ' + e);
  }
};
