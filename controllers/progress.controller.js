const { getProgressByStudentId } = require('../models/progress.model');
const { getScoredCompletedConversationsByStudentId } = require('../models/conversations.model');
const { getAllLessons, getLessonById } = require('../models/lessons.model');
const { getStudentPreferencesByUserId } = require('../models/matching.model');
const { sendSuccess } = require('../utils/response');
const { createHttpError, withErrorHandling } = require('../utils/httpError');
const { validateIdParam } = require('../utils/validators');

/**
 * Private helper — builds a recommended next lesson for the student.
 * Finds lessons matching the student's current level, then ranks them by
 * how many tokens from the student's learning goal text appear in the lesson metadata.
 *
 * @param {object} progress    - The student's progress record
 * @param {object} preferences - The student's matching preferences
 * @returns {{ lessonId, title, reason } | null}
 */
function buildRecommendedLesson(progress, preferences) {
  const normalizedLevel = String(progress.currentLevel || '').trim().toLowerCase();
  const goalText = String(preferences.learning_goal || '').toLowerCase();
  const lessons = getAllLessons();

  // Only consider lessons at the student's current level; fall back to all lessons if none match
  const levelMatchedLessons = lessons.filter((lesson) => {
    return String(lesson.level || '').trim().toLowerCase() === normalizedLevel;
  });
  const candidateLessons = levelMatchedLessons.length > 0 ? levelMatchedLessons : lessons;

  // Score each lesson by how many goal tokens appear in its searchable fields
  const rankedLessons = candidateLessons
    .map((lesson) => {
      const searchableText = [lesson.title, lesson.scene, lesson.aiRole, lesson.grammarRuleId]
        .join(' ')
        .toLowerCase();

      // Split the goal text into tokens and count how many are found in the lesson text
      const matchScore = goalText.split(/[^a-z0-9]+/).filter(Boolean).reduce((score, token) => {
        return searchableText.includes(token) ? score + 1 : score;
      }, 0);

      return {
        lesson,
        matchScore,
      };
    })
    .sort((leftItem, rightItem) => rightItem.matchScore - leftItem.matchScore); // Highest score first

  // Optional chaining (?.) safely accesses .lesson even if the array is empty
  const recommendedLesson = rankedLessons[0]?.lesson || null;

  if (!recommendedLesson) {
    return null;
  }

  return {
    lessonId: recommendedLesson.lessonId,
    title: recommendedLesson.title,
    reason: `Recommended for your ${progress.currentLevel} level and learning goal: ${preferences.learning_goal}.`,
  };
}

/**
 * GET /api/progress/stats
 * Returns summary statistics for the logged-in student's learning progress.
 * The student ID is read from the x-user-id header.
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

  // Fetch recent scored conversations and enrich each with the lesson title
  const scoredConversations = getScoredCompletedConversationsByStudentId(validatedStudentId.value).map(
    (conversation) => ({
      conversationId: conversation.conversationId,
      lessonTitle: getLessonById(conversation.lessonId)?.title || null, // ?. safely handles missing lesson
      aiScore: conversation.aiScore,
      teacherScore: conversation.teacherScore,
      date: conversation.date,
    })
  );

  return sendSuccess(res, 200, scoredConversations);
});

/**
 * GET /api/progress/next-lesson
 * Returns the recommended next lesson for the logged-in student based on their
 * current level and learning preferences. Returns 404 if progress or preferences are missing.
 */
const getNextLesson = withErrorHandling((req, res) => {
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

  return sendSuccess(res, 200, buildRecommendedLesson(progress, preferences));
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