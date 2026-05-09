const conversations = require('./data/conversations.json');

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

function getConversationById(conversationId) {
  return (
    conversations.find(
      (conversation) => String(conversation.conversationId) === String(conversationId)
    ) || null
  );
}

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

function addMessageToConversation(conversationId, content) {
  const conversation = getConversationById(conversationId);

  if (!conversation) {
    return null;
  }

  const normalizedContent = String(content).toLowerCase();
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

function endConversation(conversationId) {
  const conversation = getConversationById(conversationId);

  if (!conversation) {
    return null;
  }

  const usedWordsCount = Array.isArray(conversation.usedWords) ? conversation.usedWords.length : 0;
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
  getConversationById,
  addMessageToConversation,
  createConversation,
};