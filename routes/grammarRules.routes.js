const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const { getGrammarRule, listGrammarRules } = require('../controllers/grammarRules.controller');

const router = express.Router();

router.get('/', authorize(['student', 'admin']), listGrammarRules);
router.get('/:id', authorize(['student', 'admin']), getGrammarRule);

module.exports = router;