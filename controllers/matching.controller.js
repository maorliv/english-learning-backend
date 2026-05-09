const {
  getStudentPreferencesByUserId,
  getMockTeacherRecommendationsForPreferences,
  saveStudentPreferences,
} = require('../models/matching.model');
const { sendError, sendSuccess } = require('../utils/response');
const { validateIdParam, validateRequiredFields } = require('../utils/validators');

function saveMatchingPreferences(req, res) {
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

  return sendSuccess(res, 201, getMockTeacherRecommendationsForPreferences(savedPreferences));
}

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