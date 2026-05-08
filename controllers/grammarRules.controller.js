const { sendError, sendSuccess } = require('../utils/response');
const { validateStringIdParam } = require('../utils/validators');
const { getAllGrammarRules, getGrammarRuleById } = require('../models/grammarRules.model');

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
  listGrammarRules,
  getGrammarRule,
};