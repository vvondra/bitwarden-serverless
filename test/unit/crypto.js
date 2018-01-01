// Thanks to bitwarden-ruby for the test cases

import * as bitwardenCrypto from '../../src/lib/crypto';
import { expect } from 'chai';

describe('Bitwarden cipher format', function() {
  it('should make a key from a password and salt', async function() {
    const b64 = '2K4YP5Om9r5NpA7FCS4vQX5t+IC4hKYdTJN/C20cz9c=';

    let key = await bitwardenCrypto.makeKey('this is a password', 'nobody@example.com');
    expect(key.toString('base64')).to.equal(b64);

    // make sure key and salt affect it
    key = await bitwardenCrypto.makeKey('this is a password', 'nobody2@example.com')
    expect(key.toString('base64')).not.to.equal(b64);

    key = await bitwardenCrypto.makeKey('this is A password', 'nobody@example.com')
    expect(key.toString('base64')).not.to.equal(b64);
  });
/*
  it('should make a cipher string from a key', function() {
    cs = Bitwarden.makeEncKey(
      Bitwarden.makeKey('this is a password', 'nobody@example.com')
    )

    cs.must_match(/^0\.[^|]+|[^|]+$/)
  });
*/

  it('should hash a password', async function() {
    expect(await bitwardenCrypto.hashPassword('secret password', 'user@example.com'))
      .to.equal('VRlYxg0x41v40mvDNHljqpHcqlIFwQSzegeq+POW1ww=');
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
/*
  it('should encrypt and decrypt properly', function() {
    const ik = Bitwarden.makeKey('password', 'user@example.com')
    k = Bitwarden.makeEncKey(ik)
    j = Bitwarden.encrypt('hi there', k[0, 32], k[32, 32])

    cs = Bitwarden::CipherString.parse(j)

    ik = Bitwarden.makeKey('password', 'user@example.com')
    Bitwarden.decrypt(cs.to_s, k[0, 32], k[32, 32]).must_equal 'hi there'
  });

  it('should test mac equality', function() {
    Bitwarden.macsEqual('asdfasdfasdf', 'hi', 'hi').must_equal true
  });
*/
});
