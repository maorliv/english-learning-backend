const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const { getProgressChart, getProgressStats } = require('../controllers/progress.controller');

const router = express.Router();

router.get('/chart', authorize(['student']), getProgressChart);
router.get('/stats', authorize(['student']), getProgressStats);

module.exports = router;