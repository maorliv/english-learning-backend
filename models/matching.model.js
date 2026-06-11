const { studentPreferences } = require('./store');
const { getAllTeachers } = require('./teachers.model');

/**
 * Splits a string value into lowercase tokens (words).
 * Used to compare preference text against teacher specialties/experience.
 */
function tokenizeText(value) {
  return String(value || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** Returns the first saved preference record. Used to seed demo recommendations if the user has none. */
function getFirstSavedPreferences() {
  return studentPreferences[0] || null;
}

/** Finds a student's saved preferences by their userId. Returns null if not found. */
function getStudentPreferencesByUserId(userId) {
  return (
    studentPreferences.find((preferences) => String(preferences.userId) === String(userId)) || null
  );
}

/**
 * Saves or replaces a student's teacher preferences (upsert).
 * If a previous record for this userId exists, it is removed first.
 * The new record is inserted at the front of the array (unshift) so it's found first.
 */
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
    // Optional onboarding fields — stored as-is; undefined if not provided by the client
    availability: preferencesData.availability ?? null,
    teacherGender: preferencesData.teacherGender ?? null,
    mainGoal: preferencesData.mainGoal ?? null,
    onlineOnly: preferencesData.onlineOnly ?? null,
  };

  if (existingPreferencesIndex !== -1) {
    studentPreferences.splice(existingPreferencesIndex, 1); // Remove existing record before reinserting
  }

  studentPreferences.unshift(savedPreferences); // Prepend so find() returns this record first

  return savedPreferences;
}

/**
 * Computes a mock match score between a teacher and a set of student preferences.
 *
 * Scoring breakdown:
 *   +10  per token overlap between preference text (learning_goal, onboarding_text, currentLevel)
 *        and teacher profile (specialties, experience)
 *   + 8  if student mainGoal matches any teacher specialty token
 *   + 5  if student onlineOnly preference matches teacher.onlineOnly
 *   + teacher.rank (base quality signal)
 *
 * Higher score = better match.
 */
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

  // Base: count overlapping tokens between preference text and teacher profile
  const overlapScore = Array.from(preferenceTokens).reduce((score, token) => {
    return teacherTokens.has(token) ? score + 10 : score;
  }, 0);

  // Bonus: mainGoal token overlap against teacher specialties (+8 per matching token)
  const mainGoalTokens = tokenizeText(preferences.mainGoal);
  const specialtyTokens = new Set(
    tokenizeText(Array.isArray(teacher.specialties) ? teacher.specialties.join(' ') : '')
  );
  const mainGoalBonus = mainGoalTokens.reduce((score, token) => {
    return specialtyTokens.has(token) ? score + 8 : score;
  }, 0);

  // Bonus: onlineOnly alignment — student wants online-only and teacher is online-only (+5)
  const onlineBonus =
    preferences.onlineOnly === true && teacher.onlineOnly === true ? 5 : 0;

  return overlapScore + mainGoalBonus + onlineBonus + Number(teacher.rank || 0);
}

/**
 * Returns a ranked list of available teacher recommendations for the given preferences.
 * Only teachers who are available and within budget are included.
 * Sorted by: matchScore DESC, rank DESC, pricePerWeek ASC.
 */
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
        return rightTeacher.matchScore - leftTeacher.matchScore; // Higher score first
      }

      if (rightTeacher.rank !== leftTeacher.rank) {
        return rightTeacher.rank - leftTeacher.rank; // Higher rank first
      }

      return leftTeacher.pricePerWeek - rightTeacher.pricePerWeek; // Lower price first
    });
}

module.exports = {
  getStudentPreferencesByUserId,
  saveStudentPreferences,
  getMockTeacherRecommendationsForPreferences,
};