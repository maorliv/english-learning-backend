const { sendSuccess } = require('../utils/response');
const { createHttpError, withErrorHandling } = require('../utils/httpError');
const { validateIdParam, validateRequiredFields } = require('../utils/validators');
const { createProgressRecord } = require('../models/progress.model');
const { createSettingsRecord } = require('../models/settings.model');
const { createTeacherProfile } = require('../models/teachers.model');
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
const registerUser = withErrorHandling((req, res) => {
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
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      requiredFieldsValidation.message,
      requiredFieldsValidation.details
    );
  }

  // 409 Conflict — prevent duplicate accounts for the same email
  if (getUserByEmail(email)) {
    throw createHttpError(409, 'EMAIL_ALREADY_EXISTS', 'Email already exists', {
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

  // Settings record is created for every user regardless of role.
  createSettingsRecord(newUser.userID, firstName, lastName, email);

  // Automatically create a blank progress record for new students.
  // Level starts as null and is set after the AI assessment is completed.
  if (userRole === 'student') {
    createProgressRecord(newUser.userID);
  }

  // Automatically create a blank teacher profile for new teachers.
  // All professional fields are null until the teacher completes profile setup.
  if (userRole === 'teacher') {
    createTeacherProfile(newUser.userID, firstName, lastName);
  }

  // Return only public-safe fields (never return the password)
  return sendSuccess(res, 201, {
    userId: newUser.userID,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    userRole: newUser.role,
  });
});

/** GET /api/users — Returns the full list of all users. Restricted to admin. */
const listUsers = withErrorHandling((req, res) => {
  return sendSuccess(res, 200, getAllUsers());
});

/**
 * GET /api/users/:id
 * Returns a single user by their numeric ID.
 * req.params.id is always a string from the URL, so it is validated and converted to a number.
 */
const getUser = withErrorHandling((req, res) => {
  const validatedId = validateIdParam(req.params.id, 'id'); // req.params.id — the :id segment from the URL

  if (!validatedId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedId.message,
      validatedId.details
    );
  }

  const user = getUserById(validatedId.value);

  if (!user) {
    throw createHttpError(404, 'USER_NOT_FOUND', 'User not found', {
      userID: validatedId.value,
    });
  }

  return sendSuccess(res, 200, user);
});

/**
 * PUT /api/users/:id
 * Updates a user's firstName and lastName only.
 * Role changes are not permitted — any request that includes a userRole differing from
 * the user's current role is rejected with 400.
 * Only admin can update any user; a user can also update their own profile (allowSelf in routes).
 */
const updateUser = withErrorHandling((req, res) => {
  const { firstName, lastName, userRole } = req.body;
  const validatedId = validateIdParam(req.params.id, 'id');
  const requiredFieldsValidation = validateRequiredFields(req.body, [
    'firstName',
    'lastName',
  ]);

  if (!validatedId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedId.message,
      validatedId.details
    );
  }

  if (!requiredFieldsValidation.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      requiredFieldsValidation.message,
      requiredFieldsValidation.details
    );
  }

  const existingUser = getUserById(validatedId.value);

  if (!existingUser) {
    throw createHttpError(404, 'USER_NOT_FOUND', 'User not found', {
      userID: validatedId.value,
    });
  }

  // Reject any attempt to change the user's role
  if (userRole !== undefined && userRole !== existingUser.role) {
    throw createHttpError(
      400,
      'ROLE_CHANGE_NOT_ALLOWED',
      'Changing a user\'s role is not permitted.'
    );
  }

  const updatedUser = updateUserById(validatedId.value, {
    firstName,
    lastName,
    userRole: existingUser.role, // Always preserve the existing role
  });

  return sendSuccess(res, 200, {
    userId: updatedUser.userID,
  });
});

/**
 * DELETE /api/users/:id
 * Removes a user from the in-memory store by their numeric ID.
 * Restricted to admin. Admin accounts cannot be deleted.
 */
const deleteUser = withErrorHandling((req, res) => {
  const validatedId = validateIdParam(req.params.id, 'id');

  if (!validatedId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedId.message,
      validatedId.details
    );
  }

  const targetUser = getUserById(validatedId.value);

  if (!targetUser) {
    throw createHttpError(404, 'USER_NOT_FOUND', 'User not found', {
      userID: validatedId.value,
    });
  }

  if (targetUser.role === 'admin') {
    throw createHttpError(
      403,
      'CANNOT_DELETE_ADMIN',
      'Admin accounts cannot be deleted.'
    );
  }

  const deletedUser = deleteUserById(validatedId.value);

  return sendSuccess(res, 200, {
    userId: deletedUser.userID,
  });
});

/**
 * GET /api/users/me
 * Returns the profile of the currently logged-in user.
 * Reads the user's ID from the x-user-id request header (set by the frontend after login).
 * Returns 400 if the header is missing, 404 if the user no longer exists.
 */
const getMe = withErrorHandling((req, res) => {
  const userId = req.header('x-user-id');

  if (!userId) {
    throw createHttpError(400, 'MISSING_HEADER', 'x-user-id header is required');
  }

  const user = getUserById(userId);

  if (!user) {
    throw createHttpError(404, 'USER_NOT_FOUND', 'User not found', { userId });
  }

  return sendSuccess(res, 200, user);
});

module.exports = {
  registerUser,
  listUsers,
  getMe,
  getUser,
  updateUser,
  deleteUser,
};