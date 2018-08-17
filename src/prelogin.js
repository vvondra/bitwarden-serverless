export const handler = async (event, context, callback) => {
  callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      Kdf: 0,
      KdfIterations: 5000,
    }),
  });
};
