import * as utils from './lib/api_utils';

// Need to be implemented correctly
export const handler = async (event, context, callback) => {
  console.log('Collections handler triggered', JSON.stringify(event, null, 2));

  const response = {
    Data: [],
    ContinuationToken: null,
    Object: 'list',
  };
  try {
    callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response),
    });
  } catch (e) {
    callback(null, utils.validationError(e.toString()));
  }
};
