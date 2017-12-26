import * as AWS from 'aws-sdk';

const docClient = new AWS.DynamoDB.DocumentClient();
const devicesTableName = process.env.DEVICES_TABLE;

export function findDeviceByUUID(uuid) {
  const params = {
    TableName: deviceTableName,
    Key: { uuid }
  };

  return new Promise((resolve, reject) => {
    docClient.get(params, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data.Item);
    });
  });
}

export function findDeviceByRefreshToken(refreshToken) {
  const params = {
    TableName: deviceTableName,
    FilterExpression: 'refresh_token = :refresh_token',
    ExpressionAttributeValues: { ':refresh_token': refreshToken }
  };

  return new Promise((resolve, reject) => {
    docClient.scan(params, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data.Items);
    });
  });
}

export function deleteDevice(uuid) {
  const params = {
    TableName: deviceTableName,
    Key: { uuid }
  };

  return new Promise((resolve, reject) => {
    docClient.delete(params, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(true);
    });
  })
}