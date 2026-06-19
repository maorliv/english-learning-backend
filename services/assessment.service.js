const prisma = require('../prisma/client');

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

async function addMessageToAssessment(assessmentId, content) {
  const assessment = await prisma.assessment.findUnique({
    where: { assessmentId: Number(assessmentId) },
  });
  if (!assessment) return null;

  const reply =
    'Thank you! Can you describe a recent challenge you faced at work and explain what you did to solve it?';

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

async function endAssessment(assessmentId) {
  const assessment = await prisma.assessment.findUnique({
    where: { assessmentId: Number(assessmentId) },
  });
  if (!assessment) return null;

  const detectedLevel = 'Beginner';

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
