const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const { requestRelation } = require('../controllers/relations.controller');

const router = express.Router();

router.post('/request', authorize(['student']), requestRelation);

module.exports = router;