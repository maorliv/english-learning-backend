const { relations } = require('./store');

/**
 * Returns all relations, optionally filtered by status.
 * Returns a projected shape (no review fields) to keep the list lightweight.
 */
function getAllRelations(status) {
  return relations
    .filter((relation) => {
      if (!status) {
        return true; // No filter — return all
      }

      return relation.status === status;
    })
    .map((relation) => ({
      relationId: relation.relationId,
      teacherId: relation.teacherId,
      studentId: relation.studentId,
      status: relation.status,
      createdAt: relation.createdAt,
    }));
}

/** Finds a relation by its numeric relationId. Returns the full record or null. */
function getRelationById(relationId) {
  return relations.find((relation) => String(relation.relationId) === String(relationId)) || null;
}

/** Finds the relation between a specific teacher and student (if any). Returns null if none exists. */
function getRelationByTeacherAndStudent(teacherId, studentId) {
  return (
    relations.find(
      (relation) =>
        String(relation.teacherId) === String(teacherId) &&
        String(relation.studentId) === String(studentId)
    ) || null
  );
}

/** Returns all pending (awaiting acceptance) relations for a given teacher. */
function getPendingRelationsByTeacherId(teacherId) {
  return relations.filter(
    (relation) =>
      String(relation.teacherId) === String(teacherId) && relation.status === 'pending'
  );
}

/** Returns all currently active relations for a given teacher. */
function getActiveRelationsByTeacherId(teacherId) {
  return relations.filter(
    (relation) => String(relation.teacherId) === String(teacherId) && relation.status === 'active'
  );
}

/** Returns just the studentId values for all active relations belonging to a teacher. */
function getActiveStudentIdsByTeacherId(teacherId) {
  return getActiveRelationsByTeacherId(teacherId).map((relation) => relation.studentId);
}

/** Returns all relations for a teacher where the student has left a review (rating + feedback set). */
function getReviewedRelationsByTeacherId(teacherId) {
  return relations.filter(
    (relation) =>
      String(relation.teacherId) === String(teacherId) &&
      relation.rating !== null &&
      relation.student_feedback !== null
  );
}

/** Finds the single active relation for a given student. Returns null if the student has no active relation. */
function getActiveRelationByStudentId(studentId) {
  return (
    relations.find(
      (relation) => String(relation.studentId) === String(studentId) && relation.status === 'active'
    ) || null
  );
}

/** Returns all active relations for a given student (a student may have more than one teacher). */
function getRelationsByStudentId(studentId) {
  return relations.filter(
    (relation) => String(relation.studentId) === String(studentId) && relation.status === 'active'
  );
}

/** Returns ALL relations for a given student regardless of status (pending, active, rejected). */
function getAllRelationsByStudentId(studentId) {
  return relations.filter(
    (relation) => String(relation.studentId) === String(studentId)
  );
}

/**
 * Removes a relation from the in-memory store entirely.
 * Returns the removed record, or null if not found.
 */
function removeRelationById(relationId) {
  const index = relations.findIndex((r) => String(r.relationId) === String(relationId));
  if (index === -1) return null;
  const [removed] = relations.splice(index, 1);
  return removed;
}

/**
 * Creates a new relation request (status: 'pending') between a teacher and student.
 * The new relation's ID is one greater than the current maximum.
 */
function createRelationRequest(teacherId, studentId) {
  const nextRelationId = relations.reduce((maxRelationId, relation) => {
    return Math.max(maxRelationId, Number(relation.relationId) || 0);
  }, 0) + 1;

  const newRelation = {
    relationId: nextRelationId,
    teacherId: Number(teacherId),
    studentId: Number(studentId),
    status: 'pending',
    createdAt: new Date().toISOString(),
    rating: null,
    student_feedback: null,
  };

  relations.push(newRelation);

  return newRelation;
}

/**
 * Updates the status of a relation (e.g. 'pending' → 'active' or 'rejected').
 * Returns the updated relation, null if not found, or false if the teacherId doesn't own it.
 */
function updateRelationStatusById(relationId, teacherId, status) {
  const relation = getRelationById(relationId);

  if (!relation) {
    return null;
  }

  if (String(relation.teacherId) !== String(teacherId)) {
    return false; // Teacher doesn't own this relation
  }

  relation.status = status;

  return relation;
}

/**
 * Saves a student's review (rating + feedback) on an active relation.
 * Returns the updated relation, null if not found, or false if the student doesn't own it or it's not active.
 */
function updateRelationReviewById(relationId, studentId, rating, studentFeedback) {
  const relation = getRelationById(relationId);

  if (!relation) {
    return null;
  }

  if (String(relation.studentId) !== String(studentId) || relation.status !== 'active') {
    return false; // Student doesn't own this relation or it's not yet active
  }

  relation.rating = Number(rating);
  relation.student_feedback = studentFeedback;

  return relation;
}

module.exports = {
  getAllRelations,
  getRelationById,
  getRelationByTeacherAndStudent,
  getActiveRelationsByTeacherId,
  getActiveStudentIdsByTeacherId,
  getActiveRelationByStudentId,
  getRelationsByStudentId,
  getAllRelationsByStudentId,
  getPendingRelationsByTeacherId,
  getReviewedRelationsByTeacherId,
  createRelationRequest,
  removeRelationById,
  updateRelationStatusById,
  updateRelationReviewById,
};