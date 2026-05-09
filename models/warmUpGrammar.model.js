const warmUpGrammar = require('./data/warmUpGrammar.json');

function getAllWarmUpGrammar() {
  return warmUpGrammar;
}

function getWarmUpGrammarByLessonId(lessonId, difficulty, limit = 5) {
  const normalizedDifficulty = difficulty ? String(difficulty).trim().toLowerCase() : null;

  const matchingExercises = warmUpGrammar
    .filter((exercise) => String(exercise.lessonId) === String(lessonId))
    .filter((exercise) => {
      if (!normalizedDifficulty) {
        return true;
      }

      return String(exercise.difficulty).trim().toLowerCase() === normalizedDifficulty;
    })
    .map((exercise) => ({
      exerciseId: exercise.exerciseId,
      type: exercise.type,
      instruction: exercise.instruction,
      content: exercise.content,
      options: exercise.options,
      difficulty: exercise.difficulty,
    }));

  return matchingExercises
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);
}

function getWarmUpGrammarById(id) {
  return warmUpGrammar.find((exercise) => String(exercise.exerciseId) === String(id)) || null;
}

function createWarmUpGrammar(exerciseData) {
  const nextExerciseId = warmUpGrammar.reduce((maxExerciseId, exercise) => {
    return Math.max(maxExerciseId, Number(exercise.exerciseId) || 0);
  }, 0) + 1;

  const newExercise = {
    exerciseId: nextExerciseId,
    lessonId: exerciseData.lessonId,
    grammarRuleId: exerciseData.grammarRuleId,
    type: exerciseData.type,
    instruction: exerciseData.instruction,
    content: exerciseData.content,
    options: exerciseData.options,
    correctAnswer: exerciseData.correctAnswer,
    difficulty: exerciseData.difficulty,
  };

  warmUpGrammar.push(newExercise);

  return newExercise;
}

function updateWarmUpGrammarById(id, exerciseData) {
  const exercise = getWarmUpGrammarById(id);

  if (!exercise) {
    return null;
  }

  exercise.type = exerciseData.type;
  exercise.instruction = exerciseData.instruction;
  exercise.content = exerciseData.content;
  exercise.options = exerciseData.options;
  exercise.correctAnswer = exerciseData.correctAnswer;
  exercise.difficulty = exerciseData.difficulty;

  return exercise;
}

function deleteWarmUpGrammarById(id) {
  const exerciseIndex = warmUpGrammar.findIndex(
    (exercise) => String(exercise.exerciseId) === String(id)
  );

  if (exerciseIndex === -1) {
    return null;
  }

  const [deletedExercise] = warmUpGrammar.splice(exerciseIndex, 1);

  return deletedExercise;
}

module.exports = {
  getAllWarmUpGrammar,
  getWarmUpGrammarByLessonId,
  getWarmUpGrammarById,
  createWarmUpGrammar,
  updateWarmUpGrammarById,
  deleteWarmUpGrammarById,
};