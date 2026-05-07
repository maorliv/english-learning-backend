const { sendError, sendSuccess } = require('../utils/response');
const { validateIdParam } = require('../utils/validators');
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
  const missingFields = [
    'firstName',
    'lastName',
    'email',
    'password',
    'userRole',
    'sex',
  ].filter((field) => !req.body[field]);

  if (missingFields.length > 0) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Missing required fields', {
      missingFields,
    });
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
  const missingFields = ['firstName', 'lastName', 'userRole'].filter(
    (field) => !req.body[field]
  );

  if (!validatedId.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      validatedId.message,
      validatedId.details
    );
  }

  if (missingFields.length > 0) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Missing required fields', {
      missingFields,
    });
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
  listUsers,
  getUser,
  updateUser,
  deleteUser,
};