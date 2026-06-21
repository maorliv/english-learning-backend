const prisma = require('../prisma/client');

async function getAllWarmUpGrammar() {
  return prisma.warmUpExercise.findMany();
}

async function getWarmUpGrammarById(id) {
  return prisma.warmUpExercise.findUnique({ where: { exerciseId: Number(id) } });
}

/** Returns a random subset of warm-up exercises for a lesson, optionally filtered by difficulty. */
async function getWarmUpGrammarByLessonId(lessonId, difficulty, limit = 5) {
  const where = { lessonId: Number(lessonId) };
  if (difficulty) where.difficulty = difficulty.toUpperCase();

  const exercises = await prisma.warmUpExercise.findMany({ where });

  return exercises
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);
}

/** Returns a random subset of warm-up exercises for a grammar rule, optionally filtered by difficulty. */
async function getWarmUpGrammarByGrammarRuleId(grammarRuleId, difficulty, limit = 5) {
  const where = { grammarRuleId };
  if (difficulty) where.difficulty = difficulty.toUpperCase();

  const exercises = await prisma.warmUpExercise.findMany({ where });

  return exercises
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);
}

async function createWarmUpGrammar(data) {
  return prisma.warmUpExercise.create({
    data: {
      lessonId: Number(data.lessonId),
      grammarRuleId: data.grammarRuleId,
      type: data.type,
      instruction: data.instruction,
      content: data.content,
      options: data.options,
      correctAnswer: data.correctAnswer,
      difficulty: data.difficulty,
    },
  });
}

async function updateWarmUpGrammarById(id, data) {
  try {
    return await prisma.warmUpExercise.update({
      where: { exerciseId: Number(id) },
      data: {
        type: data.type,
        instruction: data.instruction,
        content: data.content,
        options: data.options,
        correctAnswer: data.correctAnswer,
        difficulty: data.difficulty,
      },
    });
  } catch (error) {
    if (error.code === 'P2025') return null;
    throw error;
  }
}

async function deleteWarmUpGrammarById(id) {
  try {
    return await prisma.warmUpExercise.delete({ where: { exerciseId: Number(id) } });
  } catch (error) {
    if (error.code === 'P2025') return null;
    throw error;
  }
}

module.exports = {
  getAllWarmUpGrammar,
  getWarmUpGrammarById,
  getWarmUpGrammarByLessonId,
  getWarmUpGrammarByGrammarRuleId,
  createWarmUpGrammar,
  updateWarmUpGrammarById,
  deleteWarmUpGrammarById,
};
