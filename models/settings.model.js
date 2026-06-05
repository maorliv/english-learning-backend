// In-memory data store — loaded from JSON at startup, reset when the server restarts
const settings = require('./data/settings.json');

/**
 * Finds the settings record for a given user ID.
 * Returns null if no settings exist for that user.
 */
function getSettingsByUserId(userId) {
  return settings.find((s) => String(s.userId) === String(userId)) || null;
}

/**
 * Updates the settings for a given user.
 * Only updates the fields provided — other fields remain unchanged.
 * Returns the updated settings object, or null if not found.
 *
 * @param {number|string} userId
 * @param {{ displayName?: string, email?: string, theme?: string }} updates
 */
function updateSettingsByUserId(userId, updates) {
  const record = settings.find((s) => String(s.userId) === String(userId));

  if (!record) return null;

  if (updates.displayName !== undefined) record.displayName = updates.displayName;
  if (updates.email !== undefined) record.email = updates.email;
  if (updates.theme !== undefined) record.theme = updates.theme;

  return record;
}

module.exports = { getSettingsByUserId, updateSettingsByUserId };
