const prisma = require('../prisma/client');
const { askGemini } = require('./gemini');

/** Creates a new assessment session and seeds it with the opening interviewer prompt. */
async function createAssessment(studentId) {
  const firstPrompt =
    'Hello! To help us understand your current English level, please tell me a little about yourself. ' +
    'For example: What do you do for work, and how do you use English in your job?';

  const assessment = await prisma.assessment.create({
    data: {
      studentId: Number(studentId),
      status: 'active',
    },
  });

  await prisma.assessmentMessage.create({
    data: {
      assessmentId: assessment.assessmentId,
      role: 'assistant',
      content: firstPrompt,
    },
  });

  return {
    ...assessment,
    messages: [{ role: 'assistant', content: firstPrompt, createdAt: assessment.createdAt }],
  };
}

async function getAssessmentById(assessmentId) {
  return prisma.assessment.findUnique({
    where: { assessmentId: Number(assessmentId) },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
}

/** Sends conversation history to Gemini to generate a progressively harder follow-up question for level assessment. */
async function addMessageToAssessment(assessmentId, content) {
  const assessment = await prisma.assessment.findUnique({
    where: { assessmentId: Number(assessmentId) },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!assessment) return null;

  let reply;
  try {
    const messageHistory = assessment.messages
      .map(m => `${m.role === 'student' ? 'Student' : 'Interviewer'}: ${m.content}`)
      .join('\n');

    const prompt = `You are an English level assessment interviewer. Your goal is to evaluate the student's English proficiency through natural conversation.

CONVERSATION SO FAR:
${messageHistory}

STUDENT'S LATEST RESPONSE: "${content}"

INSTRUCTIONS:
- Ask a follow-up question that tests a DIFFERENT skill than what you've already tested
- Progressively increase complexity if the student seems capable
- Topics to cover: daily life, work/study, opinions, hypothetical situations, abstract ideas
- Keep your question to 1-2 sentences
- Be encouraging and natural, not robotic
- Do NOT tell the student what level they are

Your follow-up question:`;

    reply = await askGemini(prompt);
  } catch (error) {
    console.error('Gemini assessment follow-up error:', error.message);
    reply = 'Thank you! Can you describe a recent challenge you faced at work and explain what you did to solve it?';
  }

  await prisma.$transaction([
    prisma.assessmentMessage.create({
      data: { assessmentId: Number(assessmentId), role: 'student', content },
    }),
    prisma.assessmentMessage.create({
      data: { assessmentId: Number(assessmentId), role: 'assistant', content: reply },
    }),
  ]);

  return { reply };
}

/** Asks Gemini to classify the student as Beginner/Intermediate/Advanced based on the full assessment conversation. */
async function endAssessment(assessmentId) {
  const assessment = await prisma.assessment.findUnique({
    where: { assessmentId: Number(assessmentId) },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!assessment) return null;

  let detectedLevel = 'Beginner';
  try {
    const allMessages = assessment.messages
      .map(m => `${m.role === 'student' ? 'Student' : 'Interviewer'}: ${m.content}`)
      .join('\n');

    const prompt = `You are an English proficiency evaluator. Based on the following assessment conversation, classify the student's English level.

FULL ASSESSMENT CONVERSATION:
${allMessages}

CLASSIFICATION CRITERIA:
- Beginner: Simple sentences, limited vocabulary, frequent grammar errors, struggles to express ideas
- Intermediate: Can express opinions, uses varied vocabulary, some grammar errors but meaning is clear, can discuss familiar topics
- Advanced: Complex sentences, rich vocabulary, rare grammar errors, can discuss abstract topics, nuanced expression

Respond with EXACTLY one word — either Beginner, Intermediate, or Advanced. Nothing else.`;

    const rawResponse = await askGemini(prompt);
    const cleaned = rawResponse.trim();

    const validLevels = ['Beginner', 'Intermediate', 'Advanced'];
    const matched = validLevels.find(level => cleaned.toLowerCase() === level.toLowerCase());
    if (matched) {
      detectedLevel = matched;
    } else {
      console.warn('Gemini returned unexpected level:', cleaned, '— defaulting to Beginner');
    }
  } catch (error) {
    console.error('Gemini level detection error:', error.message);
  }

  await prisma.assessment.update({
    where: { assessmentId: Number(assessmentId) },
    data: { status: 'completed', detectedLevel, endedAt: new Date() },
  });

  return { assessmentId: Number(assessmentId), detectedLevel };
}

module.exports = {
  createAssessment,
  getAssessmentById,
  addMessageToAssessment,
  endAssessment,
};
