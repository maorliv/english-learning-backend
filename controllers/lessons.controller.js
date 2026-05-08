const { sendError, sendSuccess } = require('../utils/response');
const { validateIdParam, validateRequiredFields } = require('../utils/validators');
const { createLesson, getAllLessons, getLessonById } = require('../models/lessons.model');

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

module.exports = {
  createLessonHandler,
  listLessons,
  getLesson,
};