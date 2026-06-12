const { warmUpGrammar } = require('./store');

/** Returns all warm-up grammar exercises (no filtering). Used by admin list endpoint. */
function getAllWarmUpGrammar() {
  return warmUpGrammar;
}

/**
 * Returns warm-up exercises for a specific lesson, optionally filtered by difficulty.
 * Results are randomly shuffled and limited to `limit` items (default 5).
 *
 * @param {number|string} lessonId
 * @param {string}        [difficulty] - e.g. 'easy', 'medium', 'hard'
 * @param {number}        [limit=5]    - Maximum number of exercises to return
 */
function getWarmUpGrammarByLessonId(lessonId, difficulty, limit = 5) {
  const normalizedDifficulty = difficulty ? String(difficulty).trim().toLowerCase() : null;

  const matchingExercises = warmUpGrammar
    .filter((exercise) => String(exercise.lessonId) === String(lessonId))
    .filter((exercise) => {
      if (!normalizedDifficulty) {
        return true; // No difficulty filter — include all exercises for this lesson
      }

      return String(exercise.difficulty).trim().toLowerCase() === normalizedDifficulty;
    })
    .map((exercise) => ({
      exerciseId: exercise.exerciseId,
      type: exercise.type,
      instruction: exercise.instruction,
      content: exercise.content,
      options: exercise.options,
      correctAnswer: exercise.correctAnswer,
      difficulty: exercise.difficulty,
    }));

  // Shuffle randomly and return only the requested number of exercises
  return matchingExercises
    .sort(() => Math.random() - 0.5) // Fisher-Yates-style shuffle via random comparator
    .slice(0, limit);
}

/**
 * Returns warm-up exercises for a specific grammar rule, optionally filtered by difficulty.
 * Results are randomly shuffled and limited to `limit` items (default 5).
 *
 * @param {string}        grammarRuleId - e.g. 'present_simple'
 * @param {string}        [difficulty]  - e.g. 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'
 * @param {number}        [limit=5]     - Maximum number of exercises to return
 */
function getWarmUpGrammarByGrammarRuleId(grammarRuleId, difficulty, limit = 5) {
  const normalizedDifficulty = difficulty ? String(difficulty).trim().toLowerCase() : null;

  const matchingExercises = warmUpGrammar
    .filter((exercise) => exercise.grammarRuleId === grammarRuleId)
    .filter((exercise) => {
      if (!normalizedDifficulty) return true;
      return String(exercise.difficulty).trim().toLowerCase() === normalizedDifficulty;
    })
    .map((exercise) => ({
      exerciseId: exercise.exerciseId,
      type: exercise.type,
      instruction: exercise.instruction,
      content: exercise.content,
      options: exercise.options,
      correctAnswer: exercise.correctAnswer,
      difficulty: exercise.difficulty,
    }));

  return matchingExercises
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);
}

/** Finds a warm-up exercise by its numeric ID. Returns null if not found. */
function getWarmUpGrammarById(id) {
  return warmUpGrammar.find((exercise) => String(exercise.exerciseId) === String(id)) || null;
}

/**
 * Creates a new warm-up exercise and appends it to the in-memory array.
 * The new exercise's ID is one greater than the current maximum exerciseId.
 */
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

/**
 * Replaces the editable fields of a warm-up exercise.
 * Returns the updated exercise, or null if not found.
 */
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

/**
 * Removes a warm-up exercise by its numeric ID.
 * Returns the deleted exercise, or null if not found.
 */
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
  getWarmUpGrammarByGrammarRuleId,
  getWarmUpGrammarById,
  createWarmUpGrammar,
  updateWarmUpGrammarById,
  deleteWarmUpGrammarById,
};