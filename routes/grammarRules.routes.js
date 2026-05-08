const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const {
	createGrammarRuleHandler,
	deleteGrammarRule,
	getGrammarRule,
	listGrammarRules,
	updateGrammarRule,
} = require('../controllers/grammarRules.controller');

const router = express.Router();

router.get('/', authorize(['student', 'admin']), listGrammarRules);
router.post('/', authorize(['admin']), createGrammarRuleHandler);
router.put('/:id', authorize(['admin']), updateGrammarRule);
router.delete('/:id', authorize(['admin']), deleteGrammarRule);
router.get('/:id', authorize(['student', 'admin']), getGrammarRule);

module.exports = router;