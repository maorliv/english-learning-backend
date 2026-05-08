const { sendSuccess } = require('../utils/response');
const { getAllGrammarRules } = require('../models/grammarRules.model');

function listGrammarRules(req, res) {
  const category = req.query.category ? String(req.query.category).trim() : undefined;

  return sendSuccess(res, 200, getAllGrammarRules(category));
}

module.exports = {
  listGrammarRules,
};