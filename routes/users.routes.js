const express = require('express');

const { getUser, listUsers } = require('../controllers/users.controller');

const router = express.Router();

router.get('/', listUsers);
router.get('/:id', getUser);

module.exports = router;