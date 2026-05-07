const express = require('express');

const {
	deleteUser,
	getUser,
	listUsers,
	registerUser,
	updateUser,
} = require('../controllers/users.controller');

const router = express.Router();

router.get('/', listUsers);
router.post('/register', registerUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.get('/:id', getUser);

module.exports = router;