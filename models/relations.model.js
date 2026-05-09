const relations = require('./data/relations.json');

function getAllRelations(status) {
  return relations
    .filter((relation) => {
      if (!status) {
        return true;
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

function getRelationById(relationId) {
  return relations.find((relation) => String(relation.relationId) === String(relationId)) || null;
}

function getRelationByTeacherAndStudent(teacherId, studentId) {
  return (
    relations.find(
      (relation) =>
        String(relation.teacherId) === String(teacherId) &&
        String(relation.studentId) === String(studentId)
    ) || null
  );
}

function getPendingRelationsByTeacherId(teacherId) {
  return relations.filter(
    (relation) =>
      String(relation.teacherId) === String(teacherId) && relation.status === 'pending'
  );
}

function getActiveRelationsByTeacherId(teacherId) {
  return relations.filter(
    (relation) => String(relation.teacherId) === String(teacherId) && relation.status === 'active'
  );
}

function getActiveStudentIdsByTeacherId(teacherId) {
  return getActiveRelationsByTeacherId(teacherId).map((relation) => relation.studentId);
}

function getReviewedRelationsByTeacherId(teacherId) {
  return relations.filter(
    (relation) =>
      String(relation.teacherId) === String(teacherId) &&
      relation.rating !== null &&
      relation.student_feedback !== null
  );
}

function getActiveRelationByStudentId(studentId) {
  return (
    relations.find(
      (relation) => String(relation.studentId) === String(studentId) && relation.status === 'active'
    ) || null
  );
}

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

function updateRelationStatusById(relationId, teacherId, status) {
  const relation = getRelationById(relationId);

  if (!relation) {
    return null;
  }

  if (String(relation.teacherId) !== String(teacherId)) {
    return false;
  }

  relation.status = status;

  return relation;
}

function updateRelationReviewById(relationId, studentId, rating, studentFeedback) {
  const relation = getRelationById(relationId);

  if (!relation) {
    return null;
  }

  if (String(relation.studentId) !== String(studentId) || relation.status !== 'active') {
    return false;
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
  getPendingRelationsByTeacherId,
  getReviewedRelationsByTeacherId,
  createRelationRequest,
  updateRelationStatusById,
  updateRelationReviewById,
};