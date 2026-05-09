const { getLessonById } = require('../models/lessons.model');
const { getVocabularyByLessonId } = require('../models/vocabulary.model');
const {
  addConversationReply,
  addTeacherComment,
  addMessageToConversation,
  createConversation,
  endConversation,
  getAllConversations,
  getConversationById,
} = require('../models/conversations.model');
const { sendError, sendSuccess } = require('../utils/response');
const { validateIdParam, validateRequiredFields } = require('../utils/validators');

const ALLOWED_REPLY_ROLES = ['student', 'teacher'];
const FILTERABLE_CONVERSATION_STATUSES = ['active', 'completed'];

function listConversations(req, res) {
  const filters = {};

  if (req.query.status !== undefined) {
    const normalizedStatus = String(req.query.status).trim().toLowerCase();

    if (!FILTERABLE_CONVERSATION_STATUSES.includes(normalizedStatus)) {
      return sendError(
        res,
        400,
        'VALIDATION_ERROR',
        'Invalid status filter',
        {
          status: req.query.status,
          allowedValues: FILTERABLE_CONVERSATION_STATUSES,
        }
      );
    }

    filters.status = normalizedStatus;
  }

  if (req.query.studentId !== undefined) {
    const validatedStudentId = validateIdParam(req.query.studentId, 'studentId');

    if (!validatedStudentId.isValid) {
      return sendError(
        res,
        400,
        'VALIDATION_ERROR',
        validatedStudentId.message,
        validatedStudentId.details
      );
    }

    filters.studentId = validatedStudentId.value;
  }

  if (req.query.lessonId !== undefined) {
    const validatedLessonId = validateIdParam(req.query.lessonId, 'lessonId');

    if (!validatedLessonId.isValid) {
      return sendError(
        res,
        400,
        'VALIDATION_ERROR',
        validatedLessonId.message,
        validatedLessonId.details
      );
    }

    filters.lessonId = validatedLessonId.value;
  }

  return sendSuccess(res, 200, getAllConversations(filters));
}

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

function commentOnConversation(req, res) {
  const validatedConversationId = validateIdParam(req.params.id, 'id');
  const requiredFieldsValidation = validateRequiredFields(req.body, [
    'teacherScore',
    'teacherComment',
  ]);

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

  const result = addTeacherComment(
    validatedConversationId.value,
    req.body.teacherScore,
    req.body.teacherComment
  );

  return sendSuccess(res, 200, result);
}

function replyToConversation(req, res) {
  const validatedConversationId = validateIdParam(req.params.id, 'id');
  const requiredFieldsValidation = validateRequiredFields(req.body, ['role', 'content']);

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

  const normalizedRole = String(req.body.role).trim().toLowerCase();

  if (!ALLOWED_REPLY_ROLES.includes(normalizedRole)) {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      'Invalid role value',
      {
        field: 'role',
        allowedValues: ALLOWED_REPLY_ROLES,
        receivedValue: req.body.role,
      }
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

  const result = addConversationReply(
    validatedConversationId.value,
    normalizedRole,
    req.body.content
  );

  return sendSuccess(res, 200, result);
}

module.exports = {
  commentOnConversation,
  finishConversation,
  getConversation,
  listConversations,
  replyToConversation,
  sendConversationMessage,
  startConversation,
};