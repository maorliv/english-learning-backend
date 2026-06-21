const { sendSuccess } = require('../utils/response');
const { createHttpError, withErrorHandling } = require('../utils/httpError');
const { validateIdParam, validateRequiredFields } = require('../utils/validators');
const teachersService = require('../services/teachers.service');

/** Returns all student reviews for the logged-in teacher along with their computed average rating. */
const getMyReviews = withErrorHandling(async (req, res) => {
  const validatedUserId = validateIdParam(req.header('x-user-id'), 'x-user-id');

  if (!validatedUserId.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', validatedUserId.message, validatedUserId.details);
  }

  const teacherProfile = await teachersService.getTeacherByUserId(validatedUserId.value);

  if (!teacherProfile) {
    throw createHttpError(404, 'TEACHER_NOT_FOUND', 'Teacher profile not found for this user.', { userId: validatedUserId.value });
  }

  const reviewedRelations = await teachersService.getReviewedRelationsByTeacherId(teacherProfile.teacherId);

  const reviews = reviewedRelations.map((relation) => ({
    studentId: relation.studentId,
    rating: relation.rating,
    feedback: relation.student_feedback,
  }));

  const avgRating =
    reviews.length === 0
      ? 0
      : reviews.reduce((total, review) => total + Number(review.rating || 0), 0) / reviews.length;

  return sendSuccess(res, 200, { avgRating, reviews });
});

const listTeachers = withErrorHandling(async (req, res) => {
  const { available, maxPrice } = req.query;
  const filters = {};

  if (available !== undefined) {
    if (available !== 'true' && available !== 'false') {
      throw createHttpError(400, 'VALIDATION_ERROR', 'Invalid available filter', {
        available,
        expected: ['true', 'false'],
      });
    }
    filters.available = available === 'true';
  }

  if (maxPrice !== undefined) {
    const parsedMaxPrice = Number(maxPrice);
    if (Number.isNaN(parsedMaxPrice)) {
      throw createHttpError(400, 'VALIDATION_ERROR', 'Invalid maxPrice filter', {
        maxPrice,
        expected: 'number',
      });
    }
    filters.maxPrice = parsedMaxPrice;
  }

  return sendSuccess(res, 200, await teachersService.getAllTeachers(filters));
});

const getTeacher = withErrorHandling(async (req, res) => {
  const validatedId = validateIdParam(req.params.id, 'id');

  if (!validatedId.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', validatedId.message, validatedId.details);
  }

  const teacher = await teachersService.getTeacherById(validatedId.value);

  if (!teacher) {
    throw createHttpError(404, 'TEACHER_NOT_FOUND', 'Teacher not found', {
      teacherId: validatedId.value,
    });
  }

  return sendSuccess(res, 200, teacher);
});

const updateTeacher = withErrorHandling(async (req, res) => {
  const validatedId = validateIdParam(req.params.id, 'id');
  const requiredFieldsValidation = validateRequiredFields(req.body, [
    'experience',
    'pricePerWeek',
    'specialties',
    'available',
    'feedbackFrequency',
  ]);

  if (!validatedId.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', validatedId.message, validatedId.details);
  }

  if (!requiredFieldsValidation.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', requiredFieldsValidation.message, requiredFieldsValidation.details);
  }

  const updatedTeacher = await teachersService.updateTeacherById(validatedId.value, {
    experience: req.body.experience,
    pricePerWeek: req.body.pricePerWeek,
    specialties: req.body.specialties,
    available: req.body.available,
    feedbackFrequency: req.body.feedbackFrequency,
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

  return sendSuccess(res, 200, { teacherId: updatedTeacher.teacherId });
});

const getMyProfile = withErrorHandling(async (req, res) => {
  const validatedUserId = validateIdParam(req.header('x-user-id'), 'x-user-id');

  if (!validatedUserId.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', validatedUserId.message, validatedUserId.details);
  }

  const teacher = await teachersService.getTeacherByUserId(validatedUserId.value);

  if (!teacher) {
    throw createHttpError(404, 'TEACHER_NOT_FOUND', 'Teacher profile not found for this user.', { userId: validatedUserId.value });
  }

  return sendSuccess(res, 200, teacher);
});

module.exports = {
  getMyProfile,
  getMyReviews,
  listTeachers,
  getTeacher,
  updateTeacher,
};
