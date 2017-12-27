import * as AWS from 'aws-sdk';
import * as utils from './lib/api_utils';
import { findUserByEmail, createUser } from './lib/users';

const docClient = new AWS.DynamoDB.DocumentClient();

export const handler = async (event, context, callback) => {
  console.log('Registration handler triggered', JSON.stringify(event, null, 2));
  if (!event.body) {
    callback(null, utils.validationError("Bad request"));
    return;
  }

  const body = JSON.parse(event.body);

  if (!body.masterPasswordHash) {
    callback(null, utils.validationError("masterPasswordHash cannot be blank"));
    return;
  }

  if (!/^.+@.+\..+$/.test(body.email)) {
    callback(null, utils.validationError("supply a valid e-mail"));
    return;
  }

  if (!/^0\..+\|.+/.test(body.key)) {
    callback(null, utils.validationError("supply a valid key"));
    return;
  }

  try {
    const existingUser = await findUserByEmail(body.email);

    if (existingUser) {
      callback(null, utils.validationError("E-mail already taken"));
      return;
    }

    const user = await createUser(body);

    callback(null, {
      statusCode: 200,
      body: ""
    });
  } catch (e) {
    callback(null, utils.serverError(e));
  }
}; 