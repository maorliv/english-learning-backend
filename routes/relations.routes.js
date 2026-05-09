const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const {
	listPendingRelations,
	requestRelation,
	updateRelationStatus,
} = require('../controllers/relations.controller');

const router = express.Router();

router.get('/pending', authorize(['teacher']), listPendingRelations);
router.patch('/:id/status', authorize(['teacher']), updateRelationStatus);
router.post('/request', authorize(['student']), requestRelation);

module.exports = router;