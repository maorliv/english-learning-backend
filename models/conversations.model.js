const conversations = require('./data/conversations.json');

/**
 * Returns the most recent completed and scored conversations for a student.
 * Used to build the score history shown in the progress chart.
 * Sorted by date descending and limited to `limit` results (default 5).
 */
function getScoredCompletedConversationsByStudentId(studentId, limit = 5) {
  return conversations
    .filter((conversation) => String(conversation.studentId) === String(studentId))
    .filter((conversation) => conversation.status === 'completed')
    .filter((conversation) => conversation.aiScore !== null || conversation.teacherScore !== null)
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
      teacherScore: conversation.teacherScore,
      date: conversation.endedAt || conversation.createdAt,
    }));
}

/**
 * Returns a minimal summary list of conversations matching the given filters.
 * Supports filtering by status, studentId, studentIds (array), and lessonId.
 * Used by admin/teacher list endpoints that don't need full message content.
 */
function getAllConversations(filters = {}) {
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
      isReviewedByTeacher: conversation.isReviewedByTeacher,
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
      teacherScore: conversation.teacherScore,
      isReviewedByTeacher: conversation.isReviewedByTeacher,
      createdAt: conversation.createdAt,
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
 * The unusedVocab array is pre-populated from the lesson's vocabulary so word usage can be tracked.
 */
function createConversation(studentId, lessonId, unusedVocab = []) {
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
    aiScore: null,
    aiFeedback: null,
    teacherScore: null,
    teacherComment: null,
    isReviewedByTeacher: false,
    commentsThread: [],
    createdAt: new Date().toISOString(),
    endedAt: null,
  };

  conversations.push(newConversation);

  return newConversation;
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
 * Sets isReviewedByTeacher = true.
 * Returns just the conversationId on success, or null if not found.
 */
function addTeacherComment(conversationId, teacherScore, teacherComment) {
  const conversation = getConversationById(conversationId);

  if (!conversation) {
    return null;
  }

  conversation.teacherScore = teacherScore;
  conversation.teacherComment = teacherComment;
  conversation.isReviewedByTeacher = true;

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
  endConversation,
  getAllConversations,
  getConversationSummaries,
  getScoredCompletedConversationsByStudentId,
  getConversationById,
  addMessageToConversation,
  createConversation,
};