export function validationError(message) {
  console.log('Validation error', { message });
  return {
    statusCode: 400,
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

export function serverError(message) {
  console.log('Server error', { message });
  return {
    statusCode: 500,
    body: JSON.stringify({
      Message: message,
      Object: 'error',
    }),
  };
}
