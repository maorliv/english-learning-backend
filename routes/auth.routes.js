// Auth routes — login and logout are public (no authorization middleware required)
const express = require('express');

const { loginUser, logoutUser } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/login', loginUser);   // Public — no auth required
router.post('/logout', logoutUser); // Public — mock logout, no token to invalidate server-side

module.exports = router;
