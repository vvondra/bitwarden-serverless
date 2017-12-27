import * as AWS from 'aws-sdk';

const docClient = new AWS.DynamoDB.DocumentClient();
const devicesTableName = process.env.DEVICES_TABLE;

export function findDeviceByUUID(uuid) {
  const params = {
    TableName: deviceTableName,
    Key: { uuid }
  };

  return docClient.get(params).promise().then(r => r.Item);
}

export function findDeviceByRefreshToken(refreshToken) {
  const params = {
    TableName: deviceTableName,
    FilterExpression: 'refresh_token = :refresh_token',
    ExpressionAttributeValues: { ':refresh_token': refreshToken }
  };

  return docClient.scan(params).promise().then(r => r.Items);
}

export function deleteDevice(uuid) {
  const params = {
    TableName: deviceTableName,
    Key: { uuid }
  };

  return docClient.delete(params).promise();
}