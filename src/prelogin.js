import * as utils from './lib/api_utils';

const KDF_PBKDF2 = 0;

export const handler = async (event, context, callback) => {
  callback(null, {
    statusCode: 200,
    headers: utils.CORS_HEADERS,
    body: JSON.stringify({
      Kdf: KDF_PBKDF2,
      KdfIterations: 5000,
    }),
  });
};
