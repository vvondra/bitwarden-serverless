import * as AWS  from 'aws-sdk';
import * as utils from './lib/api_utils';
import uuidv4 from 'uuid/v4';

const docClient = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.USERS_TABLE;

export const handler = (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
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

  findUserByEmail(body.email).then((items) => {
    if (items.length > 0) {
      callback(null, utils.validationError("E-mail already taken"));
      return;
    }

    const params = {
      TableName: tableName,
      Item: buildUser(body)
    };
  
    docClient.put(params, (err, data) => {
      if (err)  {
        console.error("Error writing user", { err });
        callback(err);
        return;
      }
  
      console.info("New user created", { data });

      callback(null, {
        statusCode: 200,
        body: ""
      });
    });
  }).catch((err) => {
    callback(err);
  });
}; 

function findUserByEmail(email) {
  const params = {
    TableName: tableName,
    FilterExpression: 'email = :email',
    ExpressionAttributeValues: {':email': email}
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
    uuid: uuidv4(),
    email: body.email.toLowerCase(),
    password_hash: body.masterPasswordHash,
    password_hint: body.masterPasswordHint,
    key: body.key,
    culture: 'en-US', // Hard-coded unless supplied from elsewhere
    premium: true,
  };
};