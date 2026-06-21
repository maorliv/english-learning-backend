const { sendSuccess } = require('../utils/response');
const { createHttpError, withErrorHandling } = require('../utils/httpError');
const { validateRequiredFields } = require('../utils/validators');
const usersService = require('../services/users.service');

const loginUser = withErrorHandling(async (req, res) => {
  const { email, password } = req.body;
  const requiredFieldsValidation = validateRequiredFields(req.body, [
    'email',
    'password',
  ]);

  if (!requiredFieldsValidation.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      requiredFieldsValidation.message,
      requiredFieldsValidation.details
    );
  }

  const user = await usersService.getUserByEmail(email);

  // 401 Unauthorized — wrong email or wrong password (same message to avoid info leakage)
  if (!user || user.password !== password) {
    throw createHttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password', {
      email,
    });
  }

  return sendSuccess(res, 200, {
    userId: user.userID,
    userRole: user.role,
    token: `mock-token-user-${user.userID}`, // Placeholder token (no real JWT in this project)
  });
});

/**
 * POST /api/auth/logout
 * Stateless mock logout — no real session to invalidate.
 * The frontend is responsible for discarding the token client-side.
 * Returns 200 OK as confirmation.
 */
const logoutUser = withErrorHandling((req, res) => {
  return sendSuccess(res, 200, { message: 'Logged out successfully' });
});

module.exports = { loginUser, logoutUser };
