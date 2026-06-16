/**
 * Orchestrates AI-powered level assessment conversations.
 * Generates contextual follow-up questions and classifies the student's level.
 * Falls back gracefully when Gemini is not configured.
 *
 * When the Gemini API is ready:
 *   - generateAssessmentReply() and classifyLevel() in gemini.service will return real results
 *   - Remove (or keep) the fallback branches below — that's the only change needed
 */
const { generateAssessmentReply, classifyLevel } = require('./gemini.service');
const { getAssessmentById } = require('../models/assessment.model');

const FALLBACK_REPLY =
  'Thank you! Can you describe a recent challenge you faced at work and explain what you did to solve it?';
const FALLBACK_LEVEL = 'Beginner';

/**
 * Stores a student message and generates the next AI follow-up question.
 * Falls back to the hardcoded follow-up when AI is not configured.
 *
 * @param {number|string} assessmentId
 * @param {string}        content - The student's message text
 * @returns {Promise<{ reply: string } | null>}
 */
async function processMessage(assessmentId, content) {
  const assessment = getAssessmentById(assessmentId);
  if (!assessment) return null;

  assessment.messages.push({
    role: 'student',
    content,
    createdAt: new Date().toISOString(),
  });

  const aiReply = await generateAssessmentReply(assessment.messages);
  const reply = aiReply || FALLBACK_REPLY;

  assessment.messages.push({
    role: 'assistant',
    content: reply,
    createdAt: new Date().toISOString(),
  });

  return { reply };
}

/**
 * Ends the assessment by classifying the student's English level from their messages.
 * Falls back to 'Beginner' stub when AI is not configured.
 *
 * @param {number|string} assessmentId
 * @returns {Promise<{ assessmentId: number, detectedLevel: string } | null>}
 */
async function finalizeAssessment(assessmentId) {
  const assessment = getAssessmentById(assessmentId);
  if (!assessment) return null;

  const studentMessages = assessment.messages
    .filter((m) => m.role === 'student')
    .map((m) => m.content);

  const detectedLevel = (await classifyLevel(studentMessages)) || FALLBACK_LEVEL;

  assessment.status = 'completed';
  assessment.detectedLevel = detectedLevel;
  assessment.endedAt = new Date().toISOString();

  return {
    assessmentId: assessment.assessmentId,
    detectedLevel,
  };
}

module.exports = { processMessage, finalizeAssessment };
