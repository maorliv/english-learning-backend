const { sendError, sendSuccess } = require('../utils/response');
const { validateIdParam, validateRequiredFields } = require('../utils/validators');
const {
  createRelationRequest,
  getRelationByTeacherAndStudent,
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

module.exports = {
  requestRelation,
};