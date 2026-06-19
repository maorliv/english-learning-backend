const { sendSuccess } = require('../utils/response');
const { createHttpError, withErrorHandling } = require('../utils/httpError');
const { validateIdParam, validateRequiredFields } = require('../utils/validators');
const usersService = require('../services/users.service');
const teachersService = require('../services/teachers.service');
const relationsService = require('../services/relations.service');
const { emitToUser } = require('../socket');

const ALLOWED_RELATION_STATUSES = ['active', 'rejected'];
const FILTERABLE_RELATION_STATUSES = ['pending', 'active', 'rejected'];

const listRelations = withErrorHandling(async (req, res) => {
  const status = req.query.status ? String(req.query.status).trim().toLowerCase() : undefined;
  if (status && !FILTERABLE_RELATION_STATUSES.includes(status)) {
    throw createHttpError(400, 'VALIDATION_ERROR', 'Invalid status filter', { status: req.query.status, allowedValues: FILTERABLE_RELATION_STATUSES });
  }
  return sendSuccess(res, 200, await relationsService.getAllRelations(status));
});

const requestRelation = withErrorHandling(async (req, res) => {
  const validatedStudentId = validateIdParam(req.header('x-user-id'), 'x-user-id');
  const requiredFieldsValidation = validateRequiredFields(req.body, ['teacherId']);
  if (!validatedStudentId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', validatedStudentId.message, validatedStudentId.details);
  if (!requiredFieldsValidation.isValid) throw createHttpError(400, 'VALIDATION_ERROR', requiredFieldsValidation.message, requiredFieldsValidation.details);

  const validatedTeacherId = validateIdParam(req.body.teacherId, 'teacherId');
  if (!validatedTeacherId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', validatedTeacherId.message, validatedTeacherId.details);

  const existing = await relationsService.getRelationByTeacherAndStudent(validatedTeacherId.value, validatedStudentId.value);
  if (existing) {
    throw createHttpError(409, 'RELATION_ALREADY_EXISTS', 'Relation already exists between this student and teacher', { relationId: existing.relationId, teacherId: validatedTeacherId.value, studentId: validatedStudentId.value });
  }

  const relation = await relationsService.createRelationRequest(validatedTeacherId.value, validatedStudentId.value);
  return sendSuccess(res, 201, { relationId: relation.relationId, status: relation.status });
});

const listPendingRelations = withErrorHandling(async (req, res) => {
  const validatedUserId = validateIdParam(req.header('x-user-id'), 'x-user-id');
  if (!validatedUserId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', validatedUserId.message, validatedUserId.details);

  const teacherProfile = await teachersService.getTeacherByUserId(validatedUserId.value);
  if (!teacherProfile) throw createHttpError(404, 'TEACHER_NOT_FOUND', 'Teacher profile not found for this user.', { userId: validatedUserId.value });

  const pending = await relationsService.getPendingRelationsByTeacherId(teacherProfile.teacherId);
  const enriched = await Promise.all(pending.map(async (r) => {
    const student = await usersService.getUserById(r.studentId);
    return { relationId: r.relationId, studentId: r.studentId, firstName: student?.firstName || null, lastName: student?.lastName || null, createdAt: r.createdAt };
  }));

  return sendSuccess(res, 200, enriched);
});

const listMyStudents = withErrorHandling(async (req, res) => {
  const validatedUserId = validateIdParam(req.header('x-user-id'), 'x-user-id');
  if (!validatedUserId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', validatedUserId.message, validatedUserId.details);

  const teacherProfile = await teachersService.getTeacherByUserId(validatedUserId.value);
  if (!teacherProfile) throw createHttpError(404, 'TEACHER_NOT_FOUND', 'Teacher profile not found for this user.', { userId: validatedUserId.value });

  const active = await relationsService.getActiveRelationsByTeacherId(teacherProfile.teacherId);
  const enriched = await Promise.all(active.map(async (r) => {
    const student = await usersService.getUserById(r.studentId);
    return { studentId: r.studentId, firstName: student?.firstName || null, lastName: student?.lastName || null, currentLevel: null, lastActivityDate: null };
  }));

  return sendSuccess(res, 200, enriched);
});

const listMyRelations = withErrorHandling(async (req, res) => {
  const validatedStudentId = validateIdParam(req.header('x-user-id'), 'x-user-id');
  if (!validatedStudentId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', validatedStudentId.message, validatedStudentId.details);

  const myRelations = await relationsService.getAllRelationsByStudentId(validatedStudentId.value);
  return sendSuccess(res, 200, myRelations.map(r => ({ relationId: r.relationId, teacherId: r.teacherId, status: r.status })));
});

const listMyTeachers = withErrorHandling(async (req, res) => {
  const validatedStudentId = validateIdParam(req.header('x-user-id'), 'x-user-id');
  if (!validatedStudentId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', validatedStudentId.message, validatedStudentId.details);

  const myRelations = await relationsService.getRelationsByStudentId(validatedStudentId.value);
  const result = await Promise.all(myRelations.map(async (r) => {
    const teacher = await teachersService.getTeacherById(r.teacherId);
    return { relationId: r.relationId, teacherId: r.teacherId, firstName: teacher?.firstName || null, lastName: teacher?.lastName || null, rank: teacher?.rank || null };
  }));

  return sendSuccess(res, 200, result);
});

const reviewMyTeacher = withErrorHandling(async (req, res) => {
  const validatedStudentId = validateIdParam(req.header('x-user-id'), 'x-user-id');
  const requiredFieldsValidation = validateRequiredFields(req.body, ['relationId', 'rating', 'student_feedback']);
  if (!validatedStudentId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', validatedStudentId.message, validatedStudentId.details);
  if (!requiredFieldsValidation.isValid) throw createHttpError(400, 'VALIDATION_ERROR', requiredFieldsValidation.message, requiredFieldsValidation.details);

  const validatedRelationId = validateIdParam(req.body.relationId, 'relationId');
  if (!validatedRelationId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', validatedRelationId.message, validatedRelationId.details);

  const relation = await relationsService.getRelationById(validatedRelationId.value);
  if (!relation) throw createHttpError(404, 'RELATION_NOT_FOUND', 'Relation not found', { relationId: validatedRelationId.value });
  if (String(relation.studentId) !== String(validatedStudentId.value) || relation.status !== 'active') {
    throw createHttpError(403, 'FORBIDDEN', 'You do not have permission to review this teacher.', { relationId: validatedRelationId.value });
  }

  const updated = await relationsService.updateRelationReviewById(relation.relationId, validatedStudentId.value, req.body.rating, req.body.student_feedback);
  return sendSuccess(res, 200, { relationId: updated.relationId });
});

const updateRelationStatus = withErrorHandling(async (req, res) => {
  const userRole = req.header('x-user-role');
  const validatedUserId = validateIdParam(req.header('x-user-id'), 'x-user-id');
  const validatedRelationId = validateIdParam(req.params.id, 'id');
  const requiredFieldsValidation = validateRequiredFields(req.body, ['status']);
  if (!validatedUserId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', validatedUserId.message, validatedUserId.details);
  if (!validatedRelationId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', validatedRelationId.message, validatedRelationId.details);
  if (!requiredFieldsValidation.isValid) throw createHttpError(400, 'VALIDATION_ERROR', requiredFieldsValidation.message, requiredFieldsValidation.details);

  const normalizedStatus = String(req.body.status).trim().toLowerCase();
  if (!ALLOWED_RELATION_STATUSES.includes(normalizedStatus)) {
    throw createHttpError(400, 'VALIDATION_ERROR', 'Invalid status value', { field: 'status', allowedValues: ALLOWED_RELATION_STATUSES, receivedValue: req.body.status });
  }

  const relation = await relationsService.getRelationById(validatedRelationId.value);
  if (!relation) throw createHttpError(404, 'RELATION_NOT_FOUND', 'Relation not found', { relationId: validatedRelationId.value });

  let effectiveTeacherId = relation.teacherId;
  if (userRole === 'teacher') {
    const teacherProfile = await teachersService.getTeacherByUserId(validatedUserId.value);
    if (!teacherProfile) throw createHttpError(404, 'TEACHER_NOT_FOUND', 'Teacher profile not found for this user.', { userId: validatedUserId.value });
    if (String(relation.teacherId) !== String(teacherProfile.teacherId)) {
      throw createHttpError(403, 'FORBIDDEN', 'You do not have permission to update this relation.', { relationId: validatedRelationId.value, teacherId: teacherProfile.teacherId });
    }
    effectiveTeacherId = teacherProfile.teacherId;
  }

  const updated = await relationsService.updateRelationStatusById(validatedRelationId.value, effectiveTeacherId, normalizedStatus);

  // Notify the student when their request is accepted
  if (normalizedStatus === 'active') {
    const teacher = await teachersService.getTeacherById(effectiveTeacherId);
    emitToUser(relation.studentId, 'relation:accepted', {
      relationId: updated.relationId,
      teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Your teacher',
    });
  }

  return sendSuccess(res, 200, { relationId: updated.relationId, status: updated.status });
});

const removeRelation = withErrorHandling(async (req, res) => {
  const validatedStudentId = validateIdParam(req.header('x-user-id'), 'x-user-id');
  const validatedRelationId = validateIdParam(req.params.id, 'id');
  if (!validatedStudentId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', validatedStudentId.message, validatedStudentId.details);
  if (!validatedRelationId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', validatedRelationId.message, validatedRelationId.details);

  const relation = await relationsService.getRelationById(validatedRelationId.value);
  if (!relation) throw createHttpError(404, 'RELATION_NOT_FOUND', 'Relation not found.', { relationId: validatedRelationId.value });
  if (String(relation.studentId) !== String(validatedStudentId.value)) throw createHttpError(403, 'FORBIDDEN', 'You do not have permission to remove this relation.', { relationId: validatedRelationId.value });
  if (relation.status !== 'active') throw createHttpError(409, 'INVALID_STATUS', 'Only active connections can be removed.', { relationId: validatedRelationId.value, status: relation.status });

  await relationsService.removeRelationById(validatedRelationId.value);
  return sendSuccess(res, 200, { relationId: validatedRelationId.value });
});

module.exports = { listRelations, listMyRelations, listMyStudents, listMyTeachers, listPendingRelations, requestRelation, removeRelation, reviewMyTeacher, updateRelationStatus };
