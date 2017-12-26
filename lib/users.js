import * as AWS  from 'aws-sdk';
import bufferEq from 'buffer-equal-constant-time';

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
    ExpressionAttributeValues: {':email': email.toLowerCase()}
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