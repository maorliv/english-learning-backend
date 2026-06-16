/**
 * Orchestrates AI-powered lesson conversation turns and scoring.
 * Handles the full lifecycle: session start (with AI opening message), per-turn replies,
 * and final scoring. Falls back gracefully when Gemini is not configured.
 *
 * When the Gemini API is ready:
 *   - generateConversationReply() and scoreConversation() in gemini.service will return real results
 *   - Remove (or keep) the fallback branches below — that's the only change needed
 */
const {
  generateConversationReply,
  scoreConversation: geminiScoreConversation,
} = require('./gemini.service');
const {
  createConversation,
  getConversationById,
  trackVocabAndStoreMessage,
  appendAIMessage,
  markConversationComplete,
} = require('../models/conversations.model');

const FALLBACK_SCORE_BASE = 60;
const FALLBACK_SCORE_PER_WORD = 10;

/**
 * Creates a new conversation session, stores lesson context for future AI calls,
 * and attempts to generate an AI opening message.
 * Returns the conversation object — if the AI opening message was generated it will
 * be in conversation.messages[0]; otherwise messages is empty and the frontend
 * falls back to its own hardcoded greeting.
 *
 * @param {number|string} studentId
 * @param {object}        lesson       - { lessonId, scene, aiRole, grammarRuleId }
 * @param {object|null}   grammarRule  - { category, usage, examples } or null
 * @param {object[]}      vocabulary   - [{ word, definition, ... }]
 * @returns {Promise<object>} The new conversation record
 */
async function startSession(studentId, lesson, grammarRule, vocabulary) {
  const unusedVocab = vocabulary.map((v) => v.word);
  const vocabWithDefinitions = vocabulary.map((v) => ({ word: v.word, definition: v.definition }));

  const lessonContext = {
    scene: lesson.scene,
    aiRole: lesson.aiRole,
    grammarRuleId: lesson.grammarRuleId,
    grammarRuleDetails: grammarRule
      ? { category: grammarRule.category, usage: grammarRule.usage, examples: grammarRule.examples }
      : null,
    vocabWithDefinitions,
  };

  const conversation = createConversation(
    studentId,
    lesson.lessonId,
    unusedVocab,
    lessonContext,
    vocabWithDefinitions
  );

  // Generate opening AI message — stub returns null, frontend falls back to hardcoded greeting
  const openingContent = await generateConversationReply(lessonContext, []);
  if (openingContent) {
    appendAIMessage(conversation.conversationId, openingContent);
  }

  return conversation;
}

/**
 * Processes one student message: tracks vocabulary usage, generates an AI reply.
 * Falls back to a mock reply when AI is not configured.
 *
 * @param {number|string} conversationId
 * @param {string}        content - The student's message text
 * @returns {Promise<{ reply: string, unusedVocab: string[], usedWords: string[] } | null>}
 */
async function generateReply(conversationId, content) {
  const conversation = getConversationById(conversationId);
  if (!conversation) return null;

  // Always track vocabulary usage and store the student message (pure JS, no AI)
  const vocabResult = trackVocabAndStoreMessage(conversationId, content);

  // Attempt AI reply — conversation.messages now includes the student's latest message
  const aiContent = await generateConversationReply(
    conversation.lessonContext,
    conversation.messages
  );

  const reply =
    aiContent ||
    `Mock AI reply: I understood your message about lesson ${conversation.lessonId}.`;

  appendAIMessage(conversationId, reply);

  return {
    reply,
    unusedVocab: vocabResult.unusedVocab,
    usedWords: vocabResult.usedWords,
  };
}

/**
 * Ends the conversation and scores it using AI.
 * Falls back to vocabulary-count scoring when AI is not configured.
 * Score formula fallback: 60 (base) + 10 per vocab word used, capped at 100.
 *
 * @param {number|string} conversationId
 * @returns {Promise<{ conversationId, aiScore, aiFeedback } | null>}
 */
async function finalizeConversation(conversationId) {
  const conversation = getConversationById(conversationId);
  if (!conversation) return null;

  const aiResult = await geminiScoreConversation(
    conversation.lessonContext,
    conversation.messages
  );

  let aiScore, aiFeedback;

  if (!aiResult) {
    const usedWordsCount = Array.isArray(conversation.usedWords) ? conversation.usedWords.length : 0;
    aiScore = Math.min(100, FALLBACK_SCORE_BASE + usedWordsCount * FALLBACK_SCORE_PER_WORD);
    aiFeedback =
      usedWordsCount > 0
        ? 'Good job using lesson vocabulary in the conversation.'
        : 'Good effort. Try using more lesson vocabulary next time.';
  } else {
    aiScore = aiResult.aiScore;
    aiFeedback = aiResult.aiFeedback;
  }

  return markConversationComplete(conversationId, aiScore, aiFeedback);
}

module.exports = { startSession, generateReply, finalizeConversation };
