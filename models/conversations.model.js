const { conversations } = require('./store');

/**
 * Returns the most recent completed and scored conversations for a student.
 * Used to build the score history shown in the progress chart.
 * Sorted by date descending and limited to `limit` results (default 5).
 */
function getScoredCompletedConversationsByStudentId(studentId, limit = 5) {
  return conversations
    .filter((conversation) => String(conversation.studentId) === String(studentId))
    .filter((conversation) => conversation.status === 'completed')
    .filter((conversation) => conversation.aiScore !== null || conversation.teacherReviews.length > 0)
    .sort((leftConversation, rightConversation) => {
      const leftDate = new Date(leftConversation.endedAt || leftConversation.createdAt).getTime();
      const rightDate = new Date(rightConversation.endedAt || rightConversation.createdAt).getTime();

      return rightDate - leftDate;
    })
    .slice(0, limit)
    .map((conversation) => ({
      conversationId: conversation.conversationId,
      lessonId: conversation.lessonId,
      aiScore: conversation.aiScore,
      teacherReviews: conversation.teacherReviews,
      date: conversation.endedAt || conversation.createdAt,
    }));
}

/**
 * Returns a minimal summary list of conversations matching the given filters.
 * Supports filtering by status, studentId, studentIds (array), and lessonId.
 * Used by admin/teacher list endpoints that don't need full message content.
 */
function getAllConversations(filters = {}, requestingTeacherId = null) {
  return conversations
    .filter((conversation) => {
      if (filters.status && conversation.status !== filters.status) {
        return false;
      }

      if (
        typeof filters.studentId === 'number' &&
        Number(conversation.studentId) !== filters.studentId
      ) {
        return false;
      }

      if (
        Array.isArray(filters.studentIds) &&
        !filters.studentIds.map(String).includes(String(conversation.studentId))
      ) {
        return false;
      }

      if (
        typeof filters.lessonId === 'number' &&
        Number(conversation.lessonId) !== filters.lessonId
      ) {
        return false;
      }

      return true;
    })
    .map((conversation) => ({
      conversationId: conversation.conversationId,
      studentId: conversation.studentId,
      lessonId: conversation.lessonId,
      status: conversation.status,
      aiScore: conversation.aiScore,
      isReviewedByTeacher: requestingTeacherId !== null
        ? conversation.teacherReviews.some((r) => String(r.teacherId) === String(requestingTeacherId))
        : conversation.teacherReviews.length > 0,
    }));
}

/**
 * Similar to getAllConversations but returns a richer summary shape that includes
 * teacherScore, createdAt, etc. Used by teacher review flow.
 */
function getConversationSummaries(filters = {}) {
  return conversations
    .filter((conversation) => {
      if (filters.status && conversation.status !== filters.status) {
        return false;
      }

      if (
        typeof filters.studentId === 'number' &&
        Number(conversation.studentId) !== filters.studentId
      ) {
        return false;
      }

      if (
        Array.isArray(filters.studentIds) &&
        !filters.studentIds.map(String).includes(String(conversation.studentId))
      ) {
        return false;
      }

      if (
        typeof filters.lessonId === 'number' &&
        Number(conversation.lessonId) !== filters.lessonId
      ) {
        return false;
      }

      return true;
    })
    .map((conversation) => ({
      conversationId: conversation.conversationId,
      studentId: conversation.studentId,
      lessonId: conversation.lessonId,
      status: conversation.status,
      aiScore: conversation.aiScore,
      teacherReviews: conversation.teacherReviews,
      isReviewedByTeacher: conversation.teacherReviews.length > 0,
      createdAt: conversation.createdAt,
    }));
}

/**
 * Returns all completed conversations for a student with the fields needed for progress stats.
 * Unlike getScoredCompletedConversationsByStudentId, this has no limit and includes unscored
 * completed conversations so that completedLessonsCount is always accurate.
 */
function getAllCompletedConversationsByStudentId(studentId) {
  return conversations
    .filter(
      (c) => String(c.studentId) === String(studentId) && c.status === 'completed'
    )
    .map((c) => ({
      lessonId: c.lessonId,
      aiScore: c.aiScore,
      teacherScore: c.teacherReviews.length > 0
        ? c.teacherReviews[c.teacherReviews.length - 1].teacherScore
        : null,
      date: c.endedAt || c.createdAt,
    }));
}

/** Finds a single conversation by its numeric ID. Returns the full conversation object or null. */
function getConversationById(conversationId) {
  return (
    conversations.find(
      (conversation) => String(conversation.conversationId) === String(conversationId)
    ) || null
  );
}

/**
 * Creates a new conversation for a student on a given lesson.
 * lessonContext and vocabWithDefinitions are stored for future AI API calls —
 * they give Gemini the scene, role, grammar rule, and vocabulary definitions it needs.
 *
 * @param {number|string} studentId
 * @param {number|string} lessonId
 * @param {string[]}      unusedVocab          - Word strings for UI vocab tracking
 * @param {object|null}   lessonContext         - { scene, aiRole, grammarRuleId, grammarRuleDetails, vocabWithDefinitions }
 * @param {object[]}      vocabWithDefinitions  - [{ word, definition }] for the AI prompt
 */
function createConversation(studentId, lessonId, unusedVocab = [], lessonContext = null, vocabWithDefinitions = []) {
  const nextConversationId = conversations.reduce((maxConversationId, conversation) => {
    return Math.max(maxConversationId, Number(conversation.conversationId) || 0);
  }, 0) + 1;

  const newConversation = {
    conversationId: nextConversationId,
    studentId: Number(studentId),
    lessonId: Number(lessonId),
    status: 'active',
    messages: [],
    unusedVocab,
    usedWords: [],
    lessonContext,
    vocabWithDefinitions,
    aiScore: null,
    aiFeedback: null,
    teacherReviews: [],
    commentsThread: [],
    createdAt: new Date().toISOString(),
    endedAt: null,
  };

  conversations.push(newConversation);

  return newConversation;
}

/**
 * Tracks which vocabulary words appear in the student's message (case-insensitive),
 * moves found words from unusedVocab to usedWords, and stores the student message.
 * Used by conversation.service as step 1 of every turn (pure JS, no AI call).
 * Returns the updated vocab lists, or null if the conversation is not found.
 */
function trackVocabAndStoreMessage(conversationId, content) {
  const conversation = getConversationById(conversationId);
  if (!conversation) return null;

  const normalizedContent = String(content).toLowerCase();
  const foundWords = conversation.unusedVocab.filter((word) =>
    normalizedContent.includes(String(word).toLowerCase())
  );

  conversation.unusedVocab = conversation.unusedVocab.filter((word) => !foundWords.includes(word));
  conversation.usedWords = Array.from(new Set([...conversation.usedWords, ...foundWords]));

  conversation.messages.push({
    role: 'student',
    content,
    createdAt: new Date().toISOString(),
  });

  return {
    unusedVocab: conversation.unusedVocab,
    usedWords: conversation.usedWords,
  };
}

/**
 * Appends an AI message to the conversation's message history.
 * Called by conversation.service after receiving a reply (real or mock).
 */
function appendAIMessage(conversationId, content) {
  const conversation = getConversationById(conversationId);
  if (!conversation) return null;

  conversation.messages.push({
    role: 'assistant',
    content,
    createdAt: new Date().toISOString(),
  });

  return conversation;
}

/**
 * Marks the conversation as completed and stores the final AI score and feedback.
 * Called by conversation.service after scoring (real or fallback).
 * Returns { conversationId, aiScore, aiFeedback } or null if not found.
 */
function markConversationComplete(conversationId, aiScore, aiFeedback) {
  const conversation = getConversationById(conversationId);
  if (!conversation) return null;

  conversation.status = 'completed';
  conversation.endedAt = new Date().toISOString();
  conversation.aiScore = aiScore;
  conversation.aiFeedback = aiFeedback;

  return {
    conversationId: conversation.conversationId,
    aiScore: conversation.aiScore,
    aiFeedback: conversation.aiFeedback,
  };
}

/**
 * Appends a student message to the conversation and generates a mock AI reply.
 * Automatically tracks which lesson vocabulary words appeared in the message.
 * Words found in content are moved from unusedVocab to usedWords.
 * Returns the AI reply and updated vocab tracking, or null if not found.
 */
function addMessageToConversation(conversationId, content) {
  const conversation = getConversationById(conversationId);

  if (!conversation) {
    return null;
  }

  const normalizedContent = String(content).toLowerCase(); // Lowercase for case-insensitive word matching
  const foundWords = conversation.unusedVocab.filter((word) => {
    return normalizedContent.includes(String(word).toLowerCase());
  });

  conversation.unusedVocab = conversation.unusedVocab.filter((word) => {
    return !foundWords.includes(word);
  });
  conversation.usedWords = Array.from(new Set([...conversation.usedWords, ...foundWords]));

  conversation.messages.push({
    role: 'student',
    content,
    createdAt: new Date().toISOString(),
  });

  const aiReply = `Mock AI reply: I understood your message about lesson ${conversation.lessonId}.`;

  conversation.messages.push({
    role: 'assistant',
    content: aiReply,
    createdAt: new Date().toISOString(),
  });

  return {
    reply: aiReply,
    unusedVocab: conversation.unusedVocab,
    usedWords: conversation.usedWords,
  };
}

/**
 * Marks a conversation as completed and calculates an AI score.
 * Score = 60 (base) + 10 per vocabulary word used, capped at 100.
 * Returns the conversationId, aiScore, and aiFeedback.
 */
function endConversation(conversationId) {
  const conversation = getConversationById(conversationId);

  if (!conversation) {
    return null;
  }

  const usedWordsCount = Array.isArray(conversation.usedWords) ? conversation.usedWords.length : 0;
  // aiScore starts at 60 (base) and increases by 10 per vocabulary word used, capped at 100
  const aiScore = Math.min(100, 60 + usedWordsCount * 10);

  conversation.status = 'completed';
  conversation.endedAt = new Date().toISOString();
  conversation.aiScore = aiScore;
  conversation.aiFeedback =
    usedWordsCount > 0
      ? 'Good job using lesson vocabulary in the conversation.'
      : 'Good effort. Try using more lesson vocabulary next time.';

  return {
    conversationId: conversation.conversationId,
    aiScore: conversation.aiScore,
    aiFeedback: conversation.aiFeedback,
  };
}

/**
 * Saves a teacher's score and written comment on a completed conversation.
 * Stores the review in teacherReviews keyed by teacherId — each teacher has one entry.
 * If the teacher has already reviewed, their entry is updated in place.
 * Returns just the conversationId on success, or null if not found.
 */
function addTeacherComment(conversationId, teacherId, teacherScore, teacherComment) {
  const conversation = getConversationById(conversationId);

  if (!conversation) {
    return null;
  }

  const review = {
    teacherId: Number(teacherId),
    teacherScore,
    teacherComment,
    reviewedAt: new Date().toISOString(),
  };

  const existingIndex = conversation.teacherReviews.findIndex(
    (r) => String(r.teacherId) === String(teacherId)
  );

  if (existingIndex !== -1) {
    conversation.teacherReviews[existingIndex] = review;
  } else {
    conversation.teacherReviews.push(review);
  }

  return {
    conversationId: conversation.conversationId,
  };
}

/**
 * Appends a reply to the conversation's commentsThread (not the main messages list).
 * The commentsThread is for student/teacher discussion after the conversation ends.
 * Returns the conversationId and the new reply object, or null if not found.
 */
function addConversationReply(conversationId, role, content) {
  const conversation = getConversationById(conversationId);

  if (!conversation) {
    return null;
  }

  const reply = {
    role,
    content,
    createdAt: new Date().toISOString(),
  };

  conversation.commentsThread.push(reply);

  return {
    conversationId: conversation.conversationId,
    reply,
  };
}

module.exports = {
  addConversationReply,
  addTeacherComment,
  appendAIMessage,
  createConversation,
  endConversation,
  getAllConversations,
  getAllCompletedConversationsByStudentId,
  getConversationSummaries,
  getScoredCompletedConversationsByStudentId,
  getConversationById,
  addMessageToConversation,
  markConversationComplete,
  trackVocabAndStoreMessage,
};