const studentPreferences = require('./data/studentPreferences.json');
const { getAllTeachers } = require('./teachers.model');

function tokenizeText(value) {
  return String(value || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function getFirstSavedPreferences() {
  return studentPreferences[0] || null;
}

function getStudentPreferencesByUserId(userId) {
  return (
    studentPreferences.find((preferences) => String(preferences.userId) === String(userId)) || null
  );
}

function saveStudentPreferences(userId, preferencesData) {
  const existingPreferencesIndex = studentPreferences.findIndex(
    (preferences) => String(preferences.userId) === String(userId)
  );

  const savedPreferences = {
    userId: Number(userId),
    budget_max: Number(preferencesData.budget_max),
    learning_goal: preferencesData.learning_goal,
    onboarding_text: preferencesData.onboarding_text,
    currentLevel: preferencesData.currentLevel,
  };

  if (existingPreferencesIndex !== -1) {
    studentPreferences.splice(existingPreferencesIndex, 1);
  }

  studentPreferences.unshift(savedPreferences);

  return savedPreferences;
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

  return overlapScore + Number(teacher.rank || 0);
}


function getMockTeacherRecommendationsForPreferences(preferences) {
  if (!preferences) {
    return null;
  }

  const matchingTeachers = getAllTeachers({
    available: true,
    maxPrice: Number(preferences.budget_max),
  });

  return matchingTeachers
    .map((teacher) => ({
      teacherId: teacher.teacherId,
      firstName: teacher.firstName,
      matchScore: calculateMockMatchScore(teacher, preferences),
      rank: teacher.rank,
      pricePerWeek: teacher.pricePerWeek,
      specialties: teacher.specialties,
    }))
    .sort((leftTeacher, rightTeacher) => {
      if (rightTeacher.matchScore !== leftTeacher.matchScore) {
        return rightTeacher.matchScore - leftTeacher.matchScore;
      }

      if (rightTeacher.rank !== leftTeacher.rank) {
        return rightTeacher.rank - leftTeacher.rank;
      }

      return leftTeacher.pricePerWeek - rightTeacher.pricePerWeek;
    });
}

module.exports = {
  getStudentPreferencesByUserId,
  saveStudentPreferences,
  getMockTeacherRecommendationsForPreferences,
};