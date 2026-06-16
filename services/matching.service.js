/**
 * Orchestrates teacher recommendation logic.
 * Hard filtering (budget, availability) always runs in JS.
 * AI ranking is attempted via gemini.service; falls back to mock scoring if not configured.
 *
 * When the Gemini API is ready:
 *   - rankTeachers() will return real rankings instead of null
 *   - Remove (or keep) the fallback branch below — that's the only change needed
 */
const { rankTeachers } = require('./gemini.service');
const {
  getFilteredTeachers,
  getMockTeacherRecommendationsForPreferences,
} = require('../models/matching.model');

/**
 * Returns a ranked list of teacher recommendations for the given student preferences.
 *
 * @param {object} preferences - The student's saved preference record
 * @returns {Promise<object[]>} Ranked teacher list, each with matchScore and (when AI is live) matchReason
 */
async function getRecommendations(preferences) {
  if (!preferences) return null;

  const candidates = getFilteredTeachers(preferences);

  const aiRankings = await rankTeachers(preferences, candidates);

  if (!aiRankings) {
    // AI not configured — delegate entirely to mock scoring (includes its own sort)
    return getMockTeacherRecommendationsForPreferences(preferences);
  }

  // Merge AI rankings with the full candidate objects
  const teacherMap = new Map(candidates.map((t) => [t.teacherId, t]));

  return aiRankings.map((ranking) => {
    const teacher = teacherMap.get(ranking.teacherId);
    return {
      teacherId: teacher.teacherId,
      firstName: teacher.firstName,
      matchScore: ranking.matchScore,
      matchReason: ranking.matchReason,
      rank: teacher.rank,
      pricePerWeek: teacher.pricePerWeek,
      specialties: teacher.specialties,
    };
  });
}

module.exports = { getRecommendations };
