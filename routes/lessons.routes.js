const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const { listLessons } = require('../controllers/lessons.controller');

const router = express.Router();

router.get('/', authorize(['student', 'admin']), listLessons);

module.exports = router;