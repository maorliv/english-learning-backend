const prisma = require('../prisma/client');

async function getConversationById(conversationId) {
  return prisma.conversation.findUnique({
    where: { conversationId: Number(conversationId) },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      reviews: { include: { teacher: { include: { user: true } } } },
      replies: { orderBy: { createdAt: 'asc' } },
    },
  });
}

async function getAllConversations(filters = {}, requestingTeacherId = null) {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (typeof filters.studentId === 'number') where.studentId = filters.studentId;
  if (Array.isArray(filters.studentIds)) where.studentId = { in: filters.studentIds };
  if (typeof filters.lessonId === 'number') where.lessonId = filters.lessonId;

  const conversations = await prisma.conversation.findMany({
    where,
    include: { reviews: true },
  });

  return conversations.map(c => ({
    conversationId: c.conversationId,
    studentId: c.studentId,
    lessonId: c.lessonId,
    status: c.status,
    aiScore: c.aiScore,
    isReviewedByTeacher: requestingTeacherId !== null
      ? c.reviews.some(r => r.teacherId === Number(requestingTeacherId))
      : c.reviews.length > 0,
  }));
}

async function getConversationSummaries(filters = {}) {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (typeof filters.studentId === 'number') where.studentId = filters.studentId;
  if (Array.isArray(filters.studentIds)) where.studentId = { in: filters.studentIds };

  return prisma.conversation.findMany({
    where,
    include: {
      reviews: { include: { teacher: { include: { user: true } } } },
      lesson: { select: { title: true } },
    },
  });
}

async function getScoredCompletedConversationsByStudentId(studentId, limit = 5) {
  const conversations = await prisma.conversation.findMany({
    where: {
      studentId: Number(studentId),
      status: 'completed',
      OR: [
        { aiScore: { not: null } },
        { reviews: { some: {} } },
      ],
    },
    include: { reviews: true },
    orderBy: { endedAt: 'desc' },
    take: limit,
  });

  return conversations.map(c => ({
    conversationId: c.conversationId,
    lessonId: c.lessonId,
    aiScore: c.aiScore,
    teacherReviews: c.reviews,
    date: c.endedAt || c.createdAt,
  }));
}

async function getAllCompletedConversationsByStudentId(studentId) {
  const conversations = await prisma.conversation.findMany({
    where: { studentId: Number(studentId), status: 'completed' },
    include: { reviews: true },
  });

  return conversations.map(c => ({
    lessonId: c.lessonId,
    aiScore: c.aiScore,
    teacherScore: c.reviews.length > 0 ? c.reviews[c.reviews.length - 1].teacherScore : null,
    date: c.endedAt || c.createdAt,
  }));
}

async function createConversation(studentId, lessonId, unusedVocab = []) {
  return prisma.conversation.create({
    data: {
      studentId: Number(studentId),
      lessonId: Number(lessonId),
      unusedVocab,
      usedWords: [],
    },
    include: { messages: true },
  });
}

async function addMessageToConversation(conversationId, content) {
  const conversation = await prisma.conversation.findUnique({
    where: { conversationId: Number(conversationId) },
  });
  if (!conversation) return null;

  const normalizedContent = String(content).toLowerCase();
  const unusedVocab = Array.isArray(conversation.unusedVocab) ? conversation.unusedVocab : [];
  const usedWords = Array.isArray(conversation.usedWords) ? conversation.usedWords : [];

  const foundWords = unusedVocab.filter(word => normalizedContent.includes(String(word).toLowerCase()));
  const newUnused = unusedVocab.filter(word => !foundWords.includes(word));
  const newUsed = Array.from(new Set([...usedWords, ...foundWords]));

  const aiReply = `Mock AI reply: I understood your message about lesson ${conversation.lessonId}.`;

  await prisma.$transaction([
    prisma.conversationMessage.create({
      data: { conversationId: Number(conversationId), role: 'student', content },
    }),
    prisma.conversationMessage.create({
      data: { conversationId: Number(conversationId), role: 'assistant', content: aiReply },
    }),
    prisma.conversation.update({
      where: { conversationId: Number(conversationId) },
      data: { unusedVocab: newUnused, usedWords: newUsed },
    }),
  ]);

  return { reply: aiReply, unusedVocab: newUnused, usedWords: newUsed };
}

async function endConversation(conversationId) {
  const conversation = await prisma.conversation.findUnique({
    where: { conversationId: Number(conversationId) },
  });
  if (!conversation) return null;

  const usedWordsCount = Array.isArray(conversation.usedWords) ? conversation.usedWords.length : 0;
  const aiScore = Math.min(100, 60 + usedWordsCount * 10);
  const aiFeedback = usedWordsCount > 0
    ? 'Good job using lesson vocabulary in the conversation.'
    : 'Good effort. Try using more lesson vocabulary next time.';

  await prisma.conversation.update({
    where: { conversationId: Number(conversationId) },
    data: { status: 'completed', endedAt: new Date(), aiScore, aiFeedback },
  });

  return { conversationId: Number(conversationId), aiScore, aiFeedback };
}

async function addTeacherComment(conversationId, teacherId, teacherScore, teacherComment) {
  await prisma.teacherReview.upsert({
    where: {
      conversationId_teacherId: {
        conversationId: Number(conversationId),
        teacherId: Number(teacherId),
      },
    },
    update: { teacherScore, teacherComment, reviewedAt: new Date() },
    create: {
      conversationId: Number(conversationId),
      teacherId: Number(teacherId),
      teacherScore,
      teacherComment,
    },
  });

  return { conversationId: Number(conversationId) };
}

async function addConversationReply(conversationId, role, content) {
  const reply = await prisma.conversationReply.create({
    data: {
      conversationId: Number(conversationId),
      role,
      content,
    },
  });

  return { conversationId: Number(conversationId), reply };
}

module.exports = {
  getConversationById,
  getAllConversations,
  getConversationSummaries,
  getScoredCompletedConversationsByStudentId,
  getAllCompletedConversationsByStudentId,
  createConversation,
  addMessageToConversation,
  endConversation,
  addTeacherComment,
  addConversationReply,
};
