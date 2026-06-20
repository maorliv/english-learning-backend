const { sendSuccess } = require('../utils/response');
const { createHttpError, withErrorHandling } = require('../utils/httpError');
const { validateIdParam, validateRequiredFields } = require('../utils/validators');
const matchingService = require('../services/matching.service');

const saveMatchingPreferences = withErrorHandling(async (req, res) => {
  const vUserId = validateIdParam(req.header('x-user-id'), 'x-user-id');
  const reqValidation = validateRequiredFields(req.body, ['budget_max', 'learning_goal', 'onboarding_text', 'currentLevel']);
  if (!vUserId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', vUserId.message, vUserId.details);
  if (!reqValidation.isValid) throw createHttpError(400, 'VALIDATION_ERROR', reqValidation.message, reqValidation.details);

  const saved = await matchingService.saveStudentPreferences(vUserId.value, {
    budget_max: req.body.budget_max,
    learning_goal: req.body.learning_goal,
    onboarding_text: req.body.onboarding_text,
    currentLevel: req.body.currentLevel,
    availability: req.body.availability,
    teacherGender: req.body.teacherGender,
    mainGoal: req.body.mainGoal,
    onlineOnly: req.body.onlineOnly,
  });

  const recommendations = await matchingService.getRecommendationsForPreferences(saved);
  return sendSuccess(res, 201, recommendations);
});

const getMatchingRecommendations = withErrorHandling(async (req, res) => {
  const vUserId = validateIdParam(req.header('x-user-id'), 'x-user-id');
  if (!vUserId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', vUserId.message, vUserId.details);

  const preferences = await matchingService.getStudentPreferencesByUserId(vUserId.value);
  if (!preferences) throw createHttpError(404, 'PREFERENCES_NOT_FOUND', 'Student preferences not found', { userId: vUserId.value });

  return sendSuccess(res, 200, await matchingService.getRecommendationsForPreferences(preferences));
});

const getMatchingPreferences = withErrorHandling(async (req, res) => {
  const vUserId = validateIdParam(req.header('x-user-id'), 'x-user-id');
  if (!vUserId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', vUserId.message, vUserId.details);

  const preferences = await matchingService.getStudentPreferencesByUserId(vUserId.value);
  if (!preferences) throw createHttpError(404, 'PREFERENCES_NOT_FOUND', 'Student preferences not found', { userId: vUserId.value });

  return sendSuccess(res, 200, preferences);
});

module.exports = { saveMatchingPreferences, getMatchingRecommendations, getMatchingPreferences };
