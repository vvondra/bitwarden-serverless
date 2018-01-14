
export const handler = (event, context, callback) => {
  console.log('Icon handler triggered', JSON.stringify(event, null, 2));

  callback(null, {
    statusCode: 302,
    headers: {
      Location: 'https://' + event.pathParameters.domain + '/favicon.ico',
    },
  });
};
