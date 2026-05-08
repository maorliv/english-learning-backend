const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const { getLesson, listLessons } = require('../controllers/lessons.controller');

const router = express.Router();

router.get('/', authorize(['student', 'admin']), listLessons);
router.get('/:id', authorize(['student', 'admin']), getLesson);

module.exports = router;