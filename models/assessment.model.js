const { assessments } = require('./store');

/**
 * Creates a new assessment session for a student.
 * The session starts with an AI prompt asking an open-ended diagnostic question.
 * Returns the new assessment object including the first AI message.
 *
 * @param {number} studentId
 * @returns {object} The new assessment session
 */
function createAssessment(studentId) {
  const nextAssessmentId =
    assessments.reduce((maxId, a) => Math.max(maxId, Number(a.assessmentId) || 0), 0) + 1;

  const firstPrompt =
    'Hello! To help us understand your current English level, please tell me a little about yourself. ' +
    'For example: What do you do for work, and how do you use English in your job?';

  const newAssessment = {
    assessmentId: nextAssessmentId,
    studentId: Number(studentId),
    status: 'active',
    messages: [
      {
        role: 'assistant',
        content: firstPrompt,
        createdAt: new Date().toISOString(),
      },
    ],
    detectedLevel: null,
    createdAt: new Date().toISOString(),
    endedAt: null,
  };

  assessments.push(newAssessment);

  return newAssessment;
}

/**
 * Finds an active assessment session by its numeric ID.
 * Returns null if not found.
 *
 * @param {number|string} assessmentId
 * @returns {object|null}
 */
function getAssessmentById(assessmentId) {
  return (
    assessments.find((a) => String(a.assessmentId) === String(assessmentId)) || null
  );
}

/**
 * Appends a student message to the assessment and generates a follow-up AI prompt.
 * The AI prompt encourages the student to elaborate, giving the end handler more text to analyse.
 * Returns the AI reply string, or null if the assessment was not found.
 *
 * @param {number|string} assessmentId
 * @param {string}        content       - The student's message text
 * @returns {{ reply: string } | null}
 */
function addMessageToAssessment(assessmentId, content) {
  const assessment = getAssessmentById(assessmentId);

  if (!assessment) {
    return null;
  }

  assessment.messages.push({
    role: 'student',
    content,
    createdAt: new Date().toISOString(),
  });

  // Fixed follow-up prompt — encourages the student to produce more language for analysis
  const reply =
    'Thank you! Can you describe a recent challenge you faced at work and explain what you did to solve it?';

  assessment.messages.push({
    role: 'assistant',
    content: reply,
    createdAt: new Date().toISOString(),
  });

  return { reply };
}

/**
 * Ends the assessment session and determines the student's English proficiency level.
 *
 * INTENDED IMPLEMENTATION — Gemini API (not yet active):
 *   The full conversation history (all student messages) will be sent to the Gemini API
 *   with a structured prompt asking it to classify the student as one of:
 *   'Beginner', 'Intermediate', or 'Advanced'.
 *   Gemini will evaluate vocabulary range, grammar accuracy, sentence complexity,
 *   and overall fluency across the entire conversation before returning a single level label.
 *
 * CURRENT BEHAVIOUR — stub (Gemini integration not yet implemented):
 *   Always returns 'Beginner' as a safe default so the rest of the onboarding flow
 *   (progress update, teacher matching) can be tested end-to-end without the AI call.
 *   Replace the stub block below with the Gemini API call when integration is ready.
 *
 * Marks the assessment as completed and writes detectedLevel to the session.
 * Returns { assessmentId, detectedLevel } or null if the session is not found.
 *
 * @param {number|string} assessmentId
 * @returns {{ assessmentId: number, detectedLevel: string } | null}
 */
function endAssessment(assessmentId) {
  const assessment = getAssessmentById(assessmentId);

  if (!assessment) {
    return null;
  }

  // --- Gemini API integration point ---
  // TODO: Replace this stub with an async call to the Gemini API.
  //   1. Collect all student messages from assessment.messages where role === 'student'.
  //   2. Send them to Gemini with a prompt such as:
  //      "Based on the following English conversation by a student, classify their
  //       proficiency level as exactly one of: Beginner, Intermediate, Advanced.
  //       Return only the level label."
  //   3. Parse the response and assign the returned label to detectedLevel.
  // ------------------------------------
  const detectedLevel = 'Beginner'; // Stub default — replace with Gemini response

  assessment.status = 'completed';
  assessment.detectedLevel = detectedLevel;
  assessment.endedAt = new Date().toISOString();

  return {
    assessmentId: assessment.assessmentId,
    detectedLevel,
  };
}

module.exports = {
  createAssessment,
  getAssessmentById,
  addMessageToAssessment,
  endAssessment,
};
