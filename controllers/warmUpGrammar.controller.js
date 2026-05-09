const { sendError, sendSuccess } = require('../utils/response');
const { validateIdParam, validateRequiredFields } = require('../utils/validators');
const {
  createWarmUpGrammar,
  deleteWarmUpGrammarById,
  getAllWarmUpGrammar,
  getWarmUpGrammarById,
  updateWarmUpGrammarById,
} = require('../models/warmUpGrammar.model');

/** GET /api/warm-up-grammar \u2014 Returns all warm-up grammar exercises. Restricted to admin. */
function listWarmUpGrammar(req, res) {
  return sendSuccess(res, 200, getAllWarmUpGrammar());
}

/**
 * GET /api/warm-up-grammar/:id
 * Returns a single warm-up grammar exercise by its numeric ID.
 */
function getWarmUpGrammar(req, res) {
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

  const exercise = getWarmUpGrammarById(validatedId.value);

  if (!exercise) {
    return sendError(
      res,
      404,
      'WARMUP_GRAMMAR_NOT_FOUND',
      'Warm-up grammar exercise not found',
      {
        exerciseId: validatedId.value,
      }
    );
  }

  return sendSuccess(res, 200, exercise);
}

/**
 * POST /api/warm-up-grammar
 * Creates a new warm-up grammar exercise. All fields are required.
 * Returns the new exercise's ID on success (201 Created).
 */
function createWarmUpGrammarHandler(req, res) {
  const requiredFieldsValidation = validateRequiredFields(req.body, [
    'grammarRuleId',
    'lessonId',
    'type',
    'instruction',
    'content',
    'options',
    'correctAnswer',
    'difficulty',
  ]);

  if (!requiredFieldsValidation.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      requiredFieldsValidation.message,
      requiredFieldsValidation.details
    );
  }

  const createdExercise = createWarmUpGrammar({
    grammarRuleId: req.body.grammarRuleId,
    lessonId: req.body.lessonId,
    type: req.body.type,
    instruction: req.body.instruction,
    content: req.body.content,
    options: req.body.options,
    correctAnswer: req.body.correctAnswer,
    difficulty: req.body.difficulty,
  });

  return sendSuccess(res, 201, {
    exerciseId: createdExercise.exerciseId,
  });
}

/**
 * PUT /api/warm-up-grammar/:id
 * Replaces the editable fields of the given warm-up grammar exercise.
 * Note: grammarRuleId and lessonId cannot be changed after creation.
 */
function updateWarmUpGrammar(req, res) {
  const validatedId = validateIdParam(req.params.id, 'id');
  const requiredFieldsValidation = validateRequiredFields(req.body, [
    'type',
    'instruction',
    'content',
    'options',
    'correctAnswer',
    'difficulty',
  ]);

  if (!validatedId.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      validatedId.message,
      validatedId.details
    );
  }

  if (!requiredFieldsValidation.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      requiredFieldsValidation.message,
      requiredFieldsValidation.details
    );
  }

  const updatedExercise = updateWarmUpGrammarById(validatedId.value, {
    type: req.body.type,
    instruction: req.body.instruction,
    content: req.body.content,
    options: req.body.options,
    correctAnswer: req.body.correctAnswer,
    difficulty: req.body.difficulty,
  });

  if (!updatedExercise) {
    return sendError(
      res,
      404,
      'WARMUP_GRAMMAR_NOT_FOUND',
      'Warm-up grammar exercise not found',
      {
        exerciseId: validatedId.value,
      }
    );
  }

  return sendSuccess(res, 200, {
    exerciseId: updatedExercise.exerciseId,
  });
}

/** DELETE /api/warm-up-grammar/:id \u2014 Removes a warm-up grammar exercise by its ID. */
function deleteWarmUpGrammar(req, res) {
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

  const deletedExercise = deleteWarmUpGrammarById(validatedId.value);

  if (!deletedExercise) {
    return sendError(
      res,
      404,
      'WARMUP_GRAMMAR_NOT_FOUND',
      'Warm-up grammar exercise not found',
      {
        exerciseId: validatedId.value,
      }
    );
  }

  return sendSuccess(res, 200, {
    exerciseId: deletedExercise.exerciseId,
  });
}

module.exports = {
  listWarmUpGrammar,
  getWarmUpGrammar,
  createWarmUpGrammarHandler,
  updateWarmUpGrammar,
  deleteWarmUpGrammar,
};