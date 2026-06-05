const { sendSuccess } = require('../utils/response');
const { createHttpError, withErrorHandling } = require('../utils/httpError');
const { validateRequiredFields, validateStringIdParam } = require('../utils/validators');
const {
  createGrammarRule,
  deleteGrammarRuleById,
  getAllGrammarRules,
  getGrammarRuleById,
  updateGrammarRuleById,
} = require('../models/grammarRules.model');

/**
 * POST /api/grammar-rules
 * Creates a new grammar rule. The rule's ID is a string (e.g. 'present-simple'), not a number.
 * All fields are required.
 * Returns the new rule's ID on success (201 Created).
 */
const createGrammarRuleHandler = withErrorHandling((req, res) => {
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
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      requiredFieldsValidation.message,
      requiredFieldsValidation.details
    );
  }

  const createdGrammarRule = createGrammarRule({
    id: String(req.body.id).trim(), // Normalize the string ID (trim whitespace)
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
});

/**
 * GET /api/grammar-rules
 * Returns all grammar rules. Accepts an optional ?category= query string filter.
 */
const listGrammarRules = withErrorHandling((req, res) => {
  // Normalize the category from the query string if provided
  const category = req.query.category ? String(req.query.category).trim() : undefined;

  return sendSuccess(res, 200, getAllGrammarRules(category));
});

/**
 * GET /api/grammar-rules/:id
 * Returns a single grammar rule by its string ID (e.g. 'present-simple').
 * Uses validateStringIdParam because IDs here are strings, not numbers.
 */
const getGrammarRule = withErrorHandling((req, res) => {
  const validatedId = validateStringIdParam(req.params.id, 'id');

  if (!validatedId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedId.message,
      validatedId.details
    );
  }

  const grammarRule = getGrammarRuleById(validatedId.value);

  if (!grammarRule) {
    throw createHttpError(404, 'GRAMMAR_RULE_NOT_FOUND', 'Grammar rule not found', {
      id: validatedId.value,
    });
  }

  return sendSuccess(res, 200, grammarRule);
});

/**
 * PUT /api/grammar-rules/:id
 * Replaces all editable fields of the given grammar rule.
 * Note: the rule's 'id' field itself is not updatable.
 */
const updateGrammarRule = withErrorHandling((req, res) => {
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
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedId.message,
      validatedId.details
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

  const updatedGrammarRule = updateGrammarRuleById(validatedId.value, {
    category: req.body.category,
    usage: req.body.usage,
    forms: req.body.forms,
    spellingRules: req.body.spellingRules,
    examples: req.body.examples,
    keywords: req.body.keywords,
  });

  if (!updatedGrammarRule) {
    throw createHttpError(404, 'GRAMMAR_RULE_NOT_FOUND', 'Grammar rule not found', {
      id: validatedId.value,
    });
  }

  return sendSuccess(res, 200, {
    grammarRuleId: updatedGrammarRule.id,
  });
});

/** DELETE /api/grammar-rules/:id \u2014 Removes a grammar rule by its string ID. */
const deleteGrammarRule = withErrorHandling((req, res) => {
  const validatedId = validateStringIdParam(req.params.id, 'id');

  if (!validatedId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedId.message,
      validatedId.details
    );
  }

  const deletedGrammarRule = deleteGrammarRuleById(validatedId.value);

  if (!deletedGrammarRule) {
    throw createHttpError(404, 'GRAMMAR_RULE_NOT_FOUND', 'Grammar rule not found', {
      id: validatedId.value,
    });
  }

  return sendSuccess(res, 200, {
    grammarRuleId: deletedGrammarRule.id,
  });
});

module.exports = {
  createGrammarRuleHandler,
  listGrammarRules,
  getGrammarRule,
  updateGrammarRule,
  deleteGrammarRule,
};