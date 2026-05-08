const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const { listTeachers } = require('../controllers/teachers.controller');

const router = express.Router();

router.get('/', authorize(['student', 'admin']), listTeachers);

module.exports = router;