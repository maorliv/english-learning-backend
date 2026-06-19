const prisma = require('../prisma/client');

async function getProgressByStudentId(studentId) {
  return prisma.progress.findUnique({
    where: { studentId: Number(studentId) },
  });
}

async function updateProgressLevel(studentId, level) {
  try {
    return await prisma.progress.update({
      where: { studentId: Number(studentId) },
      data: { currentLevel: level },
    });
  } catch (error) {
    if (error.code === 'P2025') return null;
    throw error;
  }
}

module.exports = {
  getProgressByStudentId,
  updateProgressLevel,
};
