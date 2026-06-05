const { sendSuccess } = require('../utils/response');
const { createHttpError, withErrorHandling } = require('../utils/httpError');
const { validateRequiredFields } = require('../utils/validators');
const { getSettingsByUserId, updateSettingsByUserId } = require('../models/settings.model');

/**
 * GET /api/settings
 * Returns the settings for the currently logged-in user.
 * Reads the user's ID from the x-user-id request header.
 * Returns 400 if the header is missing, 404 if no settings record exists for the user.
 */
const getSettings = withErrorHandling((req, res) => {
  const userId = req.header('x-user-id');

  if (!userId) {
    throw createHttpError(400, 'MISSING_HEADER', 'x-user-id header is required');
  }

  const record = getSettingsByUserId(userId);

  if (!record) {
    throw createHttpError(404, 'SETTINGS_NOT_FOUND', 'Settings not found for this user', {
      userId,
    });
  }

  return sendSuccess(res, 200, record);
});

/**
 * PUT /api/settings
 * Updates the settings for the currently logged-in user.
 * Reads the user's ID from the x-user-id request header.
 * Accepts: displayName, email, theme (at least one required).
 * Returns 400 if the header is missing or no updatable fields are provided.
 * Returns 404 if no settings record exists for the user.
 */
const updateSettings = withErrorHandling((req, res) => {
  const userId = req.header('x-user-id');

  if (!userId) {
    throw createHttpError(400, 'MISSING_HEADER', 'x-user-id header is required');
  }

  const { displayName, email, theme } = req.body;

  // Require at least one updatable field in the request body
  const hasUpdates = [displayName, email, theme].some(
    (v) => v !== undefined && v !== null && v !== ''
  );

  if (!hasUpdates) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      'At least one of displayName, email, or theme must be provided'
    );
  }

  const updated = updateSettingsByUserId(userId, { displayName, email, theme });

  if (!updated) {
    throw createHttpError(404, 'SETTINGS_NOT_FOUND', 'Settings not found for this user', {
      userId,
    });
  }

  return sendSuccess(res, 200, updated);
});

module.exports = { getSettings, updateSettings };
