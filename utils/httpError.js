/** Creates an Error object enriched with statusCode, code, and details for the error-handler middleware. */
function createHttpError(statusCode, code, message, details = {}) {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.code = code;
  error.details = details;

  return error;
}

/** Wraps an async route handler so rejected promises are forwarded to Express's next(err). */
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