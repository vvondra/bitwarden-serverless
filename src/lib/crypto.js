import crypto from 'crypto';

export const TYPE_AESCBC256_B64 = 0;
export const TYPE_AESCBC128_HMACSHA256_B64 = 1;
export const TYPE_AESCBC256_HMACSHA256_B64 = 2;
export const TYPE_RSA2048_OAEPSHA256_B64 = 3;
export const TYPE_RSA2048_OAEPSHA1_B64 = 4;
export const TYPE_RSA2048_OAEPSHA256_HMACSHA256_B64 = 5;
export const TYPE_RSA2048_OAEPSHA1_HMACSHA256_B64 = 6;

/**
 * Bitwarden format of storing ciphers
 */
export class CipherString {
  constructor(type, iv, ciphertext, mac = null) {
    this.type = type;
    this.iv = iv;
    this.ciphertext = ciphertext;
    this.mac = mac;
  }

  static fromString(string) {
    const match = string.match(/^(\d)\.([^|]+)\|(.+)$/);

    if (!match) {
      throw new Error('Invalid CipherString: ' + string);
    }

    const type = parseInt(match[1], 10);
    const iv = match[2];
    const [ciphertext, mac] = match[3].split('|', 2);

    return new CipherString(type, iv, ciphertext, mac);
  }

  toString() {
    return [this.type + '.' + this.iv, this.ciphertext, this.mac]
      .filter(v => !!v)
      .join('|');
  }
}

export async function makeKey(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 5000, 256 / 8, 'sha256', (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(derivedKey);
    });
  });
}

export async function hashPassword(password, salt) {
  const key = await makeKey(password, salt);

  return new Promise((resolve, reject) => {
    crypto.pbkdf2(key, salt, 1, 256 / 8, 'sha256', (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(derivedKey.toString('base64'));
    });
  });
}

export async function encrypt(plaintext, key, macKey) {
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv('AES-256-CB', key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const mac = crypto.createHmac('sha256', macKey)
    .update(iv)
    .update(ciphertext)
    .digest();

  return new CipherString(
    TYPE_AESCBC256_HMACSHA256_B64,
    iv.toString('base64'),
    ciphertext.toString('base64'),
    mac.toString('base64'),
  );
}
