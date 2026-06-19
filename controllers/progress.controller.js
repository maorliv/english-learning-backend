const { sendSuccess } = require('../utils/response');
const { createHttpError, withErrorHandling } = require('../utils/httpError');
const { validateIdParam } = require('../utils/validators');
const progressService = require('../services/progress.service');
const conversationsService = require('../services/conversations.service');
const lessonsService = require('../services/lessons.service');
const teachersService = require('../services/teachers.service');
const matchingService = require('../services/matching.service');
const { askGemini } = require('../services/gemini');

const SUCCESS_THRESHOLD = 70;

async function buildRecommendedLesson(progress, preferences) {
  const lessons = await lessonsService.getAllLessons();

  try {
    const lessonSummaries = lessons.map(l => ({
      lessonId: l.lessonId,
      title: l.title,
      scene: l.scene,
      level: l.level,
      aiRole: l.aiRole,
    }));

    const prompt = `You are a lesson recommendation system for an English learning platform.

STUDENT PROFILE:
- Current level: "${progress.currentLevel}"
- Learning goal: "${preferences.learning_goal}"

AVAILABLE LESSONS (JSON array):
${JSON.stringify(lessonSummaries)}

Select the ONE best lesson for this student. Consider:
1. The lesson level should match the student's current level
2. The lesson topic/scene should align with their learning goal
3. Prefer variety

Respond ONLY with a JSON object in this exact format, no other text:
{"lessonId": <number>, "title": "<lesson title>", "reason": "<1 sentence explaining why this lesson is recommended>"}`;

    const rawResponse = await askGemini(prompt);
    const cleaned = rawResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const validLesson = lessons.find(l => l.lessonId === parsed.lessonId);
    if (validLesson && parsed.reason) {
      return {
        lessonId: validLesson.lessonId,
        title: validLesson.title,
        reason: parsed.reason,
      };
    }
    throw new Error('Gemini recommended invalid lesson ID');
  } catch (error) {
    console.error('Gemini lesson recommendation error:', error.message);
    // Fallback: original keyword matching
    const normalizedLevel = String(progress.currentLevel || '').trim().toLowerCase();
    const goalText = String(preferences.learning_goal || '').toLowerCase();

    const levelMatchedLessons = lessons.filter(l => String(l.level || '').trim().toLowerCase() === normalizedLevel);
    const candidateLessons = levelMatchedLessons.length > 0 ? levelMatchedLessons : lessons;

    const rankedLessons = candidateLessons
      .map(lesson => {
        const searchableText = [lesson.title, lesson.scene, lesson.aiRole, lesson.grammarRuleId].join(' ').toLowerCase();
        const matchScore = goalText.split(/[^a-z0-9]+/).filter(Boolean).reduce((score, token) => {
          return searchableText.includes(token) ? score + 1 : score;
        }, 0);
        return { lesson, matchScore };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    const recommended = rankedLessons[0]?.lesson || null;
    if (!recommended) return null;

    return {
      lessonId: recommended.lessonId,
      title: recommended.title,
      reason: `Recommended for your ${progress.currentLevel} level and learning goal: ${preferences.learning_goal}.`,
    };
  }
}

const getProgressStats = withErrorHandling(async (req, res) => {
  const vId = validateIdParam(req.header('x-user-id'), 'x-user-id');
  if (!vId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', vId.message, vId.details);

  const progress = await progressService.getProgressByStudentId(vId.value);
  if (!progress) throw createHttpError(404, 'PROGRESS_NOT_FOUND', 'Progress not found for this student', { studentId: vId.value });

  const completed = await conversationsService.getAllCompletedConversationsByStudentId(vId.value);

  const bestScoreByLesson = {};
  for (const c of completed) {
    const score = c.teacherScore ?? c.aiScore;
    if (score !== null && score !== undefined) {
      const prev = bestScoreByLesson[c.lessonId];
      bestScoreByLesson[c.lessonId] = prev === undefined ? score : Math.max(prev, score);
    }
  }

  const completedLessonsCount = new Set(completed.map(c => c.lessonId)).size;
  const lessonScores = Object.values(bestScoreByLesson);
  const successedLessonsCount = lessonScores.filter(s => s >= SUCCESS_THRESHOLD).length;
  const overallAverage = lessonScores.length > 0 ? Math.round(lessonScores.reduce((sum, s) => sum + s, 0) / lessonScores.length) : 0;

  const dates = completed.map(c => c.date).filter(Boolean);
  const lastActivityDate = dates.length > 0 ? dates.reduce((latest, d) => (d > latest ? d : latest)) : progress.lastActivityDate;

  return sendSuccess(res, 200, { currentLevel: progress.currentLevel, completedLessonsCount, successedLessonsCount, overallAverage, lastActivityDate });
});

const getProgressChart = withErrorHandling(async (req, res) => {
  const vId = validateIdParam(req.header('x-user-id'), 'x-user-id');
  if (!vId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', vId.message, vId.details);

  const scoredConversations = await conversationsService.getScoredCompletedConversationsByStudentId(vId.value);
  const result = await Promise.all(scoredConversations.map(async (c) => {
    const enrichedReviews = await Promise.all((c.teacherReviews || []).map(async (r) => {
      const teacher = await teachersService.getTeacherById(r.teacherId);
      return { teacherId: r.teacherId, teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : null, teacherScore: r.teacherScore };
    }));

    const lesson = await lessonsService.getLessonById(c.lessonId);
    return { conversationId: c.conversationId, lessonTitle: lesson?.title || null, aiScore: c.aiScore, teacherReviews: enrichedReviews, date: c.date };
  }));

  return sendSuccess(res, 200, result);
});

const getNextLesson = withErrorHandling(async (req, res) => {
  const vId = validateIdParam(req.header('x-user-id'), 'x-user-id');
  if (!vId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', vId.message, vId.details);

  const progress = await progressService.getProgressByStudentId(vId.value);
  if (!progress) throw createHttpError(404, 'PROGRESS_NOT_FOUND', 'Progress not found for this student', { studentId: vId.value });

  const preferences = await matchingService.getStudentPreferencesByUserId(vId.value);
  if (!preferences) throw createHttpError(404, 'PREFERENCES_NOT_FOUND', 'Student preferences not found', { studentId: vId.value });

  return sendSuccess(res, 200, await buildRecommendedLesson(progress, preferences));
});

const getStudentProgress = withErrorHandling(async (req, res) => {
  const vId = validateIdParam(req.params.studentId, 'studentId');
  if (!vId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', vId.message, vId.details);

  const progress = await progressService.getProgressByStudentId(vId.value);
  if (!progress) throw createHttpError(404, 'PROGRESS_NOT_FOUND', 'Progress not found for this student', { studentId: vId.value });

  return sendSuccess(res, 200, {
    currentLevel: progress.currentLevel,
    completedLessonsCount: progress.completedLessonsCount,
    successedLessonsCount: progress.successedLessonsCount,
    overallAverage: progress.overallAverage,
  });
});

module.exports = { getProgressChart, getNextLesson, getProgressStats, getStudentProgress };
