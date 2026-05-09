const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const {
	finishConversation,
	getConversation,
	sendConversationMessage,
	startConversation,
} = require('../controllers/conversations.controller');

const router = express.Router();

router.get('/:id', authorize(['student', 'teacher', 'admin']), getConversation);
router.post('/:id/end', authorize(['student']), finishConversation);
router.post('/:id/message', authorize(['student']), sendConversationMessage);
router.post('/start', authorize(['student']), startConversation);

module.exports = router;