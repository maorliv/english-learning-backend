const prisma = require('../prisma/client');

async function getSettingsByUserId(userId) {
  return prisma.settings.findUnique({
    where: { userId: Number(userId) },
  });
}

async function updateSettingsByUserId(userId, updates) {
  const data = {};
  if (updates.displayName !== undefined) data.displayName = updates.displayName;
  if (updates.email !== undefined) data.email = updates.email;
  if (updates.theme !== undefined) data.theme = updates.theme;

  try {
    return await prisma.settings.update({
      where: { userId: Number(userId) },
      data,
    });
  } catch (error) {
    if (error.code === 'P2025') return null;
    throw error;
  }
}

module.exports = { getSettingsByUserId, updateSettingsByUserId };
