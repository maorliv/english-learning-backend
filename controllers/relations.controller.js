const { sendError, sendSuccess } = require('../utils/response');
const { validateIdParam, validateRequiredFields } = require('../utils/validators');
const { getUserById } = require('../models/users.model');
const {
  createRelationRequest,
  getRelationById,
  getRelationByTeacherAndStudent,
  getPendingRelationsByTeacherId,
  updateRelationStatusById,
} = require('../models/relations.model');

const ALLOWED_RELATION_STATUSES = ['active', 'rejected'];

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

function updateRelationStatus(req, res) {
  const validatedTeacherId = validateIdParam(req.header('x-user-id'), 'x-user-id');
  const validatedRelationId = validateIdParam(req.params.id, 'id');
  const requiredFieldsValidation = validateRequiredFields(req.body, ['status']);

  if (!validatedTeacherId.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      validatedTeacherId.message,
      validatedTeacherId.details
    );
  }

  if (!validatedRelationId.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      validatedRelationId.message,
      validatedRelationId.details
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

  const normalizedStatus = String(req.body.status).trim().toLowerCase();

  if (!ALLOWED_RELATION_STATUSES.includes(normalizedStatus)) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      'Invalid status value',
      {
        field: 'status',
        allowedValues: ALLOWED_RELATION_STATUSES,
        receivedValue: req.body.status,
      }
    );
  }

  const relation = getRelationById(validatedRelationId.value);

  if (!relation) {
    return sendError(
      res,
      404,
      'RELATION_NOT_FOUND',
      'Relation not found',
      {
        relationId: validatedRelationId.value,
      }
    );
  }

  if (String(relation.teacherId) !== String(validatedTeacherId.value)) {
    return sendError(
      res,
      403,
      'FORBIDDEN',
      'You do not have permission to update this relation.',
      {
        relationId: validatedRelationId.value,
        teacherId: validatedTeacherId.value,
      }
    );
  }

  const updatedRelation = updateRelationStatusById(
    validatedRelationId.value,
    validatedTeacherId.value,
    normalizedStatus
  );

  return sendSuccess(res, 200, {
    relationId: updatedRelation.relationId,
    status: updatedRelation.status,
  });
}

module.exports = {
  listPendingRelations,
  requestRelation,
  updateRelationStatus,
};