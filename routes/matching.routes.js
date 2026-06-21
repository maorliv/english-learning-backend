// Teacher matching routes — student-only access
const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const {
	getMatchingPreferences,
	getMatchingRecommendations,
	saveMatchingPreferences,
} = require('../controllers/matching.controller');

const router = express.Router();

router.get('/preferences', authorize(['student']), getMatchingPreferences);
router.post('/preferences', authorize(['student']), saveMatchingPreferences);
router.get('/recommendations', authorize(['student']), getMatchingRecommendations);

module.exports = router;