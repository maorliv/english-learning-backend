const { sendError } = require('../utils/response');

/**
 * Catch-all middleware for unmatched routes.
 * Registered after all routers in index.js so it only runs if no route handled the request.
 * Returns a 404 error with the attempted method and URL for easier debugging.
 */
function notFound(req, res) {
  return sendError(res, 404, 'NOT_FOUND', 'Route not found', {
    method: req.method,
    originalUrl: req.originalUrl, // The full URL that was requested
  });
}

module.exports = notFound;