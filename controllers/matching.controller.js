const {
  getStudentPreferencesByUserId,
  saveStudentPreferences,
} = require('../models/matching.model');
const { getRecommendations } = require('../services/matching.service');
const { sendSuccess } = require('../utils/response');
const { createHttpError, withErrorHandling } = require('../utils/httpError');
const { validateIdParam, validateRequiredFields } = require('../utils/validators');

/**
 * POST /api/matching/preferences
 * Saves (or replaces) the student's matching preferences, then immediately returns
 * teacher recommendations based on those preferences.
 * The student's ID is read from the x-user-id header.
 * Returns the recommendations on success (201 Created).
 */
const saveMatchingPreferences = withErrorHandling((req, res) => {
  // Read the logged-in student's ID from the request header
  const validatedUserId = validateIdParam(req.header('x-user-id'), 'x-user-id');
  const requiredFieldsValidation = validateRequiredFields(req.body, [
    'budget_max',
    'learning_goal',
    'onboarding_text',
    'currentLevel',
  ]);

  if (!validatedUserId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedUserId.message,
      validatedUserId.details
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

  const savedPreferences = saveStudentPreferences(validatedUserId.value, {
    budget_max: req.body.budget_max,
    learning_goal: req.body.learning_goal,
    onboarding_text: req.body.onboarding_text,
    currentLevel: req.body.currentLevel,
    // Optional onboarding fields — accepted if provided, ignored if absent
    availability: req.body.availability,
    teacherGender: req.body.teacherGender,
    mainGoal: req.body.mainGoal,
    onlineOnly: req.body.onlineOnly,
  });

  // Return recommendations immediately after saving (no need for a second request)
  return sendSuccess(res, 201, await getRecommendations(savedPreferences));
});

/**
 * GET /api/matching/recommendations
 * Returns teacher recommendations based on the student's previously saved preferences.
 * Returns 404 if the student has not saved preferences yet.
 */
const getMatchingRecommendations = withErrorHandling((req, res) => {
  const validatedUserId = validateIdParam(req.header('x-user-id'), 'x-user-id');

  if (!validatedUserId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedUserId.message,
      validatedUserId.details
    );
  }

  const preferences = getStudentPreferencesByUserId(validatedUserId.value);

  if (!preferences) {
    throw createHttpError(
      404,
      'PREFERENCES_NOT_FOUND',
      'Student preferences not found',
      {
        userId: validatedUserId.value,
      }
    );
  }

  return sendSuccess(res, 200, await getRecommendations(preferences));
});

module.exports = {
  saveMatchingPreferences,
  getMatchingRecommendations,
};