// Student progress routes
// /chart, /next-lesson, /stats — student reads their own data
// /:studentId — teacher or admin reads a specific student's progress
const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const {
	getProgressChart,
	getNextLesson,
	getProgressStats,
	getStudentProgress,
} = require('../controllers/progress.controller');

const router = express.Router();

router.get('/chart', authorize(['student']), getProgressChart);
router.get('/next-lesson', authorize(['student']), getNextLesson);
router.get('/stats', authorize(['student']), getProgressStats);
router.get('/:studentId', authorize(['teacher', 'admin']), getStudentProgress);

module.exports = router;