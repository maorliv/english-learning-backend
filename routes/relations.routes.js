// Teacher-student relation routes
// Uses PATCH (not PUT) for status updates since only the status field is being changed
const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const {
	listRelations,
	listMyRelations,
	listMyStudents,
	listMyTeachers,
	listPendingRelations,
	requestRelation,
	removeRelation,
	reviewMyTeacher,
	updateRelationStatus,
} = require('../controllers/relations.controller');

const router = express.Router();

router.get('/', authorize(['admin']), listRelations);
router.get('/my-relations', authorize(['student']), listMyRelations);
router.get('/my-students', authorize(['teacher']), listMyStudents);
router.get('/my-teachers', authorize(['student']), listMyTeachers);
router.post('/my-teacher/review', authorize(['student']), reviewMyTeacher);
router.get('/pending', authorize(['teacher']), listPendingRelations);
router.patch('/:id/status', authorize(['teacher']), updateRelationStatus); // PATCH — partial update (status only)
router.delete('/:id', authorize(['student']), removeRelation);
router.post('/request', authorize(['student']), requestRelation);

module.exports = router;