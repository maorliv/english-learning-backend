const { sendError } = require('../utils/response');

function notFound(req, res) {
  return sendError(res, 404, 'NOT_FOUND', 'Route not found', {
    method: req.method,
    originalUrl: req.originalUrl,
  });
}

module.exports = notFound;