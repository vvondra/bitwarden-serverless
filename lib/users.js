import docClient from 'aws-sdk/lib/dynamodb/document_client';
import bufferEq from 'buffer-equal-constant-time';
import uuidv4 from 'uuid/v4';

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

  return new Promise((resolve, reject) => {
    docClient.scan(params, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      if (data.Count > 0) {
        resolve(new User(data.Items[0]));
      } else {
        resolve(null);
      }
    });
  })
}

export function createUser(body) {
  const params = {
    TableName: tableName,
    Item: buildUser(body)
  };

  return new Promise((resolve, reject) => {
    docClient.put(params, (err, data) => {
      if (err) {
        console.error("Error writing user", { err });
        reject(err);
        return;
      }

      console.info("New user created", { data });

      resolve(data);
    });
  });
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