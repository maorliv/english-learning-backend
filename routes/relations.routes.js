const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const {
	listRelations,
	listMyStudents,
	listPendingRelations,
	requestRelation,
	reviewMyTeacher,
	updateRelationStatus,
} = require('../controllers/relations.controller');

const router = express.Router();

router.get('/', authorize(['admin']), listRelations);
router.get('/my-students', authorize(['teacher']), listMyStudents);
router.post('/my-teacher/review', authorize(['student']), reviewMyTeacher);
router.get('/pending', authorize(['teacher']), listPendingRelations);
router.patch('/:id/status', authorize(['teacher']), updateRelationStatus);
router.post('/request', authorize(['student']), requestRelation);

module.exports = router;