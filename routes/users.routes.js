// User auth + CRUD routes
// PUT and GET /:id use allowSelf so users can access their own record in addition to admins
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
router.post('/login', loginUser);           // Public — no auth required
router.post('/register', registerUser);     // Public — no auth required
router.put('/:id', authorize(['admin'], { allowSelf: true }), updateUser);
router.delete('/:id', authorize(['admin']), deleteUser);
router.get('/:id', authorize(['admin'], { allowSelf: true }), getUser);

module.exports = router;