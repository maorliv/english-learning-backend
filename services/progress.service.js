/**
 * Orchestrates next-lesson recommendation logic.
 * Builds the candidate pool and student context in JS, then delegates ranking to the AI.
 * Falls back to token-overlap scoring when AI is not configured.
 *
 * When the Gemini API is ready:
 *   - recommendNextLesson() in gemini.service will return a real result instead of null
 *   - Remove (or keep) the fallback branch below — that's the only change needed
 */
const { recommendNextLesson } = require('./gemini.service');
const { getAllCompletedConversationsByStudentId } = require('../models/conversations.model');
const { getAllLessons, getLessonById } = require('../models/lessons.model');

/**
 * Fallback ranking when AI is not configured.
 * Scores candidates by token overlap between learning_goal and lesson metadata.
 * Mirrors the original buildRecommendedLesson logic from the controller.
 */
function buildFallbackRecommendation(progress, preferences, candidates) {
  if (!candidates || candidates.length === 0) return null;

  const goalText = String(preferences.learning_goal || '').toLowerCase();

  const ranked = candidates
    .map((lesson) => {
      const searchableText = [lesson.title, lesson.scene, lesson.aiRole, lesson.grammarRuleId]
        .join(' ')
        .toLowerCase();
      const matchScore = goalText
        .split(/[^a-z0-9]+/)
        .filter(Boolean)
        .reduce((score, token) => (searchableText.includes(token) ? score + 1 : score), 0);
      return { lesson, matchScore };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  const recommended = ranked[0]?.lesson || null;
  if (!recommended) return null;

  return {
    lessonId: recommended.lessonId,
    title: recommended.title,
    reason: `Recommended for your ${progress.currentLevel} level and learning goal: ${preferences.learning_goal}.`,
  };
}

/**
 * Returns the recommended next lesson for a student.
 * Excludes already-completed lessons and respects cumulative level access.
 * If the student has finished all accessible lessons, falls back to re-recommending from the full unlocked set.
 *
 * @param {object} progress    - The student's progress record (from progress.model)
 * @param {object} preferences - The student's saved preferences (from matching.model)
 * @returns {Promise<{ lessonId: number, title: string, reason: string } | null>}
 */
async function getNextLessonRecommendation(progress, preferences) {
  const completed = getAllCompletedConversationsByStudentId(progress.studentId);

  // Best score per lesson — teacherScore takes priority over aiScore
  const bestScoreByLesson = {};
  for (const c of completed) {
    const score = c.teacherScore ?? c.aiScore;
    if (score !== null && score !== undefined) {
      const prev = bestScoreByLesson[c.lessonId];
      bestScoreByLesson[c.lessonId] = prev === undefined ? score : Math.max(prev, score);
    }
  }

  const completedIds = new Set((progress.completedLessonIds || []).map(String));

  // Unlocked lessons (cumulative level access) that the student hasn't finished yet
  const unlockedLessons = getAllLessons(progress.currentLevel).filter((l) => !l.locked);
  const candidates = unlockedLessons.filter((l) => !completedIds.has(String(l.lessonId)));

  // If the student has completed everything accessible, allow re-recommending from the full unlocked set
  const pool = candidates.length > 0 ? candidates : unlockedLessons;

  // Compact context for the AI (cap recentScores at 10 to keep the prompt short)
  const scoreEntries = Object.values(bestScoreByLesson);
  const overallAverage =
    scoreEntries.length > 0
      ? Math.round(scoreEntries.reduce((sum, s) => sum + s, 0) / scoreEntries.length)
      : null;

  const recentScores = Object.entries(bestScoreByLesson)
    .map(([lessonId, score]) => {
      const lesson = getLessonById(Number(lessonId));
      return { lessonId: Number(lessonId), grammarRuleId: lesson?.grammarRuleId || null, score };
    })
    .slice(0, 10);

  const studentContext = {
    currentLevel: progress.currentLevel,
    learning_goal: preferences.learning_goal,
    mainGoal: preferences.mainGoal || null,
    onboarding_text: preferences.onboarding_text || null,
    overallAverage,
    recentScores,
  };

  const candidatePayload = pool.map((l) => ({
    lessonId: l.lessonId,
    title: l.title,
    scene: l.scene,
    aiRole: l.aiRole,
    grammarRuleId: l.grammarRuleId,
  }));

  const aiResult = await recommendNextLesson(studentContext, candidatePayload);

  if (!aiResult) {
    return buildFallbackRecommendation(progress, preferences, pool);
  }

  const lesson = getLessonById(aiResult.lessonId);
  if (!lesson) {
    // AI returned an invalid lessonId — degrade gracefully
    return buildFallbackRecommendation(progress, preferences, pool);
  }

  return {
    lessonId: lesson.lessonId,
    title: lesson.title,
    reason: aiResult.reason,
  };
}

module.exports = { getNextLessonRecommendation };
