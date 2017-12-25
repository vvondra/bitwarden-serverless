export function validationError(message) {
  console.log("Validation error", { message });
  return {
    statusCode: 400,
    body: JSON.stringify({
      "ValidationErrors": {
        "": [
          message,
        ]},
      "Object": "error"
    })
  };
}