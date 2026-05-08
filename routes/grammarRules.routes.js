const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const {
	createGrammarRuleHandler,
	getGrammarRule,
	listGrammarRules,
} = require('../controllers/grammarRules.controller');

const router = express.Router();

router.get('/', authorize(['student', 'admin']), listGrammarRules);
router.post('/', authorize(['admin']), createGrammarRuleHandler);
router.get('/:id', authorize(['student', 'admin']), getGrammarRule);

module.exports = router;