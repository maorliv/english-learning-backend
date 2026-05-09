const { sendError, sendSuccess } = require('../utils/response');
const { validateIdParam, validateRequiredFields } = require('../utils/validators');
const { getUserById } = require('../models/users.model');
const {
  createRelationRequest,
  getRelationByTeacherAndStudent,
  getPendingRelationsByTeacherId,
} = require('../models/relations.model');

function requestRelation(req, res) {
  const validatedStudentId = validateIdParam(req.header('x-user-id'), 'x-user-id');
  const requiredFieldsValidation = validateRequiredFields(req.body, ['teacherId']);

  if (!validatedStudentId.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      validatedStudentId.message,
      validatedStudentId.details
    );
  }

  if (!requiredFieldsValidation.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      requiredFieldsValidation.message,
      requiredFieldsValidation.details
    );
  }

  const validatedTeacherId = validateIdParam(req.body.teacherId, 'teacherId');

  if (!validatedTeacherId.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      validatedTeacherId.message,
      validatedTeacherId.details
    );
  }

  const existingRelation = getRelationByTeacherAndStudent(
    validatedTeacherId.value,
    validatedStudentId.value
  );

  if (existingRelation) {
    return sendError(
      res,
      409,
      'RELATION_ALREADY_EXISTS',
      'Relation already exists between this student and teacher',
      {
        relationId: existingRelation.relationId,
        teacherId: validatedTeacherId.value,
        studentId: validatedStudentId.value,
      }
    );
  }

  const relation = createRelationRequest(validatedTeacherId.value, validatedStudentId.value);

  return sendSuccess(res, 201, {
    relationId: relation.relationId,
    status: relation.status,
  });
}

function listPendingRelations(req, res) {
  const validatedTeacherId = validateIdParam(req.header('x-user-id'), 'x-user-id');

  if (!validatedTeacherId.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      validatedTeacherId.message,
      validatedTeacherId.details
    );
  }

  const pendingRelations = getPendingRelationsByTeacherId(validatedTeacherId.value).map(
    (relation) => {
      const student = getUserById(relation.studentId);

      return {
        relationId: relation.relationId,
        studentId: relation.studentId,
        firstName: student ? student.firstName : null,
        lastName: student ? student.lastName : null,
        createdAt: relation.createdAt,
      };
    }
  );

  return sendSuccess(res, 200, pendingRelations);
}

module.exports = {
  listPendingRelations,
  requestRelation,
};