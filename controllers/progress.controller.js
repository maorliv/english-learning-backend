const { getProgressByStudentId } = require('../models/progress.model');
const { sendError, sendSuccess } = require('../utils/response');
const { validateIdParam } = require('../utils/validators');

function getProgressStats(req, res) {
  const validatedStudentId = validateIdParam(req.header('x-user-id'), 'x-user-id');

  if (!validatedStudentId.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      validatedStudentId.message,
      validatedStudentId.details
    );
  }

  const progress = getProgressByStudentId(validatedStudentId.value);

  if (!progress) {
    return sendError(
      res,
      404,
      'PROGRESS_NOT_FOUND',
      'Progress not found for this student',
      {
        studentId: validatedStudentId.value,
      }
    );
  }

  return sendSuccess(res, 200, {
    currentLevel: progress.currentLevel,
    completedLessonsCount: progress.completedLessonsCount,
    successedLessonsCount: progress.successedLessonsCount,
    overallAverage: progress.overallAverage,
    lastActivityDate: progress.lastActivityDate,
  });
}

module.exports = {
  getProgressStats,
};