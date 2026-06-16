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

/**
 * Picks the single best next lesson for a student from a set of candidates.
 *
 * @param {object} studentContext
 *   { currentLevel, learning_goal, mainGoal, onboarding_text, overallAverage,
 *     recentScores: [{ lessonId, grammarRuleId, score }] }
 * @param {object[]} candidates
 *   [{ lessonId, title, scene, aiRole, grammarRuleId }] — already filtered to unlocked + uncompleted
 * @returns {Promise<{ lessonId: number, reason: string } | null>}
 *   Returns null when AI is not configured — progress.service falls back to token-overlap scoring.
 *
 * Expected prompt structure (for future implementation):
 *   - Tell the model to act as a language learning coach
 *   - Include studentContext: level, goal, mainGoal, overallAverage, recentScores with grammarRuleIds
 *   - Include candidates as a compact JSON array
 *   - Ask for exactly one lesson: JSON { lessonId, reason } where reason is one sentence
 *   - Set response_mime_type to 'application/json' if using the Gemini SDK
 */
async function recommendNextLesson(studentContext, candidates) {
  // AI not yet configured — return null to trigger fallback in progress.service
  return null;
}

/**
 * Generates an AI reply during a lesson conversation.
 *
 * @param {object} lessonContext
 *   { scene, aiRole, grammarRuleId, grammarRuleDetails: { category, usage, examples }, vocabWithDefinitions: [{ word, definition }] }
 * @param {object[]} messages - Full conversation history so far [{ role, content }]
 * @returns {Promise<string | null>}
 *   Returns null when AI is not configured — conversation.service falls back to mock reply.
 *
 * Expected prompt structure (for future implementation):
 *   System prompt:
 *     You are playing the role of [aiRole] in the following scene: [scene].
 *     The student must practice this grammar rule: [grammarRuleDetails.usage]
 *     They should naturally use these vocabulary words: [vocabWithDefinitions]
 *     Engage naturally, keep replies concise (2–3 sentences), and gently steer
 *     the conversation if the student isn't using the target grammar or vocab.
 *   Pass conversation history as alternating user/model turns.
 *   Return only the reply text (no JSON wrapper).
 */
async function generateConversationReply(lessonContext, messages) {
  return null;
}

/**
 * Scores a completed lesson conversation on grammar, vocabulary, and fluency.
 *
 * @param {object} lessonContext - Same shape as generateConversationReply's lessonContext
 * @param {object[]} messages    - Full conversation history
 * @returns {Promise<{ aiScore: number, aiFeedback: string } | null>}
 *   Returns null when AI is not configured — conversation.service falls back to vocab-count scoring.
 *
 * Expected prompt structure (for future implementation):
 *   Evaluate this English conversation by a student. Score 0–100 based on:
 *   - Correct and natural usage of the target grammar rule: [grammarRuleDetails]
 *   - Natural integration of the required vocabulary words: [vocabWithDefinitions]
 *   - Overall fluency and coherence
 *   Return JSON: { aiScore, aiFeedback } where aiFeedback is 1–2 sentences.
 *   Set response_mime_type to 'application/json' if using the Gemini SDK.
 */
async function scoreConversation(lessonContext, messages) {
  return null;
}

/**
 * Generates a contextual follow-up question in a level assessment conversation.
 *
 * @param {object[]} messages - All messages so far [{ role, content }]
 * @returns {Promise<string | null>}
 *   Returns null when AI is not configured — assessment.service falls back to hardcoded follow-up.
 *
 * Expected prompt structure (for future implementation):
 *   System prompt:
 *     You are conducting an English proficiency assessment.
 *     Read the conversation so far and ask one targeted follow-up question that probes
 *     a different dimension of fluency (grammar accuracy, vocabulary range, sentence
 *     complexity, etc.). Keep questions open-ended to elicit diagnostic responses.
 *   Pass conversation history as alternating user/model turns.
 *   Return only the question text (no JSON wrapper).
 */
async function generateAssessmentReply(messages) {
  return null;
}

/**
 * Classifies a student's English level from their assessment messages.
 *
 * @param {string[]} studentMessages - All messages written by the student during the assessment
 * @returns {Promise<'Beginner' | 'Intermediate' | 'Advanced' | null>}
 *   Returns null when AI is not configured — assessment.service falls back to 'Beginner' stub.
 *
 * Expected prompt structure (for future implementation):
 *   Based on the following English writing samples from a student, classify their
 *   proficiency level as exactly one of: Beginner, Intermediate, Advanced.
 *   Evaluate: vocabulary range, grammar accuracy, sentence complexity, and overall fluency.
 *   Return only the level label as a single word.
 */
async function classifyLevel(studentMessages) {
  return null;
}

module.exports = {
  rankTeachers,
  recommendNextLesson,
  generateConversationReply,
  scoreConversation,
  generateAssessmentReply,
  classifyLevel,
};
