const { sendSuccess } = require('../utils/response');
const { createHttpError, withErrorHandling } = require('../utils/httpError');
const { validateRequiredFields, validateStringIdParam } = require('../utils/validators');
const grammarService = require('../services/grammarRules.service');

const createGrammarRuleHandler = withErrorHandling(async (req, res) => {
  const requiredFieldsValidation = validateRequiredFields(req.body, [
    'id', 'category', 'usage', 'forms', 'spellingRules', 'examples', 'keywords',
  ]);
  if (!requiredFieldsValidation.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', requiredFieldsValidation.message, requiredFieldsValidation.details);
  }

  const created = await grammarService.createGrammarRule({
    id: String(req.body.id).trim(),
    category: req.body.category,
    usage: req.body.usage,
    forms: req.body.forms,
    spellingRules: req.body.spellingRules,
    examples: req.body.examples,
    keywords: req.body.keywords,
  });

  return sendSuccess(res, 201, { grammarRuleId: created.id });
});

const listGrammarRules = withErrorHandling(async (req, res) => {
  const category = req.query.category ? String(req.query.category).trim() : undefined;
  return sendSuccess(res, 200, await grammarService.getAllGrammarRules(category));
});

const getGrammarRule = withErrorHandling(async (req, res) => {
  const validatedId = validateStringIdParam(req.params.id, 'id');
  if (!validatedId.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', validatedId.message, validatedId.details);
  }

  const rule = await grammarService.getGrammarRuleById(validatedId.value);
  if (!rule) {
    throw createHttpError(404, 'GRAMMAR_RULE_NOT_FOUND', 'Grammar rule not found', { id: validatedId.value });
  }

  return sendSuccess(res, 200, rule);
});

const updateGrammarRule = withErrorHandling(async (req, res) => {
  const validatedId = validateStringIdParam(req.params.id, 'id');
  const requiredFieldsValidation = validateRequiredFields(req.body, [
    'category', 'usage', 'forms', 'spellingRules', 'examples', 'keywords',
  ]);
  if (!validatedId.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', validatedId.message, validatedId.details);
  }
  if (!requiredFieldsValidation.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', requiredFieldsValidation.message, requiredFieldsValidation.details);
  }

  const updated = await grammarService.updateGrammarRuleById(validatedId.value, req.body);
  if (!updated) {
    throw createHttpError(404, 'GRAMMAR_RULE_NOT_FOUND', 'Grammar rule not found', { id: validatedId.value });
  }

  return sendSuccess(res, 200, { grammarRuleId: updated.id });
});

const deleteGrammarRule = withErrorHandling(async (req, res) => {
  const validatedId = validateStringIdParam(req.params.id, 'id');
  if (!validatedId.isValid) {
    throw createHttpError(400, 'VALIDATION_ERROR', validatedId.message, validatedId.details);
  }

  const deleted = await grammarService.deleteGrammarRuleById(validatedId.value);
  if (!deleted) {
    throw createHttpError(404, 'GRAMMAR_RULE_NOT_FOUND', 'Grammar rule not found', { id: validatedId.value });
  }

  return sendSuccess(res, 200, { grammarRuleId: deleted.id });
});

module.exports = { createGrammarRuleHandler, listGrammarRules, getGrammarRule, updateGrammarRule, deleteGrammarRule };
