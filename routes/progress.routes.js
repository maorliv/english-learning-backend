const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const {
	getProgressChart,
	getNextLesson,
	getProgressSkills,
	getProgressStats,
	getStudentProgress,
} = require('../controllers/progress.controller');

const router = express.Router();

router.get('/chart', authorize(['student']), getProgressChart);
router.get('/next-lesson', authorize(['student']), getNextLesson);
router.get('/skills', authorize(['student']), getProgressSkills);
router.get('/stats', authorize(['student']), getProgressStats);
router.get('/:studentId', authorize(['teacher', 'admin']), getStudentProgress);

module.exports = router;