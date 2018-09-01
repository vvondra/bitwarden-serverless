// Thanks to bitwarden-ruby for the test cases
import { expect } from 'chai';
import crypto from 'crypto';
import * as bitwardenCrypto from '../../src/lib/crypto';

describe('Bitwarden cipher format', function() {
  it('should make a key from a password and salt', async function() {
    const b64 = '2K4YP5Om9r5NpA7FCS4vQX5t+IC4hKYdTJN/C20cz9c=';

    let key = await bitwardenCrypto.makeKeyAsync('this is a password', 'nobody@example.com');
    expect(key.toString('base64')).to.equal(b64);

    // make sure key and salt affect it
    key = await bitwardenCrypto.makeKeyAsync('this is a password', 'nobody2@example.com')
    expect(key.toString('base64')).not.to.equal(b64);

    key = await bitwardenCrypto.makeKeyAsync('this is A password', 'nobody@example.com')
    expect(key.toString('base64')).not.to.equal(b64);
  });

  it('should make a key from a password and salt with custom iterations', async function() {
    const b64 = 'po5TVU6sC7LO6C9yexkVGESLY1iVvXrZZ9Qp3SbfFJ4=';

    let key = await bitwardenCrypto.makeKeyAsync('this is a password', 'nobody@example.com', bitwardenCrypto.KDF_PBKDF2, 10000);
    expect(key.toString('base64')).to.equal(b64);

    // make sure key and salt affect it
    key = await bitwardenCrypto.makeKeyAsync('this is a password', 'nobody2@example.com')
    expect(key.toString('base64')).not.to.equal(b64);

    key = await bitwardenCrypto.makeKeyAsync('this is A password', 'nobody@example.com')
    expect(key.toString('base64')).not.to.equal(b64);
  });

  it('should make a cipher string from a key', async function() {
    const encryptionKey = bitwardenCrypto.makeEncryptionKey(
      await bitwardenCrypto.makeKeyAsync('this is a password', 'nobody@example.com')
    );

    expect(encryptionKey).to.match(/^0\.[^|]+|[^|]+$/);
  });

  it('should hash a password', async function() {
    expect(await bitwardenCrypto.hashPasswordAsync('secret password', 'user@example.com'))
      .to.equal('VRlYxg0x41v40mvDNHljqpHcqlIFwQSzegeq+POW1ww=');
  });

  it('should hash a password with custom iterations', async function() {
    expect(await bitwardenCrypto.hashPasswordAsync('secret password', 'user@example.com', bitwardenCrypto.KDF_PBKDF2, 10000))
      .to.equal('tpd8Jm+BgCD8zrO9NBqipBJ63jnyWfRj3vu4zwppBnQ=');
  });

  it('should parse a cipher string', function() {
    const cs = bitwardenCrypto.CipherString.fromString(
      '0.u7ZhBVHP33j7cud6ImWFcw==|WGcrq5rTEMeyYkWywLmxxxSgHTLBOWThuWRD/6gVKj77+Vd09DiZ83oshVS9+gxyJbQmzXWilZnZRD/52tah1X0MWDRTdI5bTnTf8KfvRCQ='
    );

    expect(cs.type).to.equal(bitwardenCrypto.TYPE_AESCBC256_B64);
    expect(cs.iv).to.equal('u7ZhBVHP33j7cud6ImWFcw==');
    expect(cs.ciphertext).to.equal('WGcrq5rTEMeyYkWywLmxxxSgHTLBOWThuWRD/6gVKj77+Vd09DiZ83oshVS9+gxyJbQmzXWilZnZRD/52tah1X0MWDRTdI5bTnTf8KfvRCQ=');
    expect(cs.mac).to.be.null;
  });

  it('should parse a type-3 cipher string', function() {
    const cs = bitwardenCrypto.CipherString.fromString('2.ftF0nH3fGtuqVckLZuHGjg==|u0VRhH24uUlVlTZd/uD1lA==|XhBhBGe7or/bXzJRFWLUkFYqauUgxksCrRzNmJyigfw=');
    expect(cs.type).to.equal(2);
  });

  it('should encrypt and decrypt properly with AES-CBC-256', async function() {
    const plaintext = crypto.randomBytes(64);
    const iv = crypto.randomBytes(16);
    const key = await bitwardenCrypto.makeKeyAsync('foo', 'bar');
    const cipher = crypto.createCipheriv('AES-256-CBC', key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const cipherString = new bitwardenCrypto.CipherString(
      bitwardenCrypto.TYPE_AESCBC256_B64,
      iv.toString('base64'),
      ciphertext.toString('base64'),
    ).toString();

    expect(bitwardenCrypto.decrypt(cipherString.toString(), key).toString('utf-8'))
      .to.equal(plaintext.toString('utf-8'));
  });

  it('should encrypt and decrypt properly with AES-CBC-256 + HMAC', async function() {
    const key = await bitwardenCrypto.makeKeyAsync('password', 'user@example.com');
    const encryptionkey = bitwardenCrypto.makeEncryptionKey(key);
    const ciphertext = bitwardenCrypto.encrypt(
      'hi there',
      encryptionkey
    );

    const cipherstring = bitwardenCrypto.CipherString.fromString(ciphertext.toString())

    expect(bitwardenCrypto.decrypt(cipherstring.toString(), encryptionkey).toString('utf-8'))
      .to.equal('hi there');
  });

  it('should test mac equality', function() {
    expect(bitwardenCrypto.macsEqual('asdfasdfasdf', 'hi', 'hi')).to.be.truthy;
  });

  it('should encrypt and decrypt with encryption key encrypted by master key', async function() {
    const data = 'hi hello';
    const key = await bitwardenCrypto.makeKeyAsync('password', 'user@example.com');
    const encryptionkey = bitwardenCrypto.makeEncryptionKey(key);

    const cipherstring = bitwardenCrypto.encryptWithMasterPasswordKey(data, encryptionkey, key);
    expect(bitwardenCrypto.decryptWithMasterPasswordKey(cipherstring.toString(), encryptionkey, key)).to.equal(data);

  });

  it('should decrypt data enciphered by the web extension', async function() {
    const cipherstring = '2.suREeHFnBh8h7sl7O7nI9Q==|y6AxZmX+tHkp5yPBEW3r4A==|a/cQ3u8/uln+TrYo+9nu8JstQJ3EqTcxBvH/y32sQz8=';
    const userKey = '0.h1HHLDCl9buG9wwP5Sul4g==|RJJchodNEdivYf9O369rJCX80tNnZlkccNvbd9frLhcPqBT1OOHWFhENpC7DcWfzf7PW+Cb1xmbRNlICYuxccz67kHV+SalbCO7Fq6JHcCE=';

    const key = await bitwardenCrypto.makeKeyAsync('importer', 'import2@ameeck.net');

    expect(bitwardenCrypto.decryptWithMasterPasswordKey(cipherstring, userKey, key)).to.equal('sloška');
  });
});
