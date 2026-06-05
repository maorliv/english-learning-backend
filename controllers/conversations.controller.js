const { getLessonById } = require('../models/lessons.model');
const { getVocabularyByLessonId } = require('../models/vocabulary.model');
const { getActiveStudentIdsByTeacherId } = require('../models/relations.model');
const {
  addConversationReply,
  addTeacherComment,
  addMessageToConversation,
  createConversation,
  endConversation,
  getAllConversations,
  getConversationById,
  getConversationSummaries,
} = require('../models/conversations.model');
const { sendSuccess } = require('../utils/response');
const { createHttpError, withErrorHandling } = require('../utils/httpError');
const { validateIdParam, validateRequiredFields } = require('../utils/validators');

// Valid roles that can post a reply in a conversation comment thread
const ALLOWED_REPLY_ROLES = ['student', 'teacher'];
// Valid values for the ?status= filter when listing conversations
const FILTERABLE_CONVERSATION_STATUSES = ['active', 'completed'];

/**
 * GET /api/conversations
 * Returns a list of conversations. Supports optional filters: ?status=, ?studentId=, ?lessonId=
 *
 * Role-based behavior:
 *   - admin: can see all conversations (filtered by query params only)
 *   - teacher: can only see conversations for their own active students;
 *              if a specific studentId filter is given, it is validated against the teacher's students
 */
const listConversations = withErrorHandling((req, res) => {
  const filters = {};
  const userRole = req.header('x-user-role'); // Used to apply teacher-specific filtering

  if (req.query.status !== undefined) {
    const normalizedStatus = String(req.query.status).trim().toLowerCase();

    if (!FILTERABLE_CONVERSATION_STATUSES.includes(normalizedStatus)) {
      throw createHttpError(
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
      throw createHttpError(
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
      throw createHttpError(
        400,
        'VALIDATION_ERROR',
        validatedLessonId.message,
        validatedLessonId.details
      );
    }

    filters.lessonId = validatedLessonId.value;
  }

  if (userRole === 'teacher') {
    const validatedTeacherId = validateIdParam(req.header('x-user-id'), 'x-user-id');

    if (!validatedTeacherId.isValid) {
      throw createHttpError(
        400,
        'VALIDATION_ERROR',
        validatedTeacherId.message,
        validatedTeacherId.details
      );
    }

    // Get the list of student IDs this teacher is actively connected to
    const activeStudentIds = getActiveStudentIdsByTeacherId(validatedTeacherId.value);

    // If the teacher is filtering by a specific student, verify that student is theirs
    if (
      typeof filters.studentId === 'number' &&
      !activeStudentIds.map(String).includes(String(filters.studentId))
    ) {
      throw createHttpError(
        403,
        'FORBIDDEN',
        'You do not have permission to view conversations for this student.',
        {
          teacherId: validatedTeacherId.value,
          studentId: filters.studentId,
        }
      );
    }

    // Restrict results to only the teacher's own students
    filters.studentIds = activeStudentIds;
  }

  return sendSuccess(res, 200, getAllConversations(filters));
});

/**
 * GET /api/students/:studentId/conversations
 * Returns conversation summaries for a specific student.
 * Teachers can only view their own students; the check is enforced here as well.
 */
const listStudentConversations = withErrorHandling((req, res) => {
  const validatedStudentId = validateIdParam(req.params.studentId, 'studentId'); // :studentId from URL
  const userRole = req.header('x-user-role');

  if (!validatedStudentId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedStudentId.message,
      validatedStudentId.details
    );
  }

  if (userRole === 'teacher') {
    const validatedTeacherId = validateIdParam(req.header('x-user-id'), 'x-user-id');

    if (!validatedTeacherId.isValid) {
      throw createHttpError(
        400,
        'VALIDATION_ERROR',
        validatedTeacherId.message,
        validatedTeacherId.details
      );
    }

    const activeStudentIds = getActiveStudentIdsByTeacherId(validatedTeacherId.value);

    // Teacher may only view conversations for their own students
    if (!activeStudentIds.map(String).includes(String(validatedStudentId.value))) {
      throw createHttpError(
        403,
        'FORBIDDEN',
        'You do not have permission to view conversations for this student.',
        {
          teacherId: validatedTeacherId.value,
          studentId: validatedStudentId.value,
        }
      );
    }
  }

  // Enrich each conversation summary with the lesson title
  const conversations = getConversationSummaries({ studentId: validatedStudentId.value }).map(
    (conversation) => ({
      conversationId: conversation.conversationId,
      lessonId: conversation.lessonId,
      lessonTitle: getLessonById(conversation.lessonId)?.title || null, // ?. handles missing lesson
      status: conversation.status,
      aiScore: conversation.aiScore,
      teacherScore: conversation.teacherScore,
      isReviewedByTeacher: conversation.isReviewedByTeacher,
      createdAt: conversation.createdAt,
    })
  );

  return sendSuccess(res, 200, conversations);
});

/**
 * POST /api/conversations/start
 * Creates a new conversation for the logged-in student on the specified lesson.
 * Initializes the unusedVocab list from the lesson's vocabulary so progress can be tracked.
 * Returns the new conversation's ID and initial state.
 */
const startConversation = withErrorHandling((req, res) => {
  const validatedStudentId = validateIdParam(req.header('x-user-id'), 'x-user-id');
  const requiredFieldsValidation = validateRequiredFields(req.body, ['lessonId']);

  if (!validatedStudentId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedStudentId.message,
      validatedStudentId.details
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

  // lessonId comes from the request body, not the URL
  const validatedLessonId = validateIdParam(req.body.lessonId, 'lessonId');

  if (!validatedLessonId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedLessonId.message,
      validatedLessonId.details
    );
  }

  const lesson = getLessonById(validatedLessonId.value);

  if (!lesson) {
    throw createHttpError(
      404,
      'LESSON_NOT_FOUND',
      'Lesson not found',
      {
        lessonId: validatedLessonId.value,
      }
    );
  }

  // Build the initial unusedVocab list from all vocabulary words in this lesson
  const lessonVocabulary = getVocabularyByLessonId(validatedLessonId.value);
  const unusedVocab = lessonVocabulary.map((item) => item.word); // Start with all words unused
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
});

/**
 * POST /api/conversations/:id/message
 * Sends a student message to an active conversation.
 * The message content is scanned for lesson vocabulary words, which are then moved
 * from unusedVocab to usedWords. A mock AI reply is appended automatically.
 */
const sendConversationMessage = withErrorHandling((req, res) => {
  const validatedConversationId = validateIdParam(req.params.id, 'id');
  const requiredFieldsValidation = validateRequiredFields(req.body, ['content']);

  if (!validatedConversationId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedConversationId.message,
      validatedConversationId.details
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

  const conversation = getConversationById(validatedConversationId.value);

  if (!conversation) {
    throw createHttpError(
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
});

/**
 * POST /api/conversations/:id/end
 * Marks a conversation as completed and calculates an AI score based on vocabulary usage.
 * Returns the final score and AI feedback.
 */
const finishConversation = withErrorHandling((req, res) => {
  const validatedConversationId = validateIdParam(req.params.id, 'id');

  if (!validatedConversationId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedConversationId.message,
      validatedConversationId.details
    );
  }

  const conversation = getConversationById(validatedConversationId.value);

  if (!conversation) {
    throw createHttpError(
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
});

/**
 * GET /api/conversations/:id
 * Returns the full details of a single conversation, including all messages,
 * scores, and teacher feedback.
 */
const getConversation = withErrorHandling((req, res) => {
  const validatedConversationId = validateIdParam(req.params.id, 'id');

  if (!validatedConversationId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedConversationId.message,
      validatedConversationId.details
    );
  }

  const conversation = getConversationById(validatedConversationId.value);

  if (!conversation) {
    throw createHttpError(
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
});

/**
 * POST /api/conversations/:id/teacher-comment
 * Lets a teacher add a score and written feedback to a completed conversation.
 * Marks the conversation as reviewed by teacher.
 */
const commentOnConversation = withErrorHandling((req, res) => {
  const validatedConversationId = validateIdParam(req.params.id, 'id');
  const requiredFieldsValidation = validateRequiredFields(req.body, [
    'teacherScore',
    'teacherComment',
  ]);

  if (!validatedConversationId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedConversationId.message,
      validatedConversationId.details
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

  const conversation = getConversationById(validatedConversationId.value);

  if (!conversation) {
    throw createHttpError(
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
});

/**
 * POST /api/conversations/:id/reply
 * Adds a reply to the conversation's comment thread (not the main message list).
 * Used for back-and-forth discussion between student and teacher after the conversation ends.
 * The 'role' field in the body must be 'student' or 'teacher'.
 */
const replyToConversation = withErrorHandling((req, res) => {
  const validatedConversationId = validateIdParam(req.params.id, 'id');
  const requiredFieldsValidation = validateRequiredFields(req.body, ['role', 'content']);

  if (!validatedConversationId.isValid) {
    throw createHttpError(
      400,
      'VALIDATION_ERROR',
      validatedConversationId.message,
      validatedConversationId.details
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

  const normalizedRole = String(req.body.role).trim().toLowerCase(); // Normalize before validation

  if (!ALLOWED_REPLY_ROLES.includes(normalizedRole)) {
    throw createHttpError(
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
    throw createHttpError(
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
});

module.exports = {
  commentOnConversation,
  finishConversation,
  getConversation,
  listStudentConversations,
  listConversations,
  replyToConversation,
  sendConversationMessage,
  startConversation,
};