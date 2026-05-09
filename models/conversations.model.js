const conversations = require('./data/conversations.json');

function createConversation(studentId, lessonId) {
  const nextConversationId = conversations.reduce((maxConversationId, conversation) => {
    return Math.max(maxConversationId, Number(conversation.conversationId) || 0);
  }, 0) + 1;

  const newConversation = {
    conversationId: nextConversationId,
    studentId: Number(studentId),
    lessonId: Number(lessonId),
    status: 'active',
    messages: [],
    unusedVocab: [],
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

module.exports = {
  createConversation,
};