const relations = require('./data/relations.json');

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

module.exports = {
  getRelationByTeacherAndStudent,
  getPendingRelationsByTeacherId,
  createRelationRequest,
};