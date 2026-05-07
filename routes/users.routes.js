const express = require('express');

const {
	getUser,
	listUsers,
	registerUser,
	updateUser,
} = require('../controllers/users.controller');

const router = express.Router();

router.get('/', listUsers);
router.post('/register', registerUser);
router.put('/:id', updateUser);
router.get('/:id', getUser);

module.exports = router;