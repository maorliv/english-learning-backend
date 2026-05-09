const grammarRules = require('./data/grammarRules.json');

/**
 * Returns all grammar rules, optionally filtered by category.
 * The returned shape is a summary (id + category + usage) — full details require getGrammarRuleById.
 *
 * @param {string} [category] - Optional category filter (case-insensitive)
 */
function getAllGrammarRules(category) {
  return grammarRules.filter((rule) => {
      if (!category) {
        return true; // No filter — include all rules
      }

      return rule.category.toLowerCase() === category.toLowerCase();
    }).map((rule) => ({
      id: rule.id,
      category: rule.category,
      usage: rule.usage,
    }));
}

/**
 * Finds a grammar rule by its string ID (e.g. 'present-simple').
 * Returns the full rule object including forms, examples, and keywords.
 * Returns null if not found.
 */
function getGrammarRuleById(id) {
  return grammarRules.find((rule) => rule.id === id) || null;
}

/**
 * Creates a new grammar rule and appends it to the in-memory array.
 * Note: the ID is a string, not a number, and is supplied by the caller.
 */
function createGrammarRule(ruleData) {
  const newGrammarRule = {
    id: ruleData.id,
    category: ruleData.category,
    usage: ruleData.usage,
    forms: ruleData.forms,
    spellingRules: ruleData.spellingRules,
    examples: ruleData.examples,
    keywords: ruleData.keywords,
  };

  grammarRules.push(newGrammarRule);

  return newGrammarRule;
}

/**
 * Updates the editable fields of a grammar rule identified by string ID.
 * Returns the updated rule, or null if not found.
 */
function updateGrammarRuleById(id, ruleData) {
  const grammarRule = getGrammarRuleById(id);

  if (!grammarRule) {
    return null;
  }

  grammarRule.category = ruleData.category;
  grammarRule.usage = ruleData.usage;
  grammarRule.forms = ruleData.forms;
  grammarRule.spellingRules = ruleData.spellingRules;
  grammarRule.examples = ruleData.examples;
  grammarRule.keywords = ruleData.keywords;

  return grammarRule;
}

/**
 * Removes a grammar rule by its string ID.
 * Returns the deleted rule, or null if not found.
 */
function deleteGrammarRuleById(id) {
  const grammarRuleIndex = grammarRules.findIndex((rule) => rule.id === id);

  if (grammarRuleIndex === -1) {
    return null;
  }

  const [deletedGrammarRule] = grammarRules.splice(grammarRuleIndex, 1);

  return deletedGrammarRule;
}

module.exports = {
  getAllGrammarRules,
  getGrammarRuleById,
  createGrammarRule,
  updateGrammarRuleById,
  deleteGrammarRuleById,
};