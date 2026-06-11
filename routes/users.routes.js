// User auth + CRUD routes
// PUT and GET /:id use allowSelf so users can access their own record in addition to admins
const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const {
	deleteUser,
	getMe,
	getUser,
	listUsers,
	registerUser,
	updateUser,
} = require('../controllers/users.controller');

const router = express.Router();

router.get('/', authorize(['admin']), listUsers);
router.get('/me', authorize(['admin', 'student', 'teacher']), getMe); // Must be before /:id
router.post('/register', registerUser);     // Public — no auth required
router.put('/:id', authorize(['admin'], { allowSelf: true }), updateUser);
router.delete('/:id', authorize(['admin'], { allowSelf: true }), deleteUser);
router.get('/:id', authorize(['admin','student','teacher'], { allowSelf: true }), getUser);

module.exports = router;