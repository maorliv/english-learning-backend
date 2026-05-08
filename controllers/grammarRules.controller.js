const { sendError, sendSuccess } = require('../utils/response');
const { validateRequiredFields, validateStringIdParam } = require('../utils/validators');
const {
  createGrammarRule,
  getAllGrammarRules,
  getGrammarRuleById,
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

module.exports = {
  createGrammarRuleHandler,
  listGrammarRules,
  getGrammarRule,
};