const { sendSuccess } = require('../utils/response');
const { createHttpError, withErrorHandling } = require('../utils/httpError');
const { validateIdParam, validateRequiredFields } = require('../utils/validators');
const { getAllTeachers, getTeacherById, getTeacherByUserId, updateTeacherById } = require('../models/teachers.model');
const { getReviewedRelationsByTeacherId } = require('../models/relations.model');

/**
 * GET /api/teachers/my-reviews
 * Returns all student reviews received by the currently logged-in teacher.
 * The teacher's ID is read from the x-user-id request header.
 * Also computes the average rating across all reviews.
 */
const getMyReviews = withErrorHandling((req, res) => {
  const validatedUserId = validateIdParam(req.header('x-user-id'), 'x-user-id');

  if (!validatedUserId.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', validatedUserId.message, validatedUserId.details);
  }

  const teacherProfile = getTeacherByUserId(validatedUserId.value);

  if (!teacherProfile) {
    throw createHttpError(404, 'TEACHER_NOT_FOUND', 'Teacher profile not found for this user.', { userId: validatedUserId.value });
  }

  const reviewedRelations = getReviewedRelationsByTeacherId(teacherProfile.teacherId);

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
});

/**
 * GET /api/teachers
 * Returns the list of all teachers, with optional query-string filters:
 *   ?available=true|false  \u2014 filter by availability
 *   ?maxPrice=<number>     \u2014 filter by maximum price per week
 */
const listTeachers = withErrorHandling((req, res) => {
  // req.query contains values from the URL query string (e.g. ?available=true&maxPrice=100)
  const { available, maxPrice } = req.query;
  const filters = {};

  if (available !== undefined) {
    // Query strings are always strings; validate before converting to boolean
    if (available !== 'true' && available !== 'false') {
      throw createHttpError(400, 'VALIDATION_ERROR', 'Invalid available filter', {
        available,
        expected: ['true', 'false'],
      }); 
    }

    filters.available = available === 'true'; // Convert string 'true'/'false' to boolean
  }

  if (maxPrice !== undefined) {
    const parsedMaxPrice = Number(maxPrice); // Convert string to number

    if (Number.isNaN(parsedMaxPrice)) {
      throw createHttpError(400, 'VALIDATION_ERROR', 'Invalid maxPrice filter', {
        maxPrice,
        expected: 'number',
      });
    }

    filters.maxPrice = parsedMaxPrice;
  }

  return sendSuccess(res, 200, getAllTeachers(filters));
});

/**
 * GET /api/teachers/:id
 * Returns a single teacher by their numeric teacherId.
 */
const getTeacher = withErrorHandling((req, res) => {
  const validatedId = validateIdParam(req.params.id, 'id');

  if (!validatedId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedId.message,
      validatedId.details
    );
  }

  const teacher = getTeacherById(validatedId.value);

  if (!teacher) {
    throw createHttpError(404, 'TEACHER_NOT_FOUND', 'Teacher not found', {
      teacherId: validatedId.value,
    });
  }

  return sendSuccess(res, 200, teacher);
});

/**
 * PUT /api/teachers/:id
 * Updates a teacher's profile fields.
 * Required: experience, pricePerWeek, specialties, available, feedbackFrequency.
 * Optional: bio, teachingLevels, availability, onlineOnly.
 * Can be called by admin or by the teacher themselves (allowSelf is set in the route).
 */
const updateTeacher = withErrorHandling((req, res) => {
  const validatedId = validateIdParam(req.params.id, 'id');
  const requiredFieldsValidation = validateRequiredFields(req.body, [
    'experience',
    'pricePerWeek',
    'specialties',
    'available',
    'feedbackFrequency',
  ]);

  if (!validatedId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedId.message,
      validatedId.details
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

  const updatedTeacher = updateTeacherById(validatedId.value, {
    experience: req.body.experience,
    pricePerWeek: req.body.pricePerWeek,
    specialties: req.body.specialties,
    available: req.body.available,
    feedbackFrequency: req.body.feedbackFrequency,
    // Optional profile setup fields
    bio: req.body.bio ?? null,
    teachingLevels: req.body.teachingLevels ?? [],
    availability: req.body.availability ?? null,
    onlineOnly: req.body.onlineOnly ?? null,
  });

  if (!updatedTeacher) {
    throw createHttpError(404, 'TEACHER_NOT_FOUND', 'Teacher not found', {
      teacherId: validatedId.value,
    });
  }

  return sendSuccess(res, 200, {
    teacherId: updatedTeacher.teacherId,
  });
});

/**
 * GET /api/teachers/me
 * Returns the currently logged-in teacher's own profile.
 * Resolves teacherId from the x-user-id header via getTeacherByUserId.
 */
const getMyProfile = withErrorHandling((req, res) => {
  const validatedUserId = validateIdParam(req.header('x-user-id'), 'x-user-id');

  if (!validatedUserId.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', validatedUserId.message, validatedUserId.details);
  }

  const teacherRaw = getTeacherByUserId(validatedUserId.value);

  if (!teacherRaw) {
    throw createHttpError(404, 'TEACHER_NOT_FOUND', 'Teacher profile not found for this user.', { userId: validatedUserId.value });
  }

  return sendSuccess(res, 200, getTeacherById(teacherRaw.teacherId));
});

module.exports = {
  getMyProfile,
  getMyReviews,
  listTeachers,
  getTeacher,
  updateTeacher,
};