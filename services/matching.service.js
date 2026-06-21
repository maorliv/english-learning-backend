const prisma = require('../prisma/client');
const teachersService = require('./teachers.service');
const { askGemini } = require('./gemini');

/** Splits text into lowercase alphanumeric tokens for keyword-overlap scoring. */
function tokenizeText(value) {
  return String(value || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

async function getStudentPreferencesByUserId(userId) {
  return prisma.studentPreferences.findUnique({
    where: { userId: Number(userId) },
  });
}

async function saveStudentPreferences(userId, data) {
  return prisma.studentPreferences.upsert({
    where: { userId: Number(userId) },
    update: {
      budget_max: Number(data.budget_max),
      learning_goal: data.learning_goal,
      onboarding_text: data.onboarding_text,
      currentLevel: data.currentLevel || null,
      availability: data.availability ?? null,
      teacherGender: data.teacherGender ?? null,
      mainGoal: data.mainGoal ?? null,
      onlineOnly: data.onlineOnly ?? null,
    },
    create: {
      userId: Number(userId),
      budget_max: Number(data.budget_max),
      learning_goal: data.learning_goal,
      onboarding_text: data.onboarding_text,
      currentLevel: data.currentLevel || null,
      availability: data.availability ?? null,
      teacherGender: data.teacherGender ?? null,
      mainGoal: data.mainGoal ?? null,
      onlineOnly: data.onlineOnly ?? null,
    },
  });
}

/** Fallback token-overlap scorer used when Gemini is unavailable; combines goal/specialty overlap, online pref, and rank. */
function calculateMockMatchScore(teacher, preferences) {
  const preferenceTokens = new Set([
    ...tokenizeText(preferences.learning_goal),
    ...tokenizeText(preferences.onboarding_text),
    ...tokenizeText(preferences.currentLevel),
  ]);
  const teacherTokens = new Set([
    ...tokenizeText(Array.isArray(teacher.specialties) ? teacher.specialties.join(' ') : ''),
    ...tokenizeText(teacher.experience),
  ]);

  const overlapScore = Array.from(preferenceTokens).reduce((score, token) => {
    return teacherTokens.has(token) ? score + 10 : score;
  }, 0);

  const mainGoalTokens = tokenizeText(preferences.mainGoal);
  const specialtyTokens = new Set(
    tokenizeText(Array.isArray(teacher.specialties) ? teacher.specialties.join(' ') : '')
  );
  const mainGoalBonus = mainGoalTokens.reduce((score, token) => {
    return specialtyTokens.has(token) ? score + 8 : score;
  }, 0);

  const onlineBonus = preferences.onlineOnly === true && teacher.onlineOnly === true ? 5 : 0;

  return overlapScore + mainGoalBonus + onlineBonus + Number(teacher.rank || 0);
}

/** Scores all budget-eligible teachers via Gemini semantic matching, falling back to token-overlap on error. */
async function getRecommendationsForPreferences(preferences) {
  if (!preferences) return null;

  const teachers = await teachersService.getAllTeachers({
    available: true,
    maxPrice: Number(preferences.budget_max),
  });

  // Try Gemini-based semantic matching (single prompt for all teachers)
  let geminiScores = null;
  try {
    const teacherSummaries = teachers.map(t => ({
      teacherId: t.teacherId,
      specialties: t.specialties,
      experience: t.experience,
      bio: t.bio,
      onlineOnly: t.onlineOnly,
      teachingLevels: t.teachingLevels,
    }));

    const prompt = `You are a teacher-student matching system for an English learning platform.

STUDENT PROFILE:
- Learning goal: "${preferences.learning_goal}"
- Self-description: "${preferences.onboarding_text}"
- Main goal: "${preferences.mainGoal}"
- Current level: "${preferences.currentLevel}"
- Prefers online only: ${preferences.onlineOnly}

AVAILABLE TEACHERS (JSON array):
${JSON.stringify(teacherSummaries)}

For each teacher, rate their compatibility with this student on a scale of 0-100.
Consider: specialty match with learning goal, experience relevance, teaching level compatibility, and online preference match.

Respond ONLY with a JSON array in this exact format, no other text:
[{"teacherId": <number>, "score": <number 0-100>}, ...]`;

    const rawResponse = await askGemini(prompt);
    const cleaned = rawResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (Array.isArray(parsed)) {
      geminiScores = new Map(parsed.map(item => [item.teacherId, item.score]));
    }
  } catch (error) {
    console.error('Gemini matching error:', error.message);
  }

  return teachers
    .map(teacher => ({
      teacherId: teacher.teacherId,
      firstName: teacher.firstName,
      matchScore: geminiScores
        ? (geminiScores.get(teacher.teacherId) || 0)
        : calculateMockMatchScore(teacher, preferences),
      rank: teacher.rank,
      pricePerWeek: teacher.pricePerWeek,
      specialties: teacher.specialties,
    }))
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      if (b.rank !== a.rank) return b.rank - a.rank;
      return a.pricePerWeek - b.pricePerWeek;
    });
}

module.exports = {
  getStudentPreferencesByUserId,
  saveStudentPreferences,
  getRecommendationsForPreferences,
};
