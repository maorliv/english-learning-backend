const express = require('express');

const {
	getUser,
	listUsers,
	registerUser,
} = require('../controllers/users.controller');

const router = express.Router();

router.get('/', listUsers);
router.post('/register', registerUser);
router.get('/:id', getUser);

module.exports = router;