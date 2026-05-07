const { sendError } = require('../utils/response');

function errorHandler(err, req, res, next) {
  console.error(err);

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'Unexpected server error';
  const details = err.details || {};

  return sendError(res, statusCode, code, message, details);
}

module.exports = errorHandler;