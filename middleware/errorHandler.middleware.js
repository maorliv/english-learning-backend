const { sendError } = require('../utils/response');

/**
 * Global Express error-handling middleware.
 * In Express, a function with exactly 4 parameters (err, req, res, next) is treated as an
 * error handler. It is triggered when a route or middleware calls next(err) or throws an error.
 *
 * This should be registered LAST in server.js, after all routes.
 */
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  console.error(err); // Print the full error to the server console for debugging

  // Fall back to generic 500 values if the error object does not provide specifics
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'Unexpected server error';
  const details = err.details && typeof err.details === 'object' ? err.details : {};

  return sendError(res, statusCode, code, message, details);
}

module.exports = errorHandler;