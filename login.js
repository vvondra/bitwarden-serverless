import * as AWS  from 'aws-sdk';
import * as utils from './lib/api_utils';

const docClient = new AWS.DynamoDB.DocumentClient();
const deviceTableName = process.env.DEVICES_TABLE;

export const handler = (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  if (!event.body) {
    callback(null, utils.validationError("Bad request"));
    return;
  }

  const body = JSON.parse(event.body);

  var device;

  switch (body.grant_type) {
    case 'password':

      break;
    case 'refresh_token':
      if (!body.refresh_token) {
        callback(null, utils.validationError("Refresh token must be supplied"));
        return;
      }

      device = findDeviceByRefreshToken(body.refresh_token);
      break;
    default:
      callback(null, utils.validationError("Unsupported grant type"));
      return;
  }
}; 

function findDeviceByRefreshToken(refreshToken) {
  const params = {
    TableName: deviceTableName,
    FilterExpression: 'refresh_token = :refresh_token',
    ExpressionAttributeValues: {':refresh_token': refreshToken}
  };
  
  return new Promise((resolve, reject) => {
    docClient.scan(params, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data.Items);
    });
  })
}

function buildUser(body) {
  return {
    email: body.email.toLowerCase(),
    password_hash: body.masterpasswordhash,
    password_hint: body.masterpasswordhint,
    key: body.key,
    culture: 'en-US', // Hard-coded unless supplied from elsewhere
    premium: true,
  };
};