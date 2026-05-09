const { getProgressByStudentId } = require('../models/progress.model');
const { getScoredCompletedConversationsByStudentId } = require('../models/conversations.model');
const { getAllLessons, getLessonById } = require('../models/lessons.model');
const { getStudentPreferencesByUserId } = require('../models/matching.model');
const { sendError, sendSuccess } = require('../utils/response');
const { validateIdParam } = require('../utils/validators');

function buildRecommendedLesson(progress, preferences) {
  const normalizedLevel = String(progress.currentLevel || '').trim().toLowerCase();
  const goalText = String(preferences.learning_goal || '').toLowerCase();
  const lessons = getAllLessons();
  const levelMatchedLessons = lessons.filter((lesson) => {
    return String(lesson.level || '').trim().toLowerCase() === normalizedLevel;
  });
  const candidateLessons = levelMatchedLessons.length > 0 ? levelMatchedLessons : lessons;

  const rankedLessons = candidateLessons
    .map((lesson) => {
      const searchableText = [lesson.title, lesson.scene, lesson.aiRole, lesson.grammarRuleId]
        .join(' ')
        .toLowerCase();
      const matchScore = goalText.split(/[^a-z0-9]+/).filter(Boolean).reduce((score, token) => {
        return searchableText.includes(token) ? score + 1 : score;
      }, 0);

      return {
        lesson,
        matchScore,
      };
    })
    .sort((leftItem, rightItem) => rightItem.matchScore - leftItem.matchScore);

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

function getProgressSkills(req, res) {
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
    skillsRadar: progress.skillsRadar,
  });
}

function getNextLesson(req, res) {
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

  const preferences = getStudentPreferencesByUserId(validatedStudentId.value);

  if (!preferences) {
    return sendError(
      res,
      404,
      'PREFERENCES_NOT_FOUND',
      'Student preferences not found',
      {
        studentId: validatedStudentId.value,
      }
    );
  }

  return sendSuccess(res, 200, buildRecommendedLesson(progress, preferences));
}

function getStudentProgress(req, res) {
  const validatedStudentId = validateIdParam(req.params.studentId, 'studentId');

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
    skillsRadar: progress.skillsRadar,
  });
}

module.exports = {
  getProgressChart,
  getNextLesson,
  getProgressSkills,
  getProgressStats,
  getStudentProgress,
};