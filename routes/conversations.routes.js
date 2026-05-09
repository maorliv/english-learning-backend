const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const { startConversation } = require('../controllers/conversations.controller');

const router = express.Router();

router.post('/start', authorize(['student']), startConversation);

module.exports = router;