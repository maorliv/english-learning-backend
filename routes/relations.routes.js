const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const {
	listPendingRelations,
	requestRelation,
} = require('../controllers/relations.controller');

const router = express.Router();

router.get('/pending', authorize(['teacher']), listPendingRelations);
router.post('/request', authorize(['student']), requestRelation);

module.exports = router;