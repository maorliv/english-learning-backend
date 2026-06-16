/**
 * AI provider boundary — all Gemini API interactions live here.
 * The rest of the backend calls rankTeachers() and never references Gemini directly.
 *
 * To plug in the Gemini API:
 *   1. npm install @google/generative-ai
 *   2. Add GEMINI_API_KEY to .env
 *   3. Replace the stub below with the real implementation:
 *
 *   const { GoogleGenerativeAI } = require('@google/generative-ai');
 *   const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
 *   const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
 *
 *   Then inside rankTeachers, build a prompt, call model.generateContent(prompt),
 *   parse the JSON from response.response.text(), and return the rankings array.
 */

/**
 * Ranks a pre-filtered list of teacher candidates for the given student profile.
 *
 * @param {object} studentProfile - The student's saved preferences
 * @param {object[]} candidates   - Teachers already filtered by budget/availability
 * @returns {Promise<Array<{ teacherId: number, matchScore: number, matchReason: string }> | null>}
 *   Returns null when AI is not configured — matching.service falls back to mock scoring.
 *
 * Expected prompt structure (for future implementation):
 *   - Tell the model to act as a teacher matching assistant
 *   - Include studentProfile fields: learning_goal, onboarding_text, currentLevel, mainGoal
 *   - Include candidates as a compact JSON array (teacherId, specialties, experience, bio)
 *   - Ask for a JSON array of { teacherId, matchScore (1–10), matchReason } sorted descending
 *   - Set response_mime_type to 'application/json' if using the Gemini SDK
 */
async function rankTeachers(studentProfile, candidates) {
  // AI not yet configured — return null to trigger fallback in matching.service
  return null;
}

module.exports = { rankTeachers };
