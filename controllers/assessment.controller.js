const { sendSuccess } = require('../utils/response');
const { createHttpError, withErrorHandling } = require('../utils/httpError');
const { validateIdParam, validateRequiredFields } = require('../utils/validators');
const assessmentService = require('../services/assessment.service');
const progressService = require('../services/progress.service');

const startAssessment = withErrorHandling(async (req, res) => {
  const vId = validateIdParam(req.header('x-user-id'), 'x-user-id');
  if (!vId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', vId.message, vId.details);

  const assessment = await assessmentService.createAssessment(vId.value);
  return sendSuccess(res, 201, { assessmentId: assessment.assessmentId, status: assessment.status, messages: assessment.messages });
});

const sendAssessmentMessage = withErrorHandling(async (req, res) => {
  const vId = validateIdParam(req.params.id, 'id');
  const reqValidation = validateRequiredFields(req.body, ['content']);
  if (!vId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', vId.message, vId.details);
  if (!reqValidation.isValid) throw createHttpError(400, 'VALIDATION_ERROR', reqValidation.message, reqValidation.details);

  const assessment = await assessmentService.getAssessmentById(vId.value);
  if (!assessment) throw createHttpError(404, 'ASSESSMENT_NOT_FOUND', 'Assessment session not found', { assessmentId: vId.value });
  if (assessment.status === 'completed') throw createHttpError(400, 'ASSESSMENT_ALREADY_COMPLETED', 'This assessment has already ended', { assessmentId: vId.value });

  const result = await assessmentService.addMessageToAssessment(vId.value, req.body.content);
  return sendSuccess(res, 200, { reply: result.reply });
});

const endAssessmentHandler = withErrorHandling(async (req, res) => {
  const vId = validateIdParam(req.params.id, 'id');
  if (!vId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', vId.message, vId.details);

  const assessment = await assessmentService.getAssessmentById(vId.value);
  if (!assessment) throw createHttpError(404, 'ASSESSMENT_NOT_FOUND', 'Assessment session not found', { assessmentId: vId.value });
  if (assessment.status === 'completed') throw createHttpError(400, 'ASSESSMENT_ALREADY_COMPLETED', 'This assessment has already ended', { assessmentId: vId.value });

  const result = await assessmentService.endAssessment(vId.value);
  const updatedProgress = await progressService.updateProgressLevel(assessment.studentId, result.detectedLevel);
  if (!updatedProgress) throw createHttpError(404, 'PROGRESS_NOT_FOUND', 'Progress record not found for this student.', { studentId: assessment.studentId });

  return sendSuccess(res, 200, {
    assessmentId: result.assessmentId,
    detectedLevel: result.detectedLevel,
    message: `Your English level has been assessed as ${result.detectedLevel}. Your profile has been updated.`,
  });
});

module.exports = { startAssessment, sendAssessmentMessage, endAssessmentHandler };
