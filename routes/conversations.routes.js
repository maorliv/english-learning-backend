const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const {
	commentOnConversation,
	finishConversation,
	getConversation,
	listConversations,
	replyToConversation,
	sendConversationMessage,
	startConversation,
} = require('../controllers/conversations.controller');

const router = express.Router();

router.get('/', authorize(['admin', 'teacher']), listConversations);
router.get('/:id', authorize(['student', 'teacher', 'admin']), getConversation);
router.post('/:id/reply', authorize(['student', 'teacher']), replyToConversation);
router.post('/:id/teacher-comment', authorize(['teacher']), commentOnConversation);
router.post('/:id/end', authorize(['student']), finishConversation);
router.post('/:id/message', authorize(['student']), sendConversationMessage);
router.post('/start', authorize(['student']), startConversation);

module.exports = router;