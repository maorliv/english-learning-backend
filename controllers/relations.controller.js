const { sendSuccess } = require('../utils/response');
const { createHttpError, withErrorHandling } = require('../utils/httpError');
const { validateIdParam, validateRequiredFields } = require('../utils/validators');
const { getUserById } = require('../models/users.model');
const {
  createRelationRequest,
  getAllRelations,
  getActiveRelationByStudentId,
  getActiveRelationsByTeacherId,
  getRelationById,
  getRelationByTeacherAndStudent,
  getPendingRelationsByTeacherId,
  updateRelationReviewById,
  updateRelationStatusById,
} = require('../models/relations.model');

// Statuses a teacher can set when responding to a request
const ALLOWED_RELATION_STATUSES = ['active', 'rejected'];
// Statuses that can be used as query filters
const FILTERABLE_RELATION_STATUSES = ['pending', 'active', 'rejected'];

/**
 * GET /api/relations
 * Returns all student-teacher relations. Accepts an optional ?status= filter.
 * Restricted to admin.
 */
const listRelations = withErrorHandling((req, res) => {
  // Normalize status from query string (e.g. ?status=pending)
  const status = req.query.status ? String(req.query.status).trim().toLowerCase() : undefined;

  if (status && !FILTERABLE_RELATION_STATUSES.includes(status)) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      'Invalid status filter',
      {
        status: req.query.status,
        allowedValues: FILTERABLE_RELATION_STATUSES,
      }
    );
  }

  return sendSuccess(res, 200, getAllRelations(status));
});

/**
 * POST /api/relations/request
 * Creates a new pending relation request from the logged-in student to a teacher.
 * The student's ID comes from the x-user-id header; the teacher's ID comes from req.body.
 * Returns 409 if a relation between this pair already exists.
 */
const requestRelation = withErrorHandling((req, res) => {
  const validatedStudentId = validateIdParam(req.header('x-user-id'), 'x-user-id');
  const requiredFieldsValidation = validateRequiredFields(req.body, ['teacherId']);

  if (!validatedStudentId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedStudentId.message,
      validatedStudentId.details
    );
  }

  if (!requiredFieldsValidation.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      requiredFieldsValidation.message,
      requiredFieldsValidation.details
    );
  }

  // teacherId comes from the request body, not the URL
  const validatedTeacherId = validateIdParam(req.body.teacherId, 'teacherId');

  if (!validatedTeacherId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedTeacherId.message,
      validatedTeacherId.details
    );
  }

  // 409 Conflict \u2014 prevent duplicate relations between the same pair
  const existingRelation = getRelationByTeacherAndStudent(
    validatedTeacherId.value,
    validatedStudentId.value
  );

  if (existingRelation) {
    throw createHttpError(
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
});

/**
 * GET /api/relations/pending
 * Returns all pending relation requests for the logged-in teacher.
 * Enriches each record with the student's first and last name.
 */
const listPendingRelations = withErrorHandling((req, res) => {
  const validatedTeacherId = validateIdParam(req.header('x-user-id'), 'x-user-id');

  if (!validatedTeacherId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedTeacherId.message,
      validatedTeacherId.details
    );
  }

  const pendingRelations = getPendingRelationsByTeacherId(validatedTeacherId.value).map(
    (relation) => {
      const student = getUserById(relation.studentId); // Look up the student's name from the users model

      return {
        relationId: relation.relationId,
        studentId: relation.studentId,
        firstName: student ? student.firstName : null,   // Gracefully handle missing user
        lastName: student ? student.lastName : null,
        createdAt: relation.createdAt,
      };
    }
  );

  return sendSuccess(res, 200, pendingRelations);
});

/**
 * GET /api/relations/my-students
 * Returns all students with an active relation with the logged-in teacher.
 * Enriches each record with the student's name from the users model.
 */
const listMyStudents = withErrorHandling((req, res) => {
  const validatedTeacherId = validateIdParam(req.header('x-user-id'), 'x-user-id');

  if (!validatedTeacherId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedTeacherId.message,
      validatedTeacherId.details
    );
  }

  const activeStudents = getActiveRelationsByTeacherId(validatedTeacherId.value).map((relation) => {
    const student = getUserById(relation.studentId);

    return {
      studentId: relation.studentId,
      firstName: student ? student.firstName : null,
      lastName: student ? student.lastName : null,
      currentLevel: null,     // Not stored in the relation; could be extended in future
      lastActivityDate: null,
    };
  });

  return sendSuccess(res, 200, activeStudents);
});

/**
 * POST /api/relations/my-teacher/review
 * Lets the logged-in student submit a rating and feedback for their current teacher.
 * Requires an active relation; returns 404 if none is found.
 */
const reviewMyTeacher = withErrorHandling((req, res) => {
  const validatedStudentId = validateIdParam(req.header('x-user-id'), 'x-user-id');
  const requiredFieldsValidation = validateRequiredFields(req.body, ['rating', 'student_feedback']);

  if (!validatedStudentId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedStudentId.message,
      validatedStudentId.details
    );
  }

  if (!requiredFieldsValidation.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      requiredFieldsValidation.message,
      requiredFieldsValidation.details
    );
  }

  // The student can only review the teacher they are currently connected to
  const relation = getActiveRelationByStudentId(validatedStudentId.value);

  if (!relation) {
    throw createHttpError(
      404,
      'RELATION_NOT_FOUND',
      'Active relation not found for this student',
      {
        studentId: validatedStudentId.value,
      }
    );
  }

  const updatedRelation = updateRelationReviewById(
    relation.relationId,
    validatedStudentId.value,
    req.body.rating,
    req.body.student_feedback
  );

  return sendSuccess(res, 200, {
    relationId: updatedRelation.relationId,
  });
});

/**
 * PATCH /api/relations/:id/status
 * Allows the logged-in teacher to accept (active) or reject a pending relation request.
 * Verifies that the relation belongs to this teacher before updating.
 * Only 'active' and 'rejected' are valid status values.
 */
const updateRelationStatus = withErrorHandling((req, res) => {
  const validatedTeacherId = validateIdParam(req.header('x-user-id'), 'x-user-id');
  const validatedRelationId = validateIdParam(req.params.id, 'id');
  const requiredFieldsValidation = validateRequiredFields(req.body, ['status']);

  if (!validatedTeacherId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedTeacherId.message,
      validatedTeacherId.details
    );
  }

  if (!validatedRelationId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedRelationId.message,
      validatedRelationId.details
    );
  }

  if (!requiredFieldsValidation.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      requiredFieldsValidation.message,
      requiredFieldsValidation.details
    );
  }

  const normalizedStatus = String(req.body.status).trim().toLowerCase(); // Normalize before comparison

  if (!ALLOWED_RELATION_STATUSES.includes(normalizedStatus)) {
    throw createHttpError(
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
    throw createHttpError(
      404,
      'RELATION_NOT_FOUND',
      'Relation not found',
      {
        relationId: validatedRelationId.value,
      }
    );
  }

  // Ensure the teacher is updating their own relation, not someone else's
  if (String(relation.teacherId) !== String(validatedTeacherId.value)) {
    throw createHttpError(
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
});

module.exports = {
  listRelations,
  listMyStudents,
  listPendingRelations,
  requestRelation,
  reviewMyTeacher,
  updateRelationStatus,
};