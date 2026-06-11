const { getProgressByStudentId } = require('../models/progress.model');
const {
  getScoredCompletedConversationsByStudentId,
  getAllCompletedConversationsByStudentId,
} = require('../models/conversations.model');
const { getAllLessons, getLessonById } = require('../models/lessons.model');
const { getTeacherById } = require('../models/teachers.model');
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