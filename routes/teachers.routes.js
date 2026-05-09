const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const { getTeacherById } = require('../models/teachers.model');
const {
	getMyReviews,
	getTeacher,
	listTeachers,
	updateTeacher,
} = require('../controllers/teachers.controller');

const router = express.Router();

router.get('/', authorize(['student', 'admin']), listTeachers);
router.get('/my-reviews', authorize(['teacher']), getMyReviews);
router.put(
	'/:id',
	authorize(['admin'], {
		allowSelf: true,
		getOwnerId: (req) => getTeacherById(req.params.id)?.userId,
	}),
	updateTeacher
);
router.get(
	'/:id',
	authorize(['student', 'admin'], {
		allowSelf: true,
		getOwnerId: (req) => getTeacherById(req.params.id)?.userId,
	}),
	getTeacher
);

module.exports = router;