const grammarRules = require('./data/grammarRules.json');

function getAllGrammarRules(category) {
  return grammarRules.filter((rule) => {
      if (!category) {
        return true;
      }

      return rule.category.toLowerCase() === category.toLowerCase();
    }).map((rule) => ({
      id: rule.id,
      category: rule.category,
      usage: rule.usage,
    }));
}

function getGrammarRuleById(id) {
  return grammarRules.find((rule) => rule.id === id) || null;
}

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