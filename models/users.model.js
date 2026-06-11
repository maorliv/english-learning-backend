const { users } = require('./store');

/** Returns the full list of all users. */
function getAllUsers() {
  return users;
}

/**
 * Finds a user by their numeric userID.
 * String comparison is used to handle cases where IDs may be numbers or strings.
 */
function getUserById(id) {
  return users.find((user) => String(user.userID) === String(id)) || null;
}

/**
 * Finds a user by their email address (case-insensitive).
 * Used during login and registration to check for duplicates.
 */
function getUserByEmail(email) {
  return users.find((user) => user.email.toLowerCase() === String(email).toLowerCase()) || null;
}

/**
 * Creates a new user and appends it to the in-memory array.
 * The new user's ID is one greater than the current highest ID.
 *
 * @param {object} userData - Must include: firstName, lastName, email, password, userRole, sex
 * @returns {object} The newly created user object
 */
function createUser(userData) {
  // Compute the next ID by finding the current maximum
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
    role: userData.userRole, // Stored as 'role' internally but received as 'userRole' from the request
    createDate: timestamp,
    updateDate: timestamp,
    sex: userData.sex,
  };

  users.push(newUser); // Mutate the in-memory array directly

  return newUser;
}

/**
 * Updates a user's name and role by their ID.
 * Returns the updated user object, or null if not found.
 */
function updateUserById(id, userData) {
  const user = getUserById(id);

  if (!user) {
    return null;
  }

  // Mutate the object directly — works because require() caches the same array reference
  user.firstName = userData.firstName;
  user.lastName = userData.lastName;
  user.role = userData.userRole;
  user.updateDate = new Date().toISOString();

  return user;
}

/**
 * Removes a user from the in-memory array by their ID.
 * Returns the deleted user object, or null if not found.
 */
function deleteUserById(id) {
  const userIndex = users.findIndex((user) => String(user.userID) === String(id));

  if (userIndex === -1) {
    return null;
  }

  // splice(index, 1) removes one element and returns it as an array; destructure to get the element
  const [deletedUser] = users.splice(userIndex, 1);

  return deletedUser;
}

// Export all model functions so controllers can import them
module.exports = {
  getAllUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUserById,
  deleteUserById,
};