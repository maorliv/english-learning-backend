const { sendSuccess } = require('../utils/response');
const { createHttpError, withErrorHandling } = require('../utils/httpError');
const { validateIdParam, validateRequiredFields } = require('../utils/validators');
const warmUpService = require('../services/warmUpGrammar.service');

const listWarmUpGrammar = withErrorHandling(async (req, res) => {
  return sendSuccess(res, 200, await warmUpService.getAllWarmUpGrammar());
});

const getWarmUpGrammar = withErrorHandling(async (req, res) => {
  const validatedId = validateIdParam(req.params.id, 'id');
  if (!validatedId.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', validatedId.message, validatedId.details);
  }

  const exercise = await warmUpService.getWarmUpGrammarById(validatedId.value);
  if (!exercise) {
    throw createHttpError(404, 'WARMUP_GRAMMAR_NOT_FOUND', 'Warm-up grammar exercise not found', { exerciseId: validatedId.value });
  }

  return sendSuccess(res, 200, exercise);
});

const createWarmUpGrammarHandler = withErrorHandling(async (req, res) => {
  const requiredFieldsValidation = validateRequiredFields(req.body, [
    'grammarRuleId', 'lessonId', 'type', 'instruction', 'content', 'options', 'correctAnswer', 'difficulty',
  ]);
  if (!requiredFieldsValidation.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', requiredFieldsValidation.message, requiredFieldsValidation.details);
  }

  const created = await warmUpService.createWarmUpGrammar(req.body);
  return sendSuccess(res, 201, { exerciseId: created.exerciseId });
});

const updateWarmUpGrammar = withErrorHandling(async (req, res) => {
  const validatedId = validateIdParam(req.params.id, 'id');
  const requiredFieldsValidation = validateRequiredFields(req.body, [
    'type', 'instruction', 'content', 'options', 'correctAnswer', 'difficulty',
  ]);
  if (!validatedId.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', validatedId.message, validatedId.details);
  }
  if (!requiredFieldsValidation.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', requiredFieldsValidation.message, requiredFieldsValidation.details);
  }

  const updated = await warmUpService.updateWarmUpGrammarById(validatedId.value, req.body);
  if (!updated) {
    throw createHttpError(404, 'WARMUP_GRAMMAR_NOT_FOUND', 'Warm-up grammar exercise not found', { exerciseId: validatedId.value });
  }

  return sendSuccess(res, 200, { exerciseId: updated.exerciseId });
});

const deleteWarmUpGrammar = withErrorHandling(async (req, res) => {
  const validatedId = validateIdParam(req.params.id, 'id');
  if (!validatedId.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', validatedId.message, validatedId.details);
  }

  const deleted = await warmUpService.deleteWarmUpGrammarById(validatedId.value);
  if (!deleted) {
    throw createHttpError(404, 'WARMUP_GRAMMAR_NOT_FOUND', 'Warm-up grammar exercise not found', { exerciseId: validatedId.value });
  }

  return sendSuccess(res, 200, { exerciseId: deleted.exerciseId });
});

module.exports = { listWarmUpGrammar, getWarmUpGrammar, createWarmUpGrammarHandler, updateWarmUpGrammar, deleteWarmUpGrammar };
