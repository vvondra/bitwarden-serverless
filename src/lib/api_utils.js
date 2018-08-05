export function normalizeBody(body) {
  const normalized = {};
  Object.keys(body).forEach((key) => {
    normalized[key.toLowerCase()] = body[key];
  });

  return normalized;
}

export function validationError(message) {
  console.log('Validation error', { message });
  return {
    statusCode: 400,
    headers: {
      'access-control-allow-origin': '*',
    },
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
    headers: {
      'access-control-allow-origin': '*',
    },
    body: JSON.stringify({
      Message: message,
      Object: 'error',
    }),
  };
}
