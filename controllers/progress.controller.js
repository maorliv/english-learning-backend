const { getProgressByStudentId } = require('../models/progress.model');
const { getScoredCompletedConversationsByStudentId } = require('../models/conversations.model');
const { getLessonById } = require('../models/lessons.model');
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

function getProgressChart(req, res) {
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

  const scoredConversations = getScoredCompletedConversationsByStudentId(validatedStudentId.value).map(
    (conversation) => ({
      conversationId: conversation.conversationId,
      lessonTitle: getLessonById(conversation.lessonId)?.title || null,
      aiScore: conversation.aiScore,
      teacherScore: conversation.teacherScore,
      date: conversation.date,
    })
  );

  return sendSuccess(res, 200, scoredConversations);
}

module.exports = {
  getProgressChart,
  getProgressStats,
};