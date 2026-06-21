const { sendSuccess } = require('../utils/response');
const { createHttpError, withErrorHandling } = require('../utils/httpError');
const { validateIdParam, validateRequiredFields } = require('../utils/validators');
const lessonsService = require('../services/lessons.service');
const vocabularyService = require('../services/vocabulary.service');

const createLessonHandler = withErrorHandling(async (req, res) => {
  const requiredFieldsValidation = validateRequiredFields(req.body, [
    'title', 'scene', 'aiRole', 'level', 'grammarRuleId',
  ]);

  if (!requiredFieldsValidation.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', requiredFieldsValidation.message, requiredFieldsValidation.details);
  }

  const lesson = await lessonsService.createLesson({
    title: req.body.title,
    scene: req.body.scene,
    aiRole: req.body.aiRole,
    level: req.body.level,
    grammarRuleId: req.body.grammarRuleId,
  });

  return sendSuccess(res, 201, lesson);
});

const listLessons = withErrorHandling(async (req, res) => {
  const level = req.query.level ? String(req.query.level).trim() : undefined;
  return sendSuccess(res, 200, await lessonsService.getAllLessons(level));
});

const getLesson = withErrorHandling(async (req, res) => {
  const validatedId = validateIdParam(req.params.id, 'id');
  if (!validatedId.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', validatedId.message, validatedId.details);
  }

  const lesson = await lessonsService.getLessonById(validatedId.value);
  if (!lesson) {
    throw createHttpError(404, 'LESSON_NOT_FOUND', 'Lesson not found', { lessonId: validatedId.value });
  }

  return sendSuccess(res, 200, lesson);
});

const getLessonGrammar = withErrorHandling(async (req, res) => {
  const validatedId = validateIdParam(req.params.id, 'id');
  if (!validatedId.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', validatedId.message, validatedId.details);
  }

  const { lesson, grammarRule } = await lessonsService.getLessonGrammar(validatedId.value);

  if (!lesson) {
    throw createHttpError(404, 'LESSON_NOT_FOUND', 'Lesson not found', { lessonId: validatedId.value });
  }
  if (!grammarRule) {
    throw createHttpError(404, 'GRAMMAR_RULE_NOT_FOUND', 'Grammar rule not found', { grammarRuleId: lesson.grammarRuleId });
  }

  return sendSuccess(res, 200, {
    grammarRuleId: grammarRule.id,
    category: grammarRule.category,
    usage: grammarRule.usage,
    forms: grammarRule.forms,
    spellingRules: grammarRule.spellingRules,
    examples: grammarRule.examples,
  });
});

const getLessonGrammarWarmUp = withErrorHandling(async (req, res) => {
  const validatedId = validateIdParam(req.params.id, 'id');
  if (!validatedId.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', validatedId.message, validatedId.details);
  }

  const { lesson, exercises } = await lessonsService.getLessonGrammarWarmUp(validatedId.value, req.query.difficulty);

  if (!lesson) {
    throw createHttpError(404, 'LESSON_NOT_FOUND', 'Lesson not found', { lessonId: validatedId.value });
  }
  if (exercises.length === 0) {
    throw createHttpError(404, 'WARMUP_GRAMMAR_NOT_FOUND', 'Warm-up grammar exercises not found for lesson', {
      lessonId: validatedId.value,
      difficulty: req.query.difficulty,
    });
  }

  return sendSuccess(res, 200, exercises);
});

const getLessonVocabularyWarmUp = withErrorHandling(async (req, res) => {
  const validatedId = validateIdParam(req.params.id, 'id');
  if (!validatedId.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', validatedId.message, validatedId.details);
  }

  const result = await lessonsService.getLessonVocabWarmUp(validatedId.value);

  if (!result) {
    throw createHttpError(404, 'LESSON_NOT_FOUND', 'Lesson not found', { lessonId: validatedId.value });
  }

  return sendSuccess(res, 200, result);
});

const updateLesson = withErrorHandling(async (req, res) => {
  const validatedId = validateIdParam(req.params.id, 'id');
  const requiredFieldsValidation = validateRequiredFields(req.body, [
    'title', 'scene', 'aiRole', 'level', 'grammarRuleId',
  ]);

  if (!validatedId.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', validatedId.message, validatedId.details);
  }
  if (!requiredFieldsValidation.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', requiredFieldsValidation.message, requiredFieldsValidation.details);
  }

  const updatedLesson = await lessonsService.updateLessonById(validatedId.value, {
    title: req.body.title,
    scene: req.body.scene,
    aiRole: req.body.aiRole,
    level: req.body.level,
    grammarRuleId: req.body.grammarRuleId,
  });

  if (!updatedLesson) {
    throw createHttpError(404, 'LESSON_NOT_FOUND', 'Lesson not found', { lessonId: validatedId.value });
  }

  return sendSuccess(res, 200, { lessonId: updatedLesson.lessonId });
});

const deleteLesson = withErrorHandling(async (req, res) => {
  const validatedId = validateIdParam(req.params.id, 'id');
  if (!validatedId.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', validatedId.message, validatedId.details);
  }

  const deletedLesson = await lessonsService.deleteLessonById(validatedId.value);
  if (!deletedLesson) {
    throw createHttpError(404, 'LESSON_NOT_FOUND', 'Lesson not found', { lessonId: validatedId.value });
  }

  return sendSuccess(res, 200, { lessonId: deletedLesson.lessonId });
});

const getLessonsCatalog = withErrorHandling(async (req, res) => {
  const validatedStudentId = validateIdParam(req.header('x-user-id'), 'x-user-id');
  if (!validatedStudentId.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', validatedStudentId.message, validatedStudentId.details);
  }

  const catalog = await lessonsService.getLessonsCatalog(validatedStudentId.value);

  if (!catalog) {
    throw createHttpError(404, 'PROGRESS_NOT_FOUND', 'Progress not found for this student', {
      studentId: validatedStudentId.value,
    });
  }

  return sendSuccess(res, 200, catalog);
});

// Vocabulary CRUD endpoints (nested under /api/lessons/:id/vocab)

const listLessonVocabulary = withErrorHandling(async (req, res) => {
  const validatedId = validateIdParam(req.params.id, 'id');
  if (!validatedId.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', validatedId.message, validatedId.details);
  }
  return sendSuccess(res, 200, await vocabularyService.getVocabularyByLessonId(validatedId.value));
});

const getLessonVocabularyItem = withErrorHandling(async (req, res) => {
  const validatedLessonId = validateIdParam(req.params.id, 'id');
  const validatedVocabId = validateIdParam(req.params.vocabId, 'vocabId');
  if (!validatedLessonId.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', validatedLessonId.message, validatedLessonId.details);
  }
  if (!validatedVocabId.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', validatedVocabId.message, validatedVocabId.details);
  }

  const item = await vocabularyService.getVocabularyItemByLessonAndId(validatedLessonId.value, validatedVocabId.value);
  if (!item) {
    throw createHttpError(404, 'VOCABULARY_NOT_FOUND', 'Vocabulary item not found', {
      lessonId: validatedLessonId.value,
      vocabId: validatedVocabId.value,
    });
  }
  return sendSuccess(res, 200, item);
});

const createLessonVocabularyItem = withErrorHandling(async (req, res) => {
  const validatedId = validateIdParam(req.params.id, 'id');
  const requiredFieldsValidation = validateRequiredFields(req.body, [
    'word', 'translation', 'example', 'definition', 'completeSentence',
  ]);
  if (!validatedId.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', validatedId.message, validatedId.details);
  }
  if (!requiredFieldsValidation.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', requiredFieldsValidation.message, requiredFieldsValidation.details);
  }

  const item = await vocabularyService.createVocabularyItem(validatedId.value, req.body);
  return sendSuccess(res, 201, item);
});

const updateLessonVocabularyItem = withErrorHandling(async (req, res) => {
  const validatedLessonId = validateIdParam(req.params.id, 'id');
  const validatedVocabId = validateIdParam(req.params.vocabId, 'vocabId');
  const requiredFieldsValidation = validateRequiredFields(req.body, [
    'word', 'translation', 'example', 'definition', 'completeSentence',
  ]);
  if (!validatedLessonId.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', validatedLessonId.message, validatedLessonId.details);
  }
  if (!validatedVocabId.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', validatedVocabId.message, validatedVocabId.details);
  }
  if (!requiredFieldsValidation.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', requiredFieldsValidation.message, requiredFieldsValidation.details);
  }

  const item = await vocabularyService.updateVocabularyItemByLessonAndId(
    validatedLessonId.value, validatedVocabId.value, req.body
  );
  if (!item) {
    throw createHttpError(404, 'VOCABULARY_NOT_FOUND', 'Vocabulary item not found', {
      lessonId: validatedLessonId.value,
      vocabId: validatedVocabId.value,
    });
  }
  return sendSuccess(res, 200, item);
});

const deleteLessonVocabularyItem = withErrorHandling(async (req, res) => {
  const validatedLessonId = validateIdParam(req.params.id, 'id');
  const validatedVocabId = validateIdParam(req.params.vocabId, 'vocabId');
  if (!validatedLessonId.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', validatedLessonId.message, validatedLessonId.details);
  }
  if (!validatedVocabId.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', validatedVocabId.message, validatedVocabId.details);
  }

  const item = await vocabularyService.deleteVocabularyItemByLessonAndId(
    validatedLessonId.value, validatedVocabId.value
  );
  if (!item) {
    throw createHttpError(404, 'VOCABULARY_NOT_FOUND', 'Vocabulary item not found', {
      lessonId: validatedLessonId.value,
      vocabId: validatedVocabId.value,
    });
  }
  return sendSuccess(res, 200, { vocabularyId: item.vocabularyId });
});

module.exports = {
  createLessonHandler,
  getLessonsCatalog,
  listLessons,
  getLesson,
  getLessonGrammar,
  getLessonGrammarWarmUp,
  getLessonVocabularyWarmUp,
  updateLesson,
  deleteLesson,
  listLessonVocabulary,
  getLessonVocabularyItem,
  createLessonVocabularyItem,
  updateLessonVocabularyItem,
  deleteLessonVocabularyItem,
};
