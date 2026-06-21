const prisma = require('../prisma/client');

async function getAllRelations(status) {
  const where = status ? { status } : {};
  const relations = await prisma.studentTeacherRelation.findMany({ where });
  return relations.map(r => ({
    relationId: r.relationId,
    teacherId: r.teacherId,
    studentId: r.studentId,
    status: r.status,
    createdAt: r.createdAt,
  }));
}

async function getRelationById(relationId) {
  return prisma.studentTeacherRelation.findUnique({
    where: { relationId: Number(relationId) },
  });
}

async function getRelationByTeacherAndStudent(teacherId, studentId) {
  return prisma.studentTeacherRelation.findFirst({
    where: { teacherId: Number(teacherId), studentId: Number(studentId) },
  });
}

async function getPendingRelationsByTeacherId(teacherId) {
  return prisma.studentTeacherRelation.findMany({
    where: { teacherId: Number(teacherId), status: 'pending' },
  });
}

async function getActiveRelationsByTeacherId(teacherId) {
  return prisma.studentTeacherRelation.findMany({
    where: { teacherId: Number(teacherId), status: 'active' },
  });
}

async function getActiveStudentIdsByTeacherId(teacherId) {
  const relations = await getActiveRelationsByTeacherId(teacherId);
  return relations.map(r => r.studentId);
}

async function getReviewedRelationsByTeacherId(teacherId) {
  return prisma.studentTeacherRelation.findMany({
    where: { teacherId: Number(teacherId), rating: { not: null } },
  });
}

async function getActiveRelationByStudentId(studentId) {
  return prisma.studentTeacherRelation.findFirst({
    where: { studentId: Number(studentId), status: 'active' },
  });
}

async function getRelationsByStudentId(studentId) {
  return prisma.studentTeacherRelation.findMany({
    where: { studentId: Number(studentId), status: 'active' },
  });
}

async function getAllRelationsByStudentId(studentId) {
  return prisma.studentTeacherRelation.findMany({
    where: { studentId: Number(studentId) },
  });
}

async function createRelationRequest(teacherId, studentId) {
  return prisma.studentTeacherRelation.create({
    data: {
      teacherId: Number(teacherId),
      studentId: Number(studentId),
      status: 'pending',
    },
  });
}

async function resetRelationToPending(relationId) {
  return prisma.studentTeacherRelation.update({
    where: { relationId: Number(relationId) },
    data: { status: 'pending' },
  });
}

async function removeRelationById(relationId) {
  try {
    return await prisma.studentTeacherRelation.delete({
      where: { relationId: Number(relationId) },
    });
  } catch (error) {
    if (error.code === 'P2025') return null;
    throw error;
  }
}

async function updateRelationStatusById(relationId, teacherId, status) {
  const relation = await getRelationById(relationId);
  if (!relation) return null;
  if (String(relation.teacherId) !== String(teacherId)) return false;

  return prisma.studentTeacherRelation.update({
    where: { relationId: Number(relationId) },
    data: { status },
  });
}

async function updateRelationReviewById(relationId, studentId, rating, studentFeedback) {
  const relation = await getRelationById(relationId);
  if (!relation) return null;
  if (String(relation.studentId) !== String(studentId) || relation.status !== 'active') return false;

  return prisma.studentTeacherRelation.update({
    where: { relationId: Number(relationId) },
    data: { rating: Number(rating), student_feedback: studentFeedback },
  });
}

module.exports = {
  getAllRelations,
  getRelationById,
  getRelationByTeacherAndStudent,
  getPendingRelationsByTeacherId,
  getActiveRelationsByTeacherId,
  getActiveStudentIdsByTeacherId,
  getReviewedRelationsByTeacherId,
  getActiveRelationByStudentId,
  getRelationsByStudentId,
  getAllRelationsByStudentId,
  createRelationRequest,
  resetRelationToPending,
  removeRelationById,
  updateRelationStatusById,
  updateRelationReviewById,
};
