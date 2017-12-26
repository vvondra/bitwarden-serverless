import docClient from 'aws-sdk/lib/dynamodb/document_client';

const devicesTableName = process.env.DEVICES_TABLE;

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
  })
}