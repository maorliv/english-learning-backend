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

module.exports = {
  getAllGrammarRules,
  getGrammarRuleById,
  createGrammarRule,
};