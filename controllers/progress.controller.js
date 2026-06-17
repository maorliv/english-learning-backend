const { getProgressByStudentId } = require('../models/progress.model');
const {
  getScoredCompletedConversationsByStudentId,
  getAllCompletedConversationsByStudentId,
} = require('../models/conversations.model');
const { getLessonById } = require('../models/lessons.model');
const { getTeacherById } = require('../models/teachers.model');
const { getStudentPreferencesByUserId } = require('../models/matching.model');
const { getNextLessonRecommendation } = require('../services/progress.service');
const { sendSuccess } = require('../utils/response');
const { createHttpError, withErrorHandling } = require('../utils/httpError');
const { validateIdParam } = require('../utils/validators');

// Minimum score to count a lesson as successfully completed
const SUCCESS_THRESHOLD = 70;

/**
 * GET /api/progress/stats
 * Returns summary statistics for the logged-in student's learning progress.
 * All numeric stats are computed live from conversations so they stay in sync
 * as new lessons are completed — the stored progress fields are never stale.
 */
const getProgressStats = withErrorHandling((req, res) => {
  const validatedStudentId = validateIdParam(req.header('x-user-id'), 'x-user-id');

  if (!validatedStudentId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedStudentId.message,
      validatedStudentId.details
    );
  }

  const progress = getProgressByStudentId(validatedStudentId.value);

  if (!progress) {
    throw createHttpError(
      404,
      'PROGRESS_NOT_FOUND',
      'Progress not found for this student',
      { studentId: validatedStudentId.value }
    );
  }

  const completed = getAllCompletedConversationsByStudentId(validatedStudentId.value);

  // Best score per lesson (teacherScore takes priority over aiScore)
  const bestScoreByLesson = {};
  for (const c of completed) {
    const score = c.teacherScore ?? c.aiScore;
    if (score !== null && score !== undefined) {
      const prev = bestScoreByLesson[c.lessonId];
      bestScoreByLesson[c.lessonId] = prev === undefined ? score : Math.max(prev, score);
    }
  }

  const completedLessonsCount = new Set(completed.map((c) => c.lessonId)).size;
  const lessonScores = Object.values(bestScoreByLesson);
  const successedLessonsCount = lessonScores.filter((s) => s >= SUCCESS_THRESHOLD).length;
  const overallAverage =
    lessonScores.length > 0
      ? Math.round(lessonScores.reduce((sum, s) => sum + s, 0) / lessonScores.length)
      : 0;

  // Most recent completed-conversation date; fall back to the stored value when there are none
  const dates = completed.map((c) => c.date).filter(Boolean);
  const lastActivityDate =
    dates.length > 0
      ? dates.reduce((latest, d) => (d > latest ? d : latest))
      : progress.lastActivityDate;

  return sendSuccess(res, 200, {
    currentLevel: progress.currentLevel,
    completedLessonsCount,
    successedLessonsCount,
    overallAverage,
    lastActivityDate,
  });
});

/**
 * GET /api/progress/chart
 * Returns a list of the student's recent scored conversations for display in a progress chart.
 * Each item includes the lesson title (looked up by lessonId), AI score, teacher score, and date.
 */
const getProgressChart = withErrorHandling((req, res) => {
  const validatedStudentId = validateIdParam(req.header('x-user-id'), 'x-user-id');

  if (!validatedStudentId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedStudentId.message,
      validatedStudentId.details
    );
  }

  // Fetch recent scored conversations and enrich each with lesson title and teacher names
  const scoredConversations = getScoredCompletedConversationsByStudentId(validatedStudentId.value).map(
    (conversation) => {
      const enrichedReviews = conversation.teacherReviews.map((review) => {
        const teacher = getTeacherById(review.teacherId);
        return {
          teacherId: review.teacherId,
          teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : null,
          teacherScore: review.teacherScore,
        };
      });

      return {
        conversationId: conversation.conversationId,
        lessonTitle: getLessonById(conversation.lessonId)?.title || null,
        aiScore: conversation.aiScore,
        teacherReviews: enrichedReviews,
        date: conversation.date,
      };
    }
  );

  return sendSuccess(res, 200, scoredConversations);
});

/**
 * GET /api/progress/next-lesson
 * Returns the recommended next lesson for the logged-in student based on their
 * current level and learning preferences. Returns 404 if progress or preferences are missing.
 */
const getNextLesson = withErrorHandling(async (req, res) => {
  const validatedStudentId = validateIdParam(req.header('x-user-id'), 'x-user-id');

  if (!validatedStudentId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedStudentId.message,
      validatedStudentId.details
    );
  }

  const progress = getProgressByStudentId(validatedStudentId.value);

  if (!progress) {
    throw createHttpError(
      404,
      'PROGRESS_NOT_FOUND',
      'Progress not found for this student',
      {
        studentId: validatedStudentId.value,
      }
    );
  }

  const preferences = getStudentPreferencesByUserId(validatedStudentId.value);

  if (!preferences) {
    throw createHttpError(
      404,
      'PREFERENCES_NOT_FOUND',
      'Student preferences not found',
      {
        studentId: validatedStudentId.value,
      }
    );
  }

  return sendSuccess(res, 200, await getNextLessonRecommendation(progress, preferences));
});

/**
 * GET /api/progress/:studentId
 * Returns full progress data for a specific student by their studentId URL param.
 * Restricted to teacher and admin roles (set in the route file).
 */
const getStudentProgress = withErrorHandling((req, res) => {
  const validatedStudentId = validateIdParam(req.params.studentId, 'studentId'); // comes from :studentId in the URL

  if (!validatedStudentId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedStudentId.message,
      validatedStudentId.details
    );
  }

  const progress = getProgressByStudentId(validatedStudentId.value);

  if (!progress) {
    throw createHttpError(
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
  });
});

module.exports = {
  getProgressChart,
  getNextLesson,
  getProgressStats,
  getStudentProgress,
};