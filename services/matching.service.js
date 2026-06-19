const prisma = require('../prisma/client');
const teachersService = require('./teachers.service');

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

async function getRecommendationsForPreferences(preferences) {
  if (!preferences) return null;

  const teachers = await teachersService.getAllTeachers({
    available: true,
    maxPrice: Number(preferences.budget_max),
  });

  return teachers
    .map(teacher => ({
      teacherId: teacher.teacherId,
      firstName: teacher.firstName,
      matchScore: calculateMockMatchScore(teacher, preferences),
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
