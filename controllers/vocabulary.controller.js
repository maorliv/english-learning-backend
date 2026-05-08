const { sendError, sendSuccess } = require('../utils/response');
const { validateIdParam, validateRequiredFields } = require('../utils/validators');
const { getLessonById } = require('../models/lessons.model');
const {
  createVocabularyItem,
  deleteVocabularyItemByLessonAndId,
  getVocabularyByLessonId,
  getVocabularyItemByLessonAndId,
  updateVocabularyItemByLessonAndId,
} = require('../models/vocabulary.model');

function listLessonVocabulary(req, res) {
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

  return sendSuccess(res, 200, getVocabularyByLessonId(validatedId.value));
}

function getLessonVocabularyItem(req, res) {
  const validatedLessonId = validateIdParam(req.params.id, 'id');
  const validatedVocabId = validateIdParam(req.params.vocabId, 'vocabId');

  if (!validatedLessonId.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      validatedLessonId.message,
      validatedLessonId.details
    );
  }

  if (!validatedVocabId.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      validatedVocabId.message,
      validatedVocabId.details
    );
  }

  const lesson = getLessonById(validatedLessonId.value);

  if (!lesson) {
    return sendError(res, 404, 'LESSON_NOT_FOUND', 'Lesson not found', {
      lessonId: validatedLessonId.value,
    });
  }

  const vocabularyItem = getVocabularyItemByLessonAndId(
    validatedLessonId.value,
    validatedVocabId.value
  );

  if (!vocabularyItem) {
    return sendError(res, 404, 'VOCABULARY_NOT_FOUND', 'Vocabulary item not found', {
      lessonId: validatedLessonId.value,
      vocabId: validatedVocabId.value,
    });
  }

  return sendSuccess(res, 200, vocabularyItem);
}

function createLessonVocabularyItem(req, res) {
  const validatedLessonId = validateIdParam(req.params.id, 'id');
  const requiredFieldsValidation = validateRequiredFields(req.body, [
    'word',
    'translation',
    'example',
    'definition',
    'completeSentence',
  ]);

  if (!validatedLessonId.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      validatedLessonId.message,
      validatedLessonId.details
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

  const lesson = getLessonById(validatedLessonId.value);

  if (!lesson) {
    return sendError(res, 404, 'LESSON_NOT_FOUND', 'Lesson not found', {
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
}

function updateLessonVocabularyItem(req, res) {
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
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      validatedLessonId.message,
      validatedLessonId.details
    );
  }

  if (!validatedVocabId.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      validatedVocabId.message,
      validatedVocabId.details
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
    return sendError(res, 404, 'VOCABULARY_NOT_FOUND', 'Vocabulary item not found', {
      lessonId: validatedLessonId.value,
      vocabId: validatedVocabId.value,
    });
  }

  return sendSuccess(res, 200, {
    vocabularyId: updatedVocabularyItem.vocabularyId,
  });
}

function deleteLessonVocabularyItem(req, res) {
  const validatedLessonId = validateIdParam(req.params.id, 'id');
  const validatedVocabId = validateIdParam(req.params.vocabId, 'vocabId');

  if (!validatedLessonId.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      validatedLessonId.message,
      validatedLessonId.details
    );
  }

  if (!validatedVocabId.isValid) {
    return sendError(
      res,
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
    return sendError(res, 404, 'VOCABULARY_NOT_FOUND', 'Vocabulary item not found', {
      lessonId: validatedLessonId.value,
      vocabId: validatedVocabId.value,
    });
  }

  return sendSuccess(res, 200, {
    vocabularyId: deletedVocabularyItem.vocabularyId,
  });
}

module.exports = {
  createLessonVocabularyItem,
  deleteLessonVocabularyItem,
  updateLessonVocabularyItem,
  listLessonVocabulary,
  getLessonVocabularyItem,
};