const { sendSuccess } = require('../utils/response');
const { createHttpError, withErrorHandling } = require('../utils/httpError');
const { validateIdParam, validateRequiredFields } = require('../utils/validators');
const {
  createAssessment,
  getAssessmentById,
  addMessageToAssessment,
  endAssessment,
} = require('../models/assessment.model');
const { updateProgressLevel } = require('../models/progress.model');

/**
 * POST /api/assessment/start
 * Begins a new AI level assessment session for the logged-in student.
 * Reads the student's ID from the x-user-id header.
 * Returns the new assessment session including the first AI prompt message.
 */
const startAssessment = withErrorHandling((req, res) => {
  const validatedStudentId = validateIdParam(req.header('x-user-id'), 'x-user-id');

  if (!validatedStudentId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedStudentId.message,
      validatedStudentId.details
    );
  }

  const assessment = createAssessment(validatedStudentId.value);

  return sendSuccess(res, 201, {
    assessmentId: assessment.assessmentId,
    status: assessment.status,
    messages: assessment.messages,
  });
});

/**
 * POST /api/assessment/:id/message
 * Appends a student message to the assessment and returns the next AI follow-up prompt.
 * Returns 404 if the assessment does not exist.
 * Returns 400 if the assessment is already completed.
 */
const sendAssessmentMessage = withErrorHandling((req, res) => {
  const validatedId = validateIdParam(req.params.id, 'id');
  const requiredFieldsValidation = validateRequiredFields(req.body, ['content']);

  if (!validatedId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedId.message,
      validatedId.details
    );
  }

  if (!requiredFieldsValidation.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      requiredFieldsValidation.message,
      requiredFieldsValidation.details
    );
  }

  const assessment = getAssessmentById(validatedId.value);

  if (!assessment) {
    throw createHttpError(404, 'ASSESSMENT_NOT_FOUND', 'Assessment session not found', {
      assessmentId: validatedId.value,
    });
  }

  if (assessment.status === 'completed') {
    throw createHttpError(400, 'ASSESSMENT_ALREADY_COMPLETED', 'This assessment has already ended', {
      assessmentId: validatedId.value,
    });
  }

  const result = addMessageToAssessment(validatedId.value, req.body.content);

  return sendSuccess(res, 200, {
    reply: result.reply,
  });
});

/**
 * POST /api/assessment/:id/end
 * Ends the assessment, classifies the student's English level from their messages,
 * and writes the detected level to their progress record.
 * Returns 404 if the assessment does not exist.
 * Returns 400 if the assessment is already completed.
 * Returns 404 if the student has no progress record to update.
 */
const endAssessmentHandler = withErrorHandling((req, res) => {
  const validatedId = validateIdParam(req.params.id, 'id');

  if (!validatedId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedId.message,
      validatedId.details
    );
  }

  const assessment = getAssessmentById(validatedId.value);

  if (!assessment) {
    throw createHttpError(404, 'ASSESSMENT_NOT_FOUND', 'Assessment session not found', {
      assessmentId: validatedId.value,
    });
  }

  if (assessment.status === 'completed') {
    throw createHttpError(400, 'ASSESSMENT_ALREADY_COMPLETED', 'This assessment has already ended', {
      assessmentId: validatedId.value,
    });
  }

  const result = endAssessment(validatedId.value);

  // Write the detected level back to the student's progress record
  const updatedProgress = updateProgressLevel(assessment.studentId, result.detectedLevel);

  if (!updatedProgress) {
    throw createHttpError(
      404,
      'PROGRESS_NOT_FOUND',
      'Progress record not found for this student. Level was detected but could not be saved.',
      { studentId: assessment.studentId }
    );
  }

  return sendSuccess(res, 200, {
    assessmentId: result.assessmentId,
    detectedLevel: result.detectedLevel,
    message: `Your English level has been assessed as ${result.detectedLevel}. Your profile has been updated.`,
  });
});

module.exports = {
  startAssessment,
  sendAssessmentMessage,
  endAssessmentHandler,
};
