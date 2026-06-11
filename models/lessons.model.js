const { lessons } = require('./store');

// Defines the progression order of levels. Higher number = higher level.
// A student can access any lesson at or below their own level rank.
const LEVEL_ORDER = { Beginner: 1, Intermediate: 2, Advanced: 3 };

/**
 * Returns all lessons. If a student level is provided, lessons above that level are marked as locked.
 * Uses cumulative progression: a student can access their own level and all levels below it.
 * The 'locked' flag is a UI hint — it does not prevent access server-side.
 *
 * @param {string} [level] - The student's current level (e.g. 'Intermediate')
 */
function getAllLessons(level) {
  const studentRank = level ? (LEVEL_ORDER[level] ?? 0) : null;

  return lessons.map((lesson) => {
    const lessonRank = LEVEL_ORDER[lesson.level] ?? 99;
    // Locked if a student level was provided and the lesson's level is above the student's level
    const locked = studentRank !== null ? lessonRank > studentRank : false;

    return {
      lessonId: lesson.lessonId,
      vocabularyId: lesson.vocabularyId,
      title: lesson.title,
      scene: lesson.scene,
      aiRole: lesson.aiRole,
      grammarRuleId: lesson.grammarRuleId,
      level: lesson.level,
      locked,
    };
  });
}

/** Finds a lesson by its numeric ID. Returns null if not found. */
function getLessonById(id) {
  return lessons.find((lesson) => String(lesson.lessonId) === String(id)) || null;
}

/**
 * Creates a new lesson and appends it to the in-memory array.
 * The new lesson's ID is one greater than the current maximum.
 */
function createLesson(lessonData) {
  const nextLessonId = lessons.reduce((maxLessonId, lesson) => {
    return Math.max(maxLessonId, Number(lesson.lessonId) || 0);
  }, 0) + 1;

  const newLesson = {
    lessonId: nextLessonId,
    vocabularyId: lessonData.vocabularyId,
    title: lessonData.title,
    scene: lessonData.scene,
    aiRole: lessonData.aiRole,
    grammarRuleId: lessonData.grammarRuleId,
    level: lessonData.level,
  };

  lessons.push(newLesson);

  return newLesson;
}

/**
 * Replaces all editable fields of the given lesson.
 * Returns the updated lesson, or null if not found.
 */
function updateLessonById(id, lessonData) {
  const lesson = getLessonById(id);

  if (!lesson) {
    return null;
  }

  lesson.title = lessonData.title;
  lesson.scene = lessonData.scene;
  lesson.aiRole = lessonData.aiRole;
  lesson.level = lessonData.level;
  lesson.grammarRuleId = lessonData.grammarRuleId;
  lesson.vocabularyId = lessonData.vocabularyId;

  return lesson;
}

/**
 * Removes a lesson from the in-memory array by its ID.
 * Returns the deleted lesson, or null if not found.
 */
function deleteLessonById(id) {
  const lessonIndex = lessons.findIndex((lesson) => String(lesson.lessonId) === String(id));

  if (lessonIndex === -1) {
    return null;
  }

  const [deletedLesson] = lessons.splice(lessonIndex, 1);

  return deletedLesson;
}

module.exports = {
  getAllLessons,
  getLessonById,
  createLesson,
  updateLessonById,
  deleteLessonById,
};