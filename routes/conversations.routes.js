const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const {
	finishConversation,
	sendConversationMessage,
	startConversation,
} = require('../controllers/conversations.controller');

const router = express.Router();

router.post('/:id/end', authorize(['student']), finishConversation);
router.post('/:id/message', authorize(['student']), sendConversationMessage);
router.post('/start', authorize(['student']), startConversation);

module.exports = router;