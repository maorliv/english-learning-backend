const { sendError, sendSuccess } = require('../utils/response');
const { validateIdParam, validateRequiredFields } = require('../utils/validators');
const { getAllTeachers, getTeacherById, updateTeacherById } = require('../models/teachers.model');
const { getReviewedRelationsByTeacherId } = require('../models/relations.model');

/**
 * GET /api/teachers/my-reviews
 * Returns all student reviews received by the currently logged-in teacher.
 * The teacher's ID is read from the x-user-id request header.
 * Also computes the average rating across all reviews.
 */
function getMyReviews(req, res) {
  // x-user-id header identifies the logged-in teacher (set by the client, simulating auth)
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

  // Extract only the review-relevant fields from each relation record
  const reviews = reviewedRelations.map((relation) => ({
    studentId: relation.studentId,
    rating: relation.rating,
    feedback: relation.student_feedback,
  }));

  // Calculate average rating; return 0 if there are no reviews yet
  const avgRating =
    reviews.length === 0
      ? 0
      : reviews.reduce((total, review) => total + Number(review.rating || 0), 0) / reviews.length;

  return sendSuccess(res, 200, {
    avgRating,
    reviews,
  });
}

/**
 * GET /api/teachers
 * Returns the list of all teachers, with optional query-string filters:
 *   ?available=true|false  \u2014 filter by availability
 *   ?maxPrice=<number>     \u2014 filter by maximum price per week
 */
function listTeachers(req, res) {
  // req.query contains values from the URL query string (e.g. ?available=true&maxPrice=100)
  const { available, maxPrice } = req.query;
  const filters = {};

  if (available !== undefined) {
    // Query strings are always strings; validate before converting to boolean
    if (available !== 'true' && available !== 'false') {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid available filter', {
        available,
        expected: ['true', 'false'],
      });
    }

    filters.available = available === 'true'; // Convert string 'true'/'false' to boolean
  }

  if (maxPrice !== undefined) {
    const parsedMaxPrice = Number(maxPrice); // Convert string to number

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

/**
 * GET /api/teachers/:id
 * Returns a single teacher by their numeric teacherId.
 */
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

/**
 * PUT /api/teachers/:id
 * Updates a teacher's profile fields (experience, price, specialties, availability, feedback).
 * Can be called by admin or by the teacher themselves (allowSelf is set in the route).
 */
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