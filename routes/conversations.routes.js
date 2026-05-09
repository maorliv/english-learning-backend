// Conversation routes
// /start must be declared before /:id to prevent Express matching 'start' as an ID
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
router.post('/:id/reply', authorize(['student', 'teacher']), replyToConversation);          // Comment thread reply
router.post('/:id/teacher-comment', authorize(['teacher']), commentOnConversation);         // Teacher score + comment
router.post('/:id/end', authorize(['student']), finishConversation);
router.post('/:id/message', authorize(['student']), sendConversationMessage);               // AI conversation message
router.post('/start', authorize(['student']), startConversation);                           // Must come before /:id

module.exports = router;