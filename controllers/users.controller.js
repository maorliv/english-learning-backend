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

  return sendSuccess(res, 201, {
    userId: newUser.userID,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    userRole: newUser.role,
  });
}

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

  if (!user || user.password !== password) {
    return sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password', {
      email,
    });
  }

  return sendSuccess(res, 200, {
    userId: user.userID,
    userRole: user.role,
    token: `mock-token-user-${user.userID}`,
  });
}

function listUsers(req, res) {
  return sendSuccess(res, 200, getAllUsers());
}

function getUser(req, res) {
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

  const user = getUserById(validatedId.value);

  if (!user) {
    return sendError(res, 404, 'USER_NOT_FOUND', 'User not found', {
      userID: validatedId.value,
    });
  }

  return sendSuccess(res, 200, user);
}

function updateUser(req, res) {
  const { firstName, lastName, userRole } = req.body;
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