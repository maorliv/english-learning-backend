const { sendError, sendSuccess } = require('../utils/response');
const { validateIdParam, validateRequiredFields } = require('../utils/validators');
const {
  createUser,
  deleteUserById,
  getAllUsers,
  getUserByEmail,
  getUserById,
  updateUserById,
} = require('../models/users.model');

/**
 * POST /api/users/register
 * Creates a new user account.
 * Reads all fields from req.body. Returns the new user's ID and basic info on success.
 * Returns 400 if required fields are missing, 409 if the email is already taken.
 */
function registerUser(req, res) {
  const { firstName, lastName, email, password, userRole, sex } = req.body;
  const requiredFieldsValidation = validateRequiredFields(req.body, [
    'firstName',
    'lastName',
    'email',
    'password',
    'userRole',
    'sex',
  ]);

  if (!requiredFieldsValidation.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      requiredFieldsValidation.message,
      requiredFieldsValidation.details
    );
  }

  // 409 Conflict — prevent duplicate accounts for the same email
  if (getUserByEmail(email)) {
    return sendError(res, 409, 'EMAIL_ALREADY_EXISTS', 'Email already exists', {
      email,
    });
  }

  const newUser = createUser({
    firstName,
    lastName,
    email,
    password,
    userRole,
    sex,
  });

  // Return only public-safe fields (never return the password)
  return sendSuccess(res, 201, {
    userId: newUser.userID,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    userRole: newUser.role,
  });
}

/**
 * POST /api/users/login
 * Simulated login — checks email and password against in-memory data.
 * Returns a mock token and the user's role on success.
 * Returns 401 if credentials don't match.
 */
function loginUser(req, res) {
  const { email, password } = req.body;
  const requiredFieldsValidation = validateRequiredFields(req.body, [
    'email',
    'password',
  ]);

  if (!requiredFieldsValidation.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      requiredFieldsValidation.message,
      requiredFieldsValidation.details
    );
  }

  const user = getUserByEmail(email);

  // 401 Unauthorized — wrong email or wrong password (same message to avoid info leakage)
  if (!user || user.password !== password) {
    return sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password', {
      email,
    });
  }

  return sendSuccess(res, 200, {
    userId: user.userID,
    userRole: user.role,
    token: `mock-token-user-${user.userID}`, // Placeholder token (no real JWT in this project)
  });
}

/** GET /api/users — Returns the full list of all users. Restricted to admin. */
function listUsers(req, res) {
  return sendSuccess(res, 200, getAllUsers());
}

/**
 * GET /api/users/:id
 * Returns a single user by their numeric ID.
 * req.params.id is always a string from the URL, so it is validated and converted to a number.
 */
function getUser(req, res) {
  const validatedId = validateIdParam(req.params.id, 'id'); // req.params.id — the :id segment from the URL

  if (!validatedId.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      validatedId.message,
      validatedId.details
    );
  }

  const user = getUserById(validatedId.value);

  if (!user) {
    return sendError(res, 404, 'USER_NOT_FOUND', 'User not found', {
      userID: validatedId.value,
    });
  }

  return sendSuccess(res, 200, user);
}

/**
 * PUT /api/users/:id
 * Updates a user's firstName, lastName, and userRole.
 * Only admin can update any user; a user can also update their own profile (allowSelf in routes).
 */
function updateUser(req, res) {
  const { firstName, lastName, userRole } = req.body; // Fields allowed to be updated
  const validatedId = validateIdParam(req.params.id, 'id');
  const requiredFieldsValidation = validateRequiredFields(req.body, [
    'firstName',
    'lastName',
    'userRole',
  ]);

  if (!validatedId.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      validatedId.message,
      validatedId.details
    );
  }

  if (!requiredFieldsValidation.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      requiredFieldsValidation.message,
      requiredFieldsValidation.details
    );
  }

  const updatedUser = updateUserById(validatedId.value, {
    firstName,
    lastName,
    userRole,
  });

  if (!updatedUser) {
    return sendError(res, 404, 'USER_NOT_FOUND', 'User not found', {
      userID: validatedId.value,
    });
  }

  return sendSuccess(res, 200, {
    userId: updatedUser.userID,
  });
}

/**
 * DELETE /api/users/:id
 * Removes a user from the in-memory store by their numeric ID.
 * Restricted to admin.
 */
function deleteUser(req, res) {
  const validatedId = validateIdParam(req.params.id, 'id');

  if (!validatedId.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      validatedId.message,
      validatedId.details
    );
  }

  const deletedUser = deleteUserById(validatedId.value);

  if (!deletedUser) {
    return sendError(res, 404, 'USER_NOT_FOUND', 'User not found', {
      userID: validatedId.value,
    });
  }

  return sendSuccess(res, 200, {
    userId: deletedUser.userID,
  });
}

module.exports = {
  registerUser,
  loginUser,
  listUsers,
  getUser,
  updateUser,
  deleteUser,
};