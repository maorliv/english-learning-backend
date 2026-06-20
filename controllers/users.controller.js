const { sendSuccess } = require('../utils/response');
const { createHttpError, withErrorHandling } = require('../utils/httpError');
const { validateIdParam, validateRequiredFields } = require('../utils/validators');
const usersService = require('../services/users.service');

const registerUser = withErrorHandling(async (req, res) => {
  const { firstName, lastName, email, password, userRole, sex, learning_goal, mainGoal, onlineOnly } = req.body;
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

  if (await usersService.getUserByEmail(email)) {
    throw createHttpError(409, 'EMAIL_ALREADY_EXISTS', 'Email already exists', {
      email,
    });
  }

  const newUser = await usersService.registerUser({
    firstName,
    lastName,
    email,
    password,
    userRole,
    sex,
    learning_goal,
    mainGoal,
    onlineOnly,
  });

  return sendSuccess(res, 201, {
    userId: newUser.userID,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    userRole: newUser.role,
  });
});

const listUsers = withErrorHandling(async (req, res) => {
  return sendSuccess(res, 200, await usersService.getAllUsers());
});

const getUser = withErrorHandling(async (req, res) => {
  const validatedId = validateIdParam(req.params.id, 'id');

  if (!validatedId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedId.message,
      validatedId.details
    );
  }

  const user = await usersService.getUserById(validatedId.value);

  if (!user) {
    throw createHttpError(404, 'USER_NOT_FOUND', 'User not found', {
      userID: validatedId.value,
    });
  }

  return sendSuccess(res, 200, user);
});

const updateUser = withErrorHandling(async (req, res) => {
  const { firstName, lastName, userRole } = req.body;
  const validatedId = validateIdParam(req.params.id, 'id');
  const requiredFieldsValidation = validateRequiredFields(req.body, [
    'firstName',
    'lastName',
    'userRole',
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

  const updatedUser = await usersService.updateUserById(validatedId.value, {
    firstName,
    lastName,
    userRole,
  });

  if (!updatedUser) {
    throw createHttpError(404, 'USER_NOT_FOUND', 'User not found', {
      userID: validatedId.value,
    });
  }

  return sendSuccess(res, 200, {
    userId: updatedUser.userID,
  });
});

const deleteUser = withErrorHandling(async (req, res) => {
  const validatedId = validateIdParam(req.params.id, 'id');

  if (!validatedId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedId.message,
      validatedId.details
    );
  }

  const deletedUser = await usersService.deleteUserById(validatedId.value);

  if (!deletedUser) {
    throw createHttpError(404, 'USER_NOT_FOUND', 'User not found', {
      userID: validatedId.value,
    });
  }

  return sendSuccess(res, 200, {
    userId: deletedUser.userID,
  });
});

const getMe = withErrorHandling(async (req, res) => {
  const userId = req.header('x-user-id');

  if (!userId) {
    throw createHttpError(400, 'MISSING_HEADER', 'x-user-id header is required');
  }

  const user = await usersService.getUserById(userId);

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
