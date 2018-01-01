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

export async function makeKeyAsync(password, salt) {
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

export function makeEncryptionKey(key) {
  const plaintext = crypto.randomBytes(64);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv('AES-256-CBC', key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  return new CipherString(
    TYPE_AESCBC256_B64,
    iv.toString('base64'),
    ciphertext.toString('base64'),
  ).toString();
}

export async function hashPasswordAsync(password, salt) {
  const key = await makeKeyAsync(password, salt);

  return new Promise((resolve, reject) => {
    crypto.pbkdf2(key, password, 1, 256 / 8, 'sha256', (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(derivedKey.toString('base64'));
    });
  });
}

export function encrypt(plaintext, key, macKey) {
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv('AES-256-CBC', key, iv);

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

export function decrypt(rawString, key, macKey) {
  const cipherString = CipherString.fromString(rawString);
  const iv = Buffer.from(cipherString.iv, 'base64');
  const ciphertext = Buffer.from(cipherString.ciphertext, 'base64');
  const mac = cipherString.mac ? Buffer.from(cipherString.mac, 'base64') : null;

  switch (cipherString.type) {
    case TYPE_AESCBC256_B64: {
      const cipher = crypto.createDecipheriv('AES-256-CBC', key, iv);
      return Buffer.concat([
        cipher.update(ciphertext),
        cipher.final(),
      ]).toString('utf-8');
    }
    case TYPE_AESCBC256_HMACSHA256_B64: {
      const cipherMac = crypto.createHmac('sha256', macKey)
        .update(iv)
        .update(ciphertext)
        .digest();

      if (!macsEqual(macKey, mac, cipherMac)) {
        throw new Error('Invalid cipher mac');
      }

      const cipher = crypto.createDecipheriv('AES-256-CBC', key, iv);
      return Buffer.concat([
        cipher.update(ciphertext),
        cipher.final(),
      ]).toString('utf-8');
    }
    default:
      throw new Error('Unimplemented cipher for decryption: ' + cipherString.type);
  }
}

export function macsEqual(macKey, left, right) {
  const leftMac = crypto.createHmac('sha256', macKey)
    .update(left)
    .digest('hex');

  const rightMac = crypto.createHmac('sha256', macKey)
    .update(right)
    .digest('hex');

  return leftMac === rightMac;
}
