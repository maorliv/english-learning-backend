const {
  getStudentPreferencesByUserId,
  getMockTeacherRecommendationsForPreferences,
  saveStudentPreferences,
} = require('../models/matching.model');
const { sendError, sendSuccess } = require('../utils/response');
const { validateIdParam, validateRequiredFields } = require('../utils/validators');

/**
 * POST /api/matching/preferences
 * Saves (or replaces) the student's matching preferences, then immediately returns
 * teacher recommendations based on those preferences.
 * The student's ID is read from the x-user-id header.
 * Returns the recommendations on success (201 Created).
 */
function saveMatchingPreferences(req, res) {
  // Read the logged-in student's ID from the request header
  const validatedUserId = validateIdParam(req.header('x-user-id'), 'x-user-id');
  const requiredFieldsValidation = validateRequiredFields(req.body, [
    'budget_max',
    'learning_goal',
    'onboarding_text',
    'currentLevel',
  ]);

  if (!validatedUserId.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      validatedUserId.message,
      validatedUserId.details
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

  const savedPreferences = saveStudentPreferences(validatedUserId.value, {
    budget_max: req.body.budget_max,
    learning_goal: req.body.learning_goal,
    onboarding_text: req.body.onboarding_text,
    currentLevel: req.body.currentLevel,
  });

  // Return recommendations immediately after saving (no need for a second request)
  return sendSuccess(res, 201, getMockTeacherRecommendationsForPreferences(savedPreferences));
}

/**
 * GET /api/matching/recommendations
 * Returns teacher recommendations based on the student's previously saved preferences.
 * Returns 404 if the student has not saved preferences yet.
 */
function getMatchingRecommendations(req, res) {
  const validatedUserId = validateIdParam(req.header('x-user-id'), 'x-user-id');

  if (!validatedUserId.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      validatedUserId.message,
      validatedUserId.details
    );
  }

  const preferences = getStudentPreferencesByUserId(validatedUserId.value);

  if (!preferences) {
    return sendError(
      res,
      404,
      'PREFERENCES_NOT_FOUND',
      'Student preferences not found',
      {
        userId: validatedUserId.value,
      }
    );
  }

  return sendSuccess(res, 200, getMockTeacherRecommendationsForPreferences(preferences));
}

module.exports = {
  saveMatchingPreferences,
  getMatchingRecommendations,
};