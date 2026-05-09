const progress = require('./data/progress.json');

/**
 * Finds the progress record for a given student ID.
 * Each student has at most one progress record in the data store.
 * Returns null if no record is found.
 */
function getProgressByStudentId(studentId) {
  return progress.find((entry) => String(entry.studentId) === String(studentId)) || null;
}

module.exports = {
  getProgressByStudentId,
};