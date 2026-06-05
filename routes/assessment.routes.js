// Assessment routes — student-only
// POST /start        — begins a new diagnostic session for the logged-in student
// POST /:id/message  — student sends a message and receives an AI follow-up prompt
// POST /:id/end      — ends the session, detects level, and updates the student's profile
const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const {
  startAssessment,
  sendAssessmentMessage,
  endAssessmentHandler,
} = require('../controllers/assessment.controller');

const router = express.Router();

router.post('/start', authorize(['student']), startAssessment);
router.post('/:id/message', authorize(['student']), sendAssessmentMessage);
router.post('/:id/end', authorize(['student']), endAssessmentHandler);

module.exports = router;
