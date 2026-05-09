const lessons = require('./data/lessons.json');

/**
 * Returns all lessons. If a level is provided, lessons at other levels are marked as locked.
 * The 'locked' flag is a UI hint — it does not prevent access server-side.
 *
 * @param {string} [level] - Optional level filter (e.g. 'beginner', 'intermediate')
 */
function getAllLessons(level) {
  return lessons.map((lesson) => ({
    lessonId: lesson.lessonId,
    vocabularyId: lesson.vocabularyId,
    title: lesson.title,
    scene: lesson.scene,
    aiRole: lesson.aiRole,
    grammarRuleId: lesson.grammarRuleId,
    level: lesson.level,
    // If a level filter is provided, mark lessons at a different level as locked
    locked: level ? lesson.level !== level : false,
  }));
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