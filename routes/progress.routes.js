const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const { getProgressStats } = require('../controllers/progress.controller');

const router = express.Router();

router.get('/stats', authorize(['student']), getProgressStats);

module.exports = router;