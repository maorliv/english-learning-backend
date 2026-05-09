const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const { listStudentConversations } = require('../controllers/conversations.controller');

const router = express.Router();

router.get('/:studentId/conversations', authorize(['teacher', 'admin']), listStudentConversations);

module.exports = router;