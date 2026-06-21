const prisma = require('../prisma/client');

const LEVEL_ORDER = { Beginner: 1, Intermediate: 2, Advanced: 3 };

/** Returns all lessons, marking each as locked/unlocked based on the student's current level rank. */
async function getAllLessons(level) {
  const studentRank = level ? (LEVEL_ORDER[level] ?? 0) : null;
  const lessons = await prisma.lesson.findMany();

  return lessons.map((lesson) => {
    const lessonRank = LEVEL_ORDER[lesson.level] ?? 99;
    const locked = studentRank !== null ? lessonRank > studentRank : false;
    return { ...lesson, locked };
  });
}

async function getLessonById(id) {
  return prisma.lesson.findUnique({ where: { lessonId: Number(id) } });
}

async function createLesson(data) {
  return prisma.lesson.create({
    data: {
      title: data.title,
      scene: data.scene,
      aiRole: data.aiRole,
      level: data.level,
      grammarRuleId: data.grammarRuleId,
    },
  });
}

async function updateLessonById(id, data) {
  try {
    return await prisma.lesson.update({
      where: { lessonId: Number(id) },
      data: {
        title: data.title,
        scene: data.scene,
        aiRole: data.aiRole,
        level: data.level,
        grammarRuleId: data.grammarRuleId,
      },
    });
  } catch (error) {
    if (error.code === 'P2025') return null;
    throw error;
  }
}

async function deleteLessonById(id) {
  try {
    return await prisma.lesson.delete({ where: { lessonId: Number(id) } });
  } catch (error) {
    if (error.code === 'P2025') return null;
    throw error;
  }
}

/** Builds the full lesson catalog for a student: lock state, completion status, grammar/vocab metadata, sorted by completion. */
async function getLessonsCatalog(studentId) {
  // Promise.all runs both queries at the same time (parallel), not one after another.
  // This is faster than: const progress = await ...; const lessons = await ...;
  const [progress, lessons] = await Promise.all([
    prisma.progress.findUnique({
      where: { studentId: Number(studentId) },
    }),
    // include: { grammarRule, vocabulary } does TWO JOINs in one query:
    // lesson ← grammar_rules (many-to-one)
    // lesson ← vocabulary (one-to-many, but we only need the count)
    prisma.lesson.findMany({
      include: {
        grammarRule: { select: { category: true } },
        vocabulary: { select: { vocabularyId: true } },
      },
    }),
  ]);

  if (!progress) return null;

  // Get completed lessons from junction table instead of JSON array
  const completedRows = await prisma.studentCompletedLesson.findMany({
    where: { studentId: Number(studentId) },
  });
  const completedMap = new Map(
    completedRows.map(r => [r.lessonId, r.completedAt])
  );

  const studentRank = progress.currentLevel ? (LEVEL_ORDER[progress.currentLevel] ?? 0) : 0;

  const catalog = lessons.map((lesson) => {
    const lessonRank = LEVEL_ORDER[lesson.level] ?? 99;
    const isLocked = lessonRank > studentRank;
    const completedAt = completedMap.get(lesson.lessonId) || null;
    const isCompleted = completedAt !== null;

    const grammarRuleName = lesson.grammarRuleId
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return {
      lessonId: lesson.lessonId,
      title: lesson.title,
      scene: lesson.scene,
      level: lesson.level,
      grammarRuleName,
      grammarRuleCategory: lesson.grammarRule?.category || null,
      vocabularyCount: lesson.vocabulary.length,
      isLocked,
      lockReason: isLocked ? `This lesson requires ${lesson.level} level or above.` : null,
      canStart: !isLocked,
      isCompleted,
      completedAt: isCompleted ? completedAt.toISOString() : null,
      canRestart: true,
      showCompletedIcon: isCompleted,
    };
  });

  catalog.sort((a, b) => {
    if (a.isCompleted === b.isCompleted) return 0;
    return a.isCompleted ? 1 : -1;
  });

  return catalog;
}

// Lesson grammar — fetch the grammar rule through the lesson relation
async function getLessonGrammar(lessonId) {
  const lesson = await prisma.lesson.findUnique({
    where: { lessonId: Number(lessonId) },
    include: { grammarRule: true },
  });
  if (!lesson) return { lesson: null, grammarRule: null };
  return { lesson, grammarRule: lesson.grammarRule };
}

// Lesson grammar warmup exercises
async function getLessonGrammarWarmUp(lessonId, difficulty) {
  const lesson = await prisma.lesson.findUnique({ where: { lessonId: Number(lessonId) } });
  if (!lesson) return { lesson: null, exercises: [] };

  const where = { grammarRuleId: lesson.grammarRuleId };
  if (difficulty) where.difficulty = difficulty;

  const exercises = await prisma.warmUpExercise.findMany({ where });
  return { lesson, exercises };
}

/** Returns lesson vocabulary split into two warm-up formats: fill-in-the-blank and word-definition matching. */
async function getLessonVocabWarmUp(lessonId) {
  const lesson = await prisma.lesson.findUnique({ where: { lessonId: Number(lessonId) } });
  if (!lesson) return null;

  const vocabulary = await prisma.vocabulary.findMany({
    where: { lessonId: Number(lessonId) },
  });

  return {
    completeSentence: vocabulary.map((item) => ({
      vocabularyId: item.vocabularyId,
      completeSentence: item.completeSentence,
      word: item.word,
    })),
    matching: vocabulary.map((item) => ({
      word: item.word,
      definition: item.definition,
    })),
  };
}

module.exports = {
  getAllLessons,
  getLessonById,
  createLesson,
  updateLessonById,
  deleteLessonById,
  getLessonsCatalog,
  getLessonGrammar,
  getLessonGrammarWarmUp,
  getLessonVocabWarmUp,
};
