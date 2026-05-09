const { getLessonById } = require('../models/lessons.model');
const { getVocabularyByLessonId } = require('../models/vocabulary.model');
const {
  addMessageToConversation,
  createConversation,
  endConversation,
  getConversationById,
} = require('../models/conversations.model');
const { sendError, sendSuccess } = require('../utils/response');
const { validateIdParam, validateRequiredFields } = require('../utils/validators');

function startConversation(req, res) {
  const validatedStudentId = validateIdParam(req.header('x-user-id'), 'x-user-id');
  const requiredFieldsValidation = validateRequiredFields(req.body, ['lessonId']);

  if (!validatedStudentId.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      validatedStudentId.message,
      validatedStudentId.details
    );
  }

  if (!requiredFieldsValidation.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      requiredFieldsValidation.message,
      requiredFieldsValidation.details
    );
  }

  const validatedLessonId = validateIdParam(req.body.lessonId, 'lessonId');

  if (!validatedLessonId.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      validatedLessonId.message,
      validatedLessonId.details
    );
  }

  const lesson = getLessonById(validatedLessonId.value);

  if (!lesson) {
    return sendError(
      res,
      404,
      'LESSON_NOT_FOUND',
      'Lesson not found',
      {
        lessonId: validatedLessonId.value,
      }
    );
  }

  const lessonVocabulary = getVocabularyByLessonId(validatedLessonId.value);
  const unusedVocab = lessonVocabulary.map((item) => item.word);
  const conversation = createConversation(
    validatedStudentId.value,
    validatedLessonId.value,
    unusedVocab
  );

  return sendSuccess(res, 201, {
    conversationId: conversation.conversationId,
    messages: conversation.messages,
    unusedVocab: conversation.unusedVocab,
  });
}

function sendConversationMessage(req, res) {
  const validatedConversationId = validateIdParam(req.params.id, 'id');
  const requiredFieldsValidation = validateRequiredFields(req.body, ['content']);

  if (!validatedConversationId.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      validatedConversationId.message,
      validatedConversationId.details
    );
  }

  if (!requiredFieldsValidation.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      requiredFieldsValidation.message,
      requiredFieldsValidation.details
    );
  }

  const conversation = getConversationById(validatedConversationId.value);

  if (!conversation) {
    return sendError(
      res,
      404,
      'CONVERSATION_NOT_FOUND',
      'Conversation not found',
      {
        conversationId: validatedConversationId.value,
      }
    );
  }

  const result = addMessageToConversation(validatedConversationId.value, req.body.content);

  return sendSuccess(res, 200, result);
}

function finishConversation(req, res) {
  const validatedConversationId = validateIdParam(req.params.id, 'id');

  if (!validatedConversationId.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      validatedConversationId.message,
      validatedConversationId.details
    );
  }

  const conversation = getConversationById(validatedConversationId.value);

  if (!conversation) {
    return sendError(
      res,
      404,
      'CONVERSATION_NOT_FOUND',
      'Conversation not found',
      {
        conversationId: validatedConversationId.value,
      }
    );
  }

  const result = endConversation(validatedConversationId.value);

  return sendSuccess(res, 200, result);
}

function getConversation(req, res) {
  const validatedConversationId = validateIdParam(req.params.id, 'id');

  if (!validatedConversationId.isValid) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      validatedConversationId.message,
      validatedConversationId.details
    );
  }

  const conversation = getConversationById(validatedConversationId.value);

  if (!conversation) {
    return sendError(
      res,
      404,
      'CONVERSATION_NOT_FOUND',
      'Conversation not found',
      {
        conversationId: validatedConversationId.value,
      }
    );
  }

  return sendSuccess(res, 200, {
    conversationId: conversation.conversationId,
    messages: conversation.messages,
    aiScore: conversation.aiScore,
    teacherScore: conversation.teacherScore,
    teacherComment: conversation.teacherComment,
    status: conversation.status,
  });
}

module.exports = {
  finishConversation,
  getConversation,
  sendConversationMessage,
  startConversation,
};