const progress = require('./data/progress.json');

function getProgressByStudentId(studentId) {
  return progress.find((entry) => String(entry.studentId) === String(studentId)) || null;
}

module.exports = {
  getProgressByStudentId,
};