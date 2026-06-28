const { sendSuccess } = require('../utils/response');
const { createHttpError, withErrorHandling } = require('../utils/httpError');
const settingsService = require('../services/settings.service');
const prisma = require('../prisma/client');

const getSettings = withErrorHandling(async (req, res) => {
  const userId = req.header('x-user-id');
  if (!userId) throw createHttpError(400, 'MISSING_HEADER', 'x-user-id header is required');

  const record = await settingsService.getSettingsByUserId(userId);
  if (!record) throw createHttpError(404, 'SETTINGS_NOT_FOUND', 'Settings not found for this user', { userId });

  return sendSuccess(res, 200, record);
});

const updateSettings = withErrorHandling(async (req, res) => {
  const userId = req.header('x-user-id');
  if (!userId) throw createHttpError(400, 'MISSING_HEADER', 'x-user-id header is required');

  const { displayName, email, theme } = req.body;
  const hasUpdates = [displayName, email, theme].some(v => v !== undefined && v !== null && v !== '');
  if (!hasUpdates) throw createHttpError(400, 'VALIDATION_ERROR', 'At least one of displayName, email, or theme must be provided');

  const updated = await settingsService.updateSettingsByUserId(userId, { displayName, email, theme });
  if (!updated) throw createHttpError(404, 'SETTINGS_NOT_FOUND', 'Settings not found for this user', { userId });

  if (email) {
    await prisma.user.update({
      where: { userID: Number(userId) },
      data: { email: email.toLowerCase() },
    });
  }

  return sendSuccess(res, 200, updated);
});

module.exports = { getSettings, updateSettings };
