const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const {
	listMyStudents,
	listPendingRelations,
	requestRelation,
	updateRelationStatus,
} = require('../controllers/relations.controller');

const router = express.Router();

router.get('/my-students', authorize(['teacher']), listMyStudents);
router.get('/pending', authorize(['teacher']), listPendingRelations);
router.patch('/:id/status', authorize(['teacher']), updateRelationStatus);
router.post('/request', authorize(['student']), requestRelation);

module.exports = router;