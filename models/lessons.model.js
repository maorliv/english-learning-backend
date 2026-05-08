const lessons = require('./data/lessons.json');

function getAllLessons(level) {
  return lessons.map((lesson) => ({
    lessonId: lesson.lessonId,
    vocabularyId: lesson.vocabularyId,
    title: lesson.title,
    scene: lesson.scene,
    aiRole: lesson.aiRole,
    grammarRuleId: lesson.grammarRuleId,
    level: lesson.level,
    locked: level ? lesson.level !== level : false,
  }));
}

function getLessonById(id) {
  return lessons.find((lesson) => String(lesson.lessonId) === String(id)) || null;
}

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

module.exports = {
  getAllLessons,
  getLessonById,
  createLesson,
  updateLessonById,
};