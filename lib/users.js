import * as AWS from 'aws-sdk';
import bufferEq from 'buffer-equal-constant-time';
import uuidv4 from 'uuid/v4';

const docClient = new AWS.DynamoDB.DocumentClient();
const usersTableName = process.env.USERS_TABLE;

export class User {
  construct(props) {
    this.props = props;
  }

  matchesPasswordHash(hash) {
    return this.props.password_hash && bufferEq(new Buffer(hash, this.props.password_hash));
  }
}
/**
 * @param {String} email 
 * @return {User}
 */
export function findUserByEmail(email) {
  const params = {
    TableName: usersTableName,
    FilterExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': email.toLowerCase() }
  };

  return docClient.scan(params).promise()
    .then((data) => {
      if (data.Count > 0) {
        return new User(data.Items[0]);
      } else {
        return null;
      }
    });
}

export function createUser(body) {
  const params = {
    TableName: usersTableName,
    Item: buildUser(body)
  };

  return docClient.put(params).promise();
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