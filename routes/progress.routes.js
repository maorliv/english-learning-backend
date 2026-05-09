const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const {
	getProgressChart,
	getProgressSkills,
	getProgressStats,
} = require('../controllers/progress.controller');

const router = express.Router();

router.get('/chart', authorize(['student']), getProgressChart);
router.get('/skills', authorize(['student']), getProgressSkills);
router.get('/stats', authorize(['student']), getProgressStats);

module.exports = router;