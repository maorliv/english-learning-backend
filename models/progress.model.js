const { progress } = require('./store');

/**
 * Finds the progress record for a given student ID.
 * Each student has at most one progress record in the data store.
 * Returns null if no record is found.
 */
function getProgressByStudentId(studentId) {
  return progress.find((entry) => String(entry.studentId) === String(studentId)) || null;
}

/**
 * Updates the currentLevel field of an existing progress record.
 * Called after an AI level assessment is completed.
 * Returns the updated record, or null if no record exists for this student.
 *
 * @param {number|string} studentId
 * @param {string}        level     - One of: 'Beginner', 'Intermediate', 'Advanced'
 * @returns {object|null}
 */
function updateProgressLevel(studentId, level) {
  const record = getProgressByStudentId(studentId);

  if (!record) {
    return null;
  }

  record.currentLevel = level;

  return record;
}

/**
 * Creates a blank progress record for a newly registered student.
 * currentLevel is null until the AI level assessment is completed.
 * Called automatically by the registration handler — should not be called manually.
 *
 * @param {number|string} studentId
 * @returns {object} The new progress record
 */
function createProgressRecord(studentId) {
  const nextProgressId =
    progress.reduce((maxId, entry) => Math.max(maxId, Number(entry.progressId) || 0), 0) + 1;

  const newRecord = {
    progressId: nextProgressId,
    studentId: Number(studentId),
    currentLevel: null,
    completedLessonsCount: 0,
    successedLessonsCount: 0,
    overallAverage: 0,
    lastActivityDate: new Date().toISOString(),
    skillsRadar: null,
    completedLessonIds: [],
    completedAt: {},
  };

  progress.push(newRecord);

  return newRecord;
}

module.exports = {
  getProgressByStudentId,
  updateProgressLevel,
  createProgressRecord,
};