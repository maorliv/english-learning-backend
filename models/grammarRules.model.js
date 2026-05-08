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

module.exports = {
  getAllGrammarRules,
};