const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const {
	deleteUser,
	getUser,
	loginUser,
	listUsers,
	registerUser,
	updateUser,
} = require('../controllers/users.controller');

const router = express.Router();

router.get('/', authorize(['admin']), listUsers);
router.post('/login', loginUser);
router.post('/register', registerUser);
router.put('/:id', authorize(['admin'], { allowSelf: true }), updateUser);
router.delete('/:id', authorize(['admin']), deleteUser);
router.get('/:id', authorize(['admin'], { allowSelf: true }), getUser);

module.exports = router;