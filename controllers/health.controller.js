const { sendSuccess } = require('../utils/response');
const { withErrorHandling } = require('../utils/httpError');

/** Returns a simple server health check response with the current timestamp. */
const getHealth = withErrorHandling((req, res) => {
  return sendSuccess(res, 200, {
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = {
  getHealth,
};