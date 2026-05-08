const { sendError, sendSuccess } = require('../utils/response');
const { validateIdParam } = require('../utils/validators');
const { getAllLessons, getLessonById } = require('../models/lessons.model');

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
  listLessons,
  getLesson,
};