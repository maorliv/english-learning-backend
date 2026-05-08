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

module.exports = {
  getAllLessons,
  getLessonById,
};