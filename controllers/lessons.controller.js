const { sendError, sendSuccess } = require('../utils/response');
const { validateIdParam, validateRequiredFields } = require('../utils/validators');
const { getGrammarRuleById } = require('../models/grammarRules.model');
const {
  createLesson,
  deleteLessonById,
  getAllLessons,
  getLessonById,
  updateLessonById,
} = require('../models/lessons.model');

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

function listLessons(req, res) {
  const level = req.query.level ? String(req.query.level).trim() : undefined;

  return sendSuccess(res, 200, getAllLessons(level));
}

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
  updateLesson,
  deleteLesson,
};