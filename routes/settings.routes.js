// Settings routes — all endpoints require a logged-in user (any role)
const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const { getSettings, updateSettings } = require('../controllers/settings.controller');

const router = express.Router();

router.get('/', authorize(['admin', 'student', 'teacher']), getSettings);
router.put('/', authorize(['admin', 'student', 'teacher']), updateSettings);

module.exports = router;
