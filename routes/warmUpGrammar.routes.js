// Warm-up grammar exercise CRUD — admin-only access for all routes
const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const {
  createWarmUpGrammarHandler,
  deleteWarmUpGrammar,
  getWarmUpGrammar,
  listWarmUpGrammar,
  updateWarmUpGrammar,
} = require('../controllers/warmUpGrammar.controller');

const router = express.Router();

router.get('/', authorize(['admin']), listWarmUpGrammar);
router.get('/:id', authorize(['admin']), getWarmUpGrammar);
router.post('/', authorize(['admin']), createWarmUpGrammarHandler);
router.put('/:id', authorize(['admin']), updateWarmUpGrammar);
router.delete('/:id', authorize(['admin']), deleteWarmUpGrammar);

module.exports = router;