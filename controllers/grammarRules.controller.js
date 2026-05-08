const { sendError, sendSuccess } = require('../utils/response');
const { validateRequiredFields, validateStringIdParam } = require('../utils/validators');
const {
  createGrammarRule,
  deleteGrammarRuleById,
  getAllGrammarRules,
  getGrammarRuleById,
  updateGrammarRuleById,
} = require('../models/grammarRules.model');

function createGrammarRuleHandler(req, res) {
  const requiredFieldsValidation = validateRequiredFields(req.body, [
    'id',
    'category',
    'usage',
    'forms',
    'spellingRules',
    'examples',
    'keywords',
  ]);

  if (!requiredFieldsValidation.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      requiredFieldsValidation.message,
      requiredFieldsValidation.details
    );
  }

  const createdGrammarRule = createGrammarRule({
    id: String(req.body.id).trim(),
    category: req.body.category,
    usage: req.body.usage,
    forms: req.body.forms,
    spellingRules: req.body.spellingRules,
    examples: req.body.examples,
    keywords: req.body.keywords,
  });

  return sendSuccess(res, 201, {
    grammarRuleId: createdGrammarRule.id,
  });
}

function listGrammarRules(req, res) {
  const category = req.query.category ? String(req.query.category).trim() : undefined;

  return sendSuccess(res, 200, getAllGrammarRules(category));
}

function getGrammarRule(req, res) {
  const validatedId = validateStringIdParam(req.params.id, 'id');

  if (!validatedId.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      validatedId.message,
      validatedId.details
    );
  }

  const grammarRule = getGrammarRuleById(validatedId.value);

  if (!grammarRule) {
    return sendError(res, 404, 'GRAMMAR_RULE_NOT_FOUND', 'Grammar rule not found', {
      id: validatedId.value,
    });
  }

  return sendSuccess(res, 200, grammarRule);
}

function updateGrammarRule(req, res) {
  const validatedId = validateStringIdParam(req.params.id, 'id');
  const requiredFieldsValidation = validateRequiredFields(req.body, [
    'category',
    'usage',
    'forms',
    'spellingRules',
    'examples',
    'keywords',
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

  const updatedGrammarRule = updateGrammarRuleById(validatedId.value, {
    category: req.body.category,
    usage: req.body.usage,
    forms: req.body.forms,
    spellingRules: req.body.spellingRules,
    examples: req.body.examples,
    keywords: req.body.keywords,
  });

  if (!updatedGrammarRule) {
    return sendError(res, 404, 'GRAMMAR_RULE_NOT_FOUND', 'Grammar rule not found', {
      id: validatedId.value,
    });
  }

  return sendSuccess(res, 200, {
    grammarRuleId: updatedGrammarRule.id,
  });
}

function deleteGrammarRule(req, res) {
  const validatedId = validateStringIdParam(req.params.id, 'id');

  if (!validatedId.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      validatedId.message,
      validatedId.details
    );
  }

  const deletedGrammarRule = deleteGrammarRuleById(validatedId.value);

  if (!deletedGrammarRule) {
    return sendError(res, 404, 'GRAMMAR_RULE_NOT_FOUND', 'Grammar rule not found', {
      id: validatedId.value,
    });
  }

  return sendSuccess(res, 200, {
    grammarRuleId: deletedGrammarRule.id,
  });
}

module.exports = {
  createGrammarRuleHandler,
  listGrammarRules,
  getGrammarRule,
  updateGrammarRule,
  deleteGrammarRule,
};