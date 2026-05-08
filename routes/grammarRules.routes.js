const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const { listGrammarRules } = require('../controllers/grammarRules.controller');

const router = express.Router();

router.get('/', authorize(['student', 'admin']), listGrammarRules);

module.exports = router;