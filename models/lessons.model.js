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

module.exports = {
  getAllLessons,
};