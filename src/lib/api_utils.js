export function normalizeBody(body) {
  const normalized = {};
  Object.keys(body).forEach((key) => {
    normalized[key.toLowerCase()] = body[key];
  });

  return normalized;
}

export const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'Content-Type,Authorization,Accept,Device-type,Pragma',
};

export function validationError(message) {
  console.log('Validation error', { message });
  return {
    statusCode: 400,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      ValidationErrors: {
        '': [
          message,
        ],
      },
      Object: 'error',
    }),
  };
}

export function serverError(message, error) {
  console.log('Server error', { message, error });
  return {
    statusCode: 500,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      Message: message,
      Object: 'error',
    }),
  };
}
