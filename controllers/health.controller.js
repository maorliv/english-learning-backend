const { sendSuccess } = require('../utils/response');

function getHealth(req, res) {
  return sendSuccess(res, 200, {
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  getHealth,
};