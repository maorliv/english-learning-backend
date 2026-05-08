const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const {
	createLessonHandler,
	deleteLesson,
	getLesson,
	listLessons,
	updateLesson,
} = require('../controllers/lessons.controller');

const router = express.Router();

router.get('/', authorize(['student', 'admin']), listLessons);
router.post('/', authorize(['admin']), createLessonHandler);
router.put('/:id', authorize(['admin']), updateLesson);
router.delete('/:id', authorize(['admin']), deleteLesson);
router.get('/:id', authorize(['student', 'admin']), getLesson);

module.exports = router;