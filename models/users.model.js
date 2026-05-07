const users = require('./data/users.json');

function getAllUsers() {
  return users;
}

function getUserById(id) {
  return users.find((user) => String(user.userID) === String(id)) || null;
}

module.exports = {
  getAllUsers,
  getUserById,
};