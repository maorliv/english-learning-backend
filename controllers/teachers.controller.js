const { sendError, sendSuccess } = require('../utils/response');
const { validateIdParam, validateRequiredFields } = require('../utils/validators');
const { getAllTeachers, getTeacherById, updateTeacherById } = require('../models/teachers.model');
const { getReviewedRelationsByTeacherId } = require('../models/relations.model');

function getMyReviews(req, res) {
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

  const reviewedRelations = getReviewedRelationsByTeacherId(validatedTeacherId.value);
  const reviews = reviewedRelations.map((relation) => ({
    studentId: relation.studentId,
    rating: relation.rating,
    feedback: relation.student_feedback,
  }));
  const avgRating =
    reviews.length === 0
      ? 0
      : reviews.reduce((total, review) => total + Number(review.rating || 0), 0) / reviews.length;

  return sendSuccess(res, 200, {
    avgRating,
    reviews,
  });
}

function listTeachers(req, res) {
  const { available, maxPrice } = req.query;
  const filters = {};

  if (available !== undefined) {
    if (available !== 'true' && available !== 'false') {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid available filter', {
        available,
        expected: ['true', 'false'],
      });
    }

    filters.available = available === 'true';
  }

  if (maxPrice !== undefined) {
    const parsedMaxPrice = Number(maxPrice);

    if (Number.isNaN(parsedMaxPrice)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid maxPrice filter', {
        maxPrice,
        expected: 'number',
      });
    }

    filters.maxPrice = parsedMaxPrice;
  }

  return sendSuccess(res, 200, getAllTeachers(filters));
}

function getTeacher(req, res) {
  const validatedId = validateIdParam(req.params.id, 'id');

  if (!validatedId.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      validatedId.message,
      validatedId.details
    );
  }

  const teacher = getTeacherById(validatedId.value);

  if (!teacher) {
    return sendError(res, 404, 'TEACHER_NOT_FOUND', 'Teacher not found', {
      teacherId: validatedId.value,
    });
  }

  return sendSuccess(res, 200, teacher);
}

function updateTeacher(req, res) {
  const validatedId = validateIdParam(req.params.id, 'id');
  const requiredFieldsValidation = validateRequiredFields(req.body, [
    'experience',
    'pricePerWeek',
    'specialties',
    'available',
    'feedback',
  ]);

  if (!validatedId.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      validatedId.message,
      validatedId.details
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

  const updatedTeacher = updateTeacherById(validatedId.value, {
    experience: req.body.experience,
    pricePerWeek: req.body.pricePerWeek,
    specialties: req.body.specialties,
    available: req.body.available,
    feedback: req.body.feedback,
  });

  if (!updatedTeacher) {
    return sendError(res, 404, 'TEACHER_NOT_FOUND', 'Teacher not found', {
      teacherId: validatedId.value,
    });
  }

  return sendSuccess(res, 200, {
    teacherId: updatedTeacher.teacherId,
  });
}

module.exports = {
  getMyReviews,
  listTeachers,
  getTeacher,
  updateTeacher,
};