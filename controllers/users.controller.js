const { sendError, sendSuccess } = require('../utils/response');
const { getAllUsers, getUserById } = require('../models/users.model');

function listUsers(req, res) {
  return sendSuccess(res, 200, getAllUsers());
}

function getUser(req, res) {
  const user = getUserById(req.params.id);

  if (!user) {
    return sendError(res, 404, 'USER_NOT_FOUND', 'User not found', {
      userID: req.params.id,
    });
  }

  return sendSuccess(res, 200, user);
}

module.exports = {
  listUsers,
  getUser,
};