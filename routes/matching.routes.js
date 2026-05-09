const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const {
	getMatchingRecommendations,
	saveMatchingPreferences,
} = require('../controllers/matching.controller');

const router = express.Router();

router.post('/preferences', authorize(['student']), saveMatchingPreferences);
router.get('/recommendations', authorize(['student']), getMatchingRecommendations);

module.exports = router;