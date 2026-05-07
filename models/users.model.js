const users = require('./data/users.json');

function getAllUsers() {
  return users;
}

function getUserById(id) {
  return users.find((user) => String(user.userID) === String(id)) || null;
}

function getUserByEmail(email) {
  return users.find((user) => user.email.toLowerCase() === String(email).toLowerCase()) || null;
}

function createUser(userData) {
  const nextUserId = users.reduce((maxUserId, user) => {
    return Math.max(maxUserId, Number(user.userID) || 0);
  }, 0) + 1;

  const timestamp = new Date().toISOString();
  const newUser = {
    userID: nextUserId,
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    password: userData.password,
    role: userData.userRole,
    createDate: timestamp,
    updateDate: timestamp,
    sex: userData.sex,
  };

  users.push(newUser);

  return newUser;
}

function updateUserById(id, userData) {
  const user = getUserById(id);

  if (!user) {
    return null;
  }

  user.firstName = userData.firstName;
  user.lastName = userData.lastName;
  user.role = userData.userRole;
  user.updateDate = new Date().toISOString();

  return user;
}

function deleteUserById(id) {
  const userIndex = users.findIndex((user) => String(user.userID) === String(id));

  if (userIndex === -1) {
    return null;
  }

  const [deletedUser] = users.splice(userIndex, 1);

  return deletedUser;
}

module.exports = {
  getAllUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUserById,
  deleteUserById,
};