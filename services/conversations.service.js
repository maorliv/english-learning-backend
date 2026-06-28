const prisma = require('../prisma/client');
const { askGemini } = require('./gemini');

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

/** Returns conversations with a per-teacher `isReviewedByTeacher` flag when requestingTeacherId is provided. */
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

/** Tracks vocabulary usage, builds a Gemini prompt with lesson context + history, and returns the AI tutor reply. */
async function addMessageToConversation(conversationId, content) {
  // Fetch conversation WITH message history (needed for prompt context)
  const conversation = await prisma.conversation.findUnique({
    where: { conversationId: Number(conversationId) },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!conversation) return null;

  // --- Vocabulary tracking (unchanged) ---
  const normalizedContent = String(content).toLowerCase();
  const unusedVocab = Array.isArray(conversation.unusedVocab) ? conversation.unusedVocab : [];
  const usedWords = Array.isArray(conversation.usedWords) ? conversation.usedWords : [];

  const foundWords = unusedVocab.filter(word => normalizedContent.includes(String(word).toLowerCase()));
  const newUnused = unusedVocab.filter(word => !foundWords.includes(word));
  const newUsed = Array.from(new Set([...usedWords, ...foundWords]));

  // --- Build prompt and call Gemini ---
  let aiReply;
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { lessonId: conversation.lessonId },
      include: { grammarRule: true },
    });

    const grammar = lesson.grammarRule;
    const conversationHistory = conversation.messages
      .map(m => `${m.role === 'student' ? 'Student' : 'Tutor'}: ${m.content}`)
      .join('\n');

    const prompt = `You are an English language tutor in a roleplay conversation.

LESSON CONTEXT:
- Lesson title: "${lesson.title}"
- Scene: "${lesson.scene}"
- Your role: "${lesson.aiRole}"

GRAMMAR RULE TO PRACTICE:
- Rule: "${grammar?.id || ''}" (${grammar?.category || ''})
- Usage: ${grammar?.usage || ''}
- Forms: ${grammar?.forms ? JSON.stringify(grammar.forms) : 'N/A'}
- Keywords: ${Array.isArray(grammar?.keywords) ? grammar.keywords.join(', ') : 'N/A'}

VOCABULARY TO PRACTICE:
- Words the student still needs to use: ${newUnused.join(', ') || 'none'}
- Words the student already used: ${newUsed.join(', ') || 'none'}

CONVERSATION HISTORY:
${conversationHistory || '(This is the first message)'}

INSTRUCTIONS:
- Stay in character as "${lesson.aiRole}"
- Keep responses to 2-3 sentences
- Try to naturally guide the student to use the unused vocabulary words
- Guide the student to use the grammar rule "${grammar?.id || ''}" correctly (e.g. use ${Array.isArray(grammar?.keywords) ? grammar.keywords.slice(0, 3).join(', ') : 'appropriate tense'} naturally)
- If the student makes grammar mistakes related to this rule, gently model the correct form in your reply
- Match the student's level
- Do NOT list vocabulary words or grammar rules explicitly — keep it natural and in character

STUDENT'S LATEST MESSAGE: "${content}"

Respond in character:`;

    aiReply = await askGemini(prompt);
  } catch (error) {
    console.error('Gemini API error in addMessageToConversation:', error.message);
    aiReply = `That's interesting, could you tell me more about that? I'd also like you to try using some of the vocabulary words we're practicing in this lesson.`;
  }

  // --- Save messages to database ---
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

/** Sends the full conversation to Gemini for scoring (0-100) and feedback; falls back to word-count heuristic on error. */
async function endConversation(conversationId) {
  const conversation = await prisma.conversation.findUnique({
    where: { conversationId: Number(conversationId) },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!conversation) return null;

  let aiScore, aiFeedback;
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { lessonId: conversation.lessonId },
      include: { grammarRule: true },
    });

    const grammar = lesson.grammarRule;
    const usedWords = Array.isArray(conversation.usedWords) ? conversation.usedWords : [];
    const unusedVocab = Array.isArray(conversation.unusedVocab) ? conversation.unusedVocab : [];
    const allVocab = [...usedWords, ...unusedVocab];

    const allMessages = conversation.messages
      .map(m => `${m.role === 'student' ? 'Student' : 'Tutor'}: ${m.content}`)
      .join('\n');

    const prompt = `You are an English language assessment system. Evaluate the following conversation between a student and an AI tutor.

LESSON CONTEXT:
- Lesson title: "${lesson.title}"
- Target vocabulary: ${allVocab.join(', ')}
- Target grammar rule: "${grammar?.id || ''}" (${grammar?.category || ''})
- Grammar usage: ${grammar?.usage || ''}
- Expected forms: ${grammar?.forms ? JSON.stringify(grammar.forms) : 'N/A'}

VOCABULARY USAGE:
- Words successfully used by student: ${usedWords.join(', ') || 'none'}
- Words NOT used by student: ${unusedVocab.join(', ') || 'none'}

FULL CONVERSATION:
${allMessages}

SCORING CRITERIA:
- Vocabulary usage (did they use the target words?): 0-25 points
- Grammar rule usage (did they correctly use "${grammar?.id || 'the target grammar'}"?): 0-25 points
- Communication effectiveness (did they convey meaning clearly?): 0-25 points
- Engagement and effort (length, variety, initiative): 0-25 points

Respond ONLY with a JSON object in this exact format, no other text:
{"aiScore": <number 0-100>, "aiFeedback": "<2-3 sentences of specific feedback mentioning both vocabulary and grammar rule usage>"}`;

    const rawResponse = await askGemini(prompt);

    // Gemini sometimes wraps JSON in markdown code fences — strip them
    const cleaned = rawResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);

    aiScore = typeof parsed.aiScore === 'number'
      ? Math.min(100, Math.max(0, Math.round(parsed.aiScore)))
      : null;
    aiFeedback = typeof parsed.aiFeedback === 'string' ? parsed.aiFeedback : null;

    if (aiScore === null || aiFeedback === null) throw new Error('Invalid Gemini response format');
  } catch (error) {
    console.error('Gemini scoring error:', error.message);
    const usedWordsCount = Array.isArray(conversation.usedWords) ? conversation.usedWords.length : 0;
    aiScore = Math.min(100, 60 + usedWordsCount * 10);
    aiFeedback = usedWordsCount > 0
      ? 'Good job using lesson vocabulary in the conversation.'
      : 'Good effort. Try using more lesson vocabulary next time.';
  }

  await prisma.conversation.update({
    where: { conversationId: Number(conversationId) },
    data: { status: 'completed', endedAt: new Date(), aiScore, aiFeedback },
  });

  await prisma.studentCompletedLesson.upsert({
    where: {
      studentId_lessonId: {
        studentId: conversation.studentId,
        lessonId: conversation.lessonId,
      },
    },
    update: { completedAt: new Date() },
    create: {
      studentId: conversation.studentId,
      lessonId: conversation.lessonId,
    },
  });

  return { conversationId: Number(conversationId), aiScore, aiFeedback };
}

/** Upserts a teacher review so the same teacher can update their score/comment on a conversation. */
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
