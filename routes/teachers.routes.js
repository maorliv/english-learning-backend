const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const teachersService = require('../services/teachers.service');
const {
	getMyProfile,
	getMyReviews,
	getTeacher,
	listTeachers,
	updateTeacher,
} = require('../controllers/teachers.controller');

const router = express.Router();

router.get('/', authorize(['student', 'admin']), listTeachers);
router.get('/me', authorize(['teacher']), getMyProfile);
router.get('/my-reviews', authorize(['teacher']), getMyReviews);
router.put(
	'/:id',
	authorize(['admin','teacher'], {
		allowSelf: true,
		getOwnerId: async (req) => {
			const teacher = await teachersService.getTeacherById(req.params.id);
			return teacher?.userId;
		},
	}),
	updateTeacher
);
router.get(
	'/:id',
	authorize(['student', 'admin'], {
		allowSelf: true,
		getOwnerId: async (req) => {
			const teacher = await teachersService.getTeacherById(req.params.id);
			return teacher?.userId;
		},
	}),
	getTeacher
);

module.exports = router;
