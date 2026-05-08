const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const {
	createLessonHandler,
	getLesson,
	listLessons,
	updateLesson,
} = require('../controllers/lessons.controller');

const router = express.Router();

router.get('/', authorize(['student', 'admin']), listLessons);
router.post('/', authorize(['admin']), createLessonHandler);
router.put('/:id', authorize(['admin']), updateLesson);
router.get('/:id', authorize(['student', 'admin']), getLesson);

module.exports = router;