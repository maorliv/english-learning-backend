const { sendSuccess } = require('../utils/response');
const { createHttpError, withErrorHandling } = require('../utils/httpError');
const { validateIdParam, validateRequiredFields } = require('../utils/validators');
const { getLessonById } = require('../models/lessons.model');
const {
  createVocabularyItem,
  deleteVocabularyItemByLessonAndId,
  getVocabularyByLessonId,
  getVocabularyItemByLessonAndId,
  updateVocabularyItemByLessonAndId,
} = require('../models/vocabulary.model');

/**
 * GET /api/lessons/:id/vocab
 * Returns all vocabulary items belonging to the given lesson.
 * Returns 404 if the lesson itself does not exist.
 */
const listLessonVocabulary = withErrorHandling((req, res) => {
  const validatedId = validateIdParam(req.params.id, 'id');

  if (!validatedId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedId.message,
      validatedId.details
    );
  }

  const lesson = getLessonById(validatedId.value);

  if (!lesson) {
    throw createHttpError(404, 'LESSON_NOT_FOUND', 'Lesson not found', {
      lessonId: validatedId.value,
    });
  }

  return sendSuccess(res, 200, getVocabularyByLessonId(validatedId.value));
});

/**
 * GET /api/lessons/:id/vocab/:vocabId
 * Returns a single vocabulary item identified by both its lessonId and vocabularyId.
 * Both IDs come from req.params and must be valid positive integers.
 */
const getLessonVocabularyItem = withErrorHandling((req, res) => {
  const validatedLessonId = validateIdParam(req.params.id, 'id');
  const validatedVocabId = validateIdParam(req.params.vocabId, 'vocabId'); // :vocabId is the second URL segment

  if (!validatedLessonId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedLessonId.message,
      validatedLessonId.details
    );
  }

  if (!validatedVocabId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedVocabId.message,
      validatedVocabId.details
    );
  }

  const lesson = getLessonById(validatedLessonId.value);

  if (!lesson) {
    throw createHttpError(404, 'LESSON_NOT_FOUND', 'Lesson not found', {
      lessonId: validatedLessonId.value,
    });
  }

  const vocabularyItem = getVocabularyItemByLessonAndId(
    validatedLessonId.value,
    validatedVocabId.value
  );

  if (!vocabularyItem) {
    throw createHttpError(404, 'VOCABULARY_NOT_FOUND', 'Vocabulary item not found', {
      lessonId: validatedLessonId.value,
      vocabId: validatedVocabId.value,
    });
  }

  return sendSuccess(res, 200, vocabularyItem);
});

/**
 * POST /api/lessons/:id/vocab
 * Adds a new vocabulary item to the given lesson.
 * All word fields (word, translation, example, definition, completeSentence) are required.
 * Returns the new item's vocabularyId on success (201 Created).
 */
const createLessonVocabularyItem = withErrorHandling((req, res) => {
  const validatedLessonId = validateIdParam(req.params.id, 'id');
  const requiredFieldsValidation = validateRequiredFields(req.body, [
    'word',
    'translation',
    'example',
    'definition',
    'completeSentence',
  ]);

  if (!validatedLessonId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedLessonId.message,
      validatedLessonId.details
    );
  }

  if (!requiredFieldsValidation.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      requiredFieldsValidation.message,
      requiredFieldsValidation.details
    );
  }

  const lesson = getLessonById(validatedLessonId.value);

  if (!lesson) {
    throw createHttpError(404, 'LESSON_NOT_FOUND', 'Lesson not found', {
      lessonId: validatedLessonId.value,
    });
  }

  const createdVocabularyItem = createVocabularyItem(validatedLessonId.value, {
    word: req.body.word,
    translation: req.body.translation,
    example: req.body.example,
    definition: req.body.definition,
    completeSentence: req.body.completeSentence,
  });

  return sendSuccess(res, 201, {
    vocabularyId: createdVocabularyItem.vocabularyId,
  });
});

/**
 * PUT /api/lessons/:id/vocab/:vocabId
 * Replaces all fields of an existing vocabulary item.
 * Both the lesson ID and vocab ID must exist and match.
 */
const updateLessonVocabularyItem = withErrorHandling((req, res) => {
  const validatedLessonId = validateIdParam(req.params.id, 'id');
  const validatedVocabId = validateIdParam(req.params.vocabId, 'vocabId');
  const requiredFieldsValidation = validateRequiredFields(req.body, [
    'word',
    'translation',
    'example',
    'definition',
    'completeSentence',
  ]);

  if (!validatedLessonId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedLessonId.message,
      validatedLessonId.details
    );
  }

  if (!validatedVocabId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedVocabId.message,
      validatedVocabId.details
    );
  }

  if (!requiredFieldsValidation.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      requiredFieldsValidation.message,
      requiredFieldsValidation.details
    );
  }

  const updatedVocabularyItem = updateVocabularyItemByLessonAndId(
    validatedLessonId.value,
    validatedVocabId.value,
    {
      word: req.body.word,
      translation: req.body.translation,
      example: req.body.example,
      definition: req.body.definition,
      completeSentence: req.body.completeSentence,
    }
  );

  if (!updatedVocabularyItem) {
    throw createHttpError(404, 'VOCABULARY_NOT_FOUND', 'Vocabulary item not found', {
      lessonId: validatedLessonId.value,
      vocabId: validatedVocabId.value,
    });
  }

  return sendSuccess(res, 200, {
    vocabularyId: updatedVocabularyItem.vocabularyId,
  });
});

/**
 * DELETE /api/lessons/:id/vocab/:vocabId
 * Removes the specified vocabulary item from the given lesson.
 */
const deleteLessonVocabularyItem = withErrorHandling((req, res) => {
  const validatedLessonId = validateIdParam(req.params.id, 'id');
  const validatedVocabId = validateIdParam(req.params.vocabId, 'vocabId');

  if (!validatedLessonId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedLessonId.message,
      validatedLessonId.details
    );
  }

  if (!validatedVocabId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedVocabId.message,
      validatedVocabId.details
    );
  }

  const deletedVocabularyItem = deleteVocabularyItemByLessonAndId(
    validatedLessonId.value,
    validatedVocabId.value
  );

  if (!deletedVocabularyItem) {
    throw createHttpError(404, 'VOCABULARY_NOT_FOUND', 'Vocabulary item not found', {
      lessonId: validatedLessonId.value,
      vocabId: validatedVocabId.value,
    });
  }

  return sendSuccess(res, 200, {
    vocabularyId: deletedVocabularyItem.vocabularyId,
  });
});

module.exports = {
  createLessonVocabularyItem,
  deleteLessonVocabularyItem,
  updateLessonVocabularyItem,
  listLessonVocabulary,
  getLessonVocabularyItem,
};