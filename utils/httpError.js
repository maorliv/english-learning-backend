function createHttpError(statusCode, code, message, details = {}) {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.code = code;
  error.details = details;

  return error;
}

function withErrorHandling(handler) {
  return async function wrappedHandler(req, res, next) {
    try {
      await Promise.resolve(handler(req, res, next));
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = {
  createHttpError,
  withErrorHandling,
};