const { sendError, sendSuccess } = require('../utils/response');
const { validateIdParam, validateRequiredFields } = require('../utils/validators');
const { getGrammarRuleById } = require('../models/grammarRules.model');
const { getWarmUpGrammarByLessonId } = require('../models/warmUpGrammar.model');
const { getVocabularyByLessonId } = require('../models/vocabulary.model');
const {
  createLesson,
  deleteLessonById,
  getAllLessons,
  getLessonById,
  updateLessonById,
} = require('../models/lessons.model');

/**
 * POST /api/lessons
 * Creates a new lesson. All fields are read from req.body and are required.
 * Returns the new lesson object on success (201 Created).
 */
function createLessonHandler(req, res) {
  const requiredFieldsValidation = validateRequiredFields(req.body, [
    'title',
    'scene',
    'aiRole',
    'level',
    'grammarRuleId',
    'vocabularyId',
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

  const lesson = createLesson({
    title: req.body.title,
    scene: req.body.scene,
    aiRole: req.body.aiRole,
    level: req.body.level,
    grammarRuleId: req.body.grammarRuleId,
    vocabularyId: req.body.vocabularyId,
  });

  return sendSuccess(res, 201, lesson);
}

/**
 * GET /api/lessons
 * Returns all lessons. Accepts an optional ?level= query string filter.
 * When a level is provided, lessons at other levels are returned with locked: true.
 */
function listLessons(req, res) {
  // req.query.level comes from the URL query string: /api/lessons?level=beginner
  const level = req.query.level ? String(req.query.level).trim() : undefined;

  return sendSuccess(res, 200, getAllLessons(level));
}

/**
 * GET /api/lessons/:id
 * Returns a single lesson by its numeric ID.
 */
function getLesson(req, res) {
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

  const lesson = getLessonById(validatedId.value);

  if (!lesson) {
    return sendError(res, 404, 'LESSON_NOT_FOUND', 'Lesson not found', {
      lessonId: validatedId.value,
    });
  }

  return sendSuccess(res, 200, lesson);
}

/**
 * GET /api/lessons/:id/grammar
 * Returns the grammar rule associated with the given lesson.
 * First looks up the lesson to get its grammarRuleId, then looks up the rule.
 */
function getLessonGrammar(req, res) {
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

  const lesson = getLessonById(validatedId.value);

  if (!lesson) {
    return sendError(res, 404, 'LESSON_NOT_FOUND', 'Lesson not found', {
      lessonId: validatedId.value,
    });
  }

  const grammarRule = getGrammarRuleById(lesson.grammarRuleId);

  if (!grammarRule) {
    return sendError(res, 404, 'GRAMMAR_RULE_NOT_FOUND', 'Grammar rule not found', {
      grammarRuleId: lesson.grammarRuleId,
    });
  }

  return sendSuccess(res, 200, {
    grammarRuleId: grammarRule.id,
    category: grammarRule.category,
    usage: grammarRule.usage,
    forms: grammarRule.forms,
    spellingRules: grammarRule.spellingRules,
    examples: grammarRule.examples,
  });
}

/**
 * GET /api/lessons/:id/grammar-warmup
 * Returns a set of warm-up grammar exercises for the given lesson.
 * Accepts an optional ?difficulty= query string to filter by difficulty level.
 * Returns 404 if no matching exercises are found.
 */
function getLessonGrammarWarmUp(req, res) {
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

  const lesson = getLessonById(validatedId.value);

  if (!lesson) {
    return sendError(res, 404, 'LESSON_NOT_FOUND', 'Lesson not found', {
      lessonId: validatedId.value,
    });
  }

  // req.query.difficulty is an optional filter from the URL (e.g. ?difficulty=easy)
  const exercises = getWarmUpGrammarByLessonId(validatedId.value, req.query.difficulty);

  if (exercises.length === 0) {
    return sendError(
      res,
      404,
      'WARMUP_GRAMMAR_NOT_FOUND',
      'Warm-up grammar exercises not found for lesson',
      {
        lessonId: validatedId.value,
        difficulty: req.query.difficulty,
      }
    );
  }

  return sendSuccess(res, 200, exercises);
}

/**
 * GET /api/lessons/:id/vocab-warmup
 * Returns vocabulary warm-up data for the given lesson in two formats:
 *   completeSentence \u2014 fill-in-the-blank exercises
 *   matching         \u2014 word-to-definition pairs
 */
function getLessonVocabularyWarmUp(req, res) {
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

  const lesson = getLessonById(validatedId.value);

  if (!lesson) {
    return sendError(res, 404, 'LESSON_NOT_FOUND', 'Lesson not found', {
      lessonId: validatedId.value,
    });
  }

  const vocabulary = getVocabularyByLessonId(validatedId.value);

  return sendSuccess(res, 200, {
    // map() transforms each vocabulary item into the shape needed for each exercise type
    completeSentence: vocabulary.map((item) => ({
      vocabularyId: item.vocabularyId,
      completeSentence: item.completeSentence,
      word: item.word,
    })),
    matching: vocabulary.map((item) => ({
      word: item.word,
      definition: item.definition,
    })),
  });
}

/**
 * PUT /api/lessons/:id
 * Replaces all editable fields of the given lesson.
 * Returns the updated lesson's ID on success.
 */
function updateLesson(req, res) {
  const validatedId = validateIdParam(req.params.id, 'id');
  const requiredFieldsValidation = validateRequiredFields(req.body, [
    'title',
    'scene',
    'aiRole',
    'level',
    'grammarRuleId',
    'vocabularyId',
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

  const updatedLesson = updateLessonById(validatedId.value, {
    title: req.body.title,
    scene: req.body.scene,
    aiRole: req.body.aiRole,
    level: req.body.level,
    grammarRuleId: req.body.grammarRuleId,
    vocabularyId: req.body.vocabularyId,
  });

  if (!updatedLesson) {
    return sendError(res, 404, 'LESSON_NOT_FOUND', 'Lesson not found', {
      lessonId: validatedId.value,
    });
  }

  return sendSuccess(res, 200, {
    lessonId: updatedLesson.lessonId,
  });
}

/** DELETE /api/lessons/:id \u2014 Removes the lesson with the given ID. */
function deleteLesson(req, res) {
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

  const deletedLesson = deleteLessonById(validatedId.value);

  if (!deletedLesson) {
    return sendError(res, 404, 'LESSON_NOT_FOUND', 'Lesson not found', {
      lessonId: validatedId.value,
    });
  }

  return sendSuccess(res, 200, {
    lessonId: deletedLesson.lessonId,
  });
}

module.exports = {
  createLessonHandler,
  listLessons,
  getLesson,
  getLessonGrammar,
  getLessonGrammarWarmUp,
  getLessonVocabularyWarmUp,
  updateLesson,
  deleteLesson,
};