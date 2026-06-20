const { sendSuccess } = require('../utils/response');
const { createHttpError, withErrorHandling } = require('../utils/httpError');
const { validateIdParam, validateRequiredFields } = require('../utils/validators');
const conversationsService = require('../services/conversations.service');
const lessonsService = require('../services/lessons.service');
const vocabularyService = require('../services/vocabulary.service');
const teachersService = require('../services/teachers.service');
const relationsService = require('../services/relations.service');
const { emitToUser } = require('../socket');

const ALLOWED_REPLY_ROLES = ['student', 'teacher'];
const FILTERABLE_CONVERSATION_STATUSES = ['active', 'completed'];

const listConversations = withErrorHandling(async (req, res) => {
  const filters = {};
  const userRole = req.header('x-user-role');

  if (req.query.status !== undefined) {
    const normalizedStatus = String(req.query.status).trim().toLowerCase();
    if (!FILTERABLE_CONVERSATION_STATUSES.includes(normalizedStatus)) {
      throw createHttpError(400, 'VALIDATION_ERROR', 'Invalid status filter', { status: req.query.status, allowedValues: FILTERABLE_CONVERSATION_STATUSES });
    }
    filters.status = normalizedStatus;
  }
  if (req.query.studentId !== undefined) {
    const v = validateIdParam(req.query.studentId, 'studentId');
    if (!v.isValid) throw createHttpError(400, 'VALIDATION_ERROR', v.message, v.details);
    filters.studentId = v.value;
  }
  if (req.query.lessonId !== undefined) {
    const v = validateIdParam(req.query.lessonId, 'lessonId');
    if (!v.isValid) throw createHttpError(400, 'VALIDATION_ERROR', v.message, v.details);
    filters.lessonId = v.value;
  }

  if (userRole === 'teacher') {
    const vUserId = validateIdParam(req.header('x-user-id'), 'x-user-id');
    if (!vUserId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', vUserId.message, vUserId.details);
    const teacherProfile = await teachersService.getTeacherByUserId(vUserId.value);
    if (!teacherProfile) throw createHttpError(404, 'TEACHER_NOT_FOUND', 'Teacher profile not found for this user.', { userId: vUserId.value });

    const activeStudentIds = await relationsService.getActiveStudentIdsByTeacherId(teacherProfile.teacherId);
    if (typeof filters.studentId === 'number' && !activeStudentIds.map(String).includes(String(filters.studentId))) {
      throw createHttpError(403, 'FORBIDDEN', 'You do not have permission to view conversations for this student.', { teacherId: teacherProfile.teacherId, studentId: filters.studentId });
    }
    filters.studentIds = activeStudentIds;
    return sendSuccess(res, 200, await conversationsService.getAllConversations(filters, teacherProfile.teacherId));
  }

  return sendSuccess(res, 200, await conversationsService.getAllConversations(filters));
});

const listStudentConversations = withErrorHandling(async (req, res) => {
  const vStudentId = validateIdParam(req.params.studentId, 'studentId');
  const userRole = req.header('x-user-role');
  if (!vStudentId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', vStudentId.message, vStudentId.details);

  if (userRole === 'teacher') {
    const vUserId = validateIdParam(req.header('x-user-id'), 'x-user-id');
    if (!vUserId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', vUserId.message, vUserId.details);
    const teacherProfile = await teachersService.getTeacherByUserId(vUserId.value);
    if (!teacherProfile) throw createHttpError(404, 'TEACHER_NOT_FOUND', 'Teacher profile not found for this user.', { userId: vUserId.value });
    const activeStudentIds = await relationsService.getActiveStudentIdsByTeacherId(teacherProfile.teacherId);
    if (!activeStudentIds.map(String).includes(String(vStudentId.value))) {
      throw createHttpError(403, 'FORBIDDEN', 'You do not have permission to view conversations for this student.', { teacherId: teacherProfile.teacherId, studentId: vStudentId.value });
    }
  }

  const conversations = await conversationsService.getConversationSummaries({ studentId: vStudentId.value });
  const result = conversations.map(c => {
    const enrichedReviews = (c.reviews || []).map(r => ({
      teacherId: r.teacherId,
      userId: r.teacher?.userID || null,
      teacherName: r.teacher?.user ? `${r.teacher.user.firstName} ${r.teacher.user.lastName}` : null,
      teacherScore: r.teacherScore,
      reviewedAt: r.reviewedAt,
    }));
    return {
      conversationId: c.conversationId,
      lessonId: c.lessonId,
      lessonTitle: c.lesson?.title || null,
      status: c.status,
      aiScore: c.aiScore,
      teacherReviews: enrichedReviews,
      isReviewedByTeacher: enrichedReviews.length > 0,
      createdAt: c.createdAt,
    };
  });

  return sendSuccess(res, 200, result);
});

const startConversation = withErrorHandling(async (req, res) => {
  const vStudentId = validateIdParam(req.header('x-user-id'), 'x-user-id');
  const reqValidation = validateRequiredFields(req.body, ['lessonId']);
  if (!vStudentId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', vStudentId.message, vStudentId.details);
  if (!reqValidation.isValid) throw createHttpError(400, 'VALIDATION_ERROR', reqValidation.message, reqValidation.details);

  const vLessonId = validateIdParam(req.body.lessonId, 'lessonId');
  if (!vLessonId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', vLessonId.message, vLessonId.details);

  const lesson = await lessonsService.getLessonById(vLessonId.value);
  if (!lesson) throw createHttpError(404, 'LESSON_NOT_FOUND', 'Lesson not found', { lessonId: vLessonId.value });

  const lessonVocabulary = await vocabularyService.getVocabularyByLessonId(vLessonId.value);
  const unusedVocab = lessonVocabulary.map(item => item.word);
  const conversation = await conversationsService.createConversation(vStudentId.value, vLessonId.value, unusedVocab);

  return sendSuccess(res, 201, {
    conversationId: conversation.conversationId,
    messages: conversation.messages,
    unusedVocab: conversation.unusedVocab,
  });
});

const sendConversationMessage = withErrorHandling(async (req, res) => {
  const vId = validateIdParam(req.params.id, 'id');
  const reqValidation = validateRequiredFields(req.body, ['content']);
  if (!vId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', vId.message, vId.details);
  if (!reqValidation.isValid) throw createHttpError(400, 'VALIDATION_ERROR', reqValidation.message, reqValidation.details);

  const conversation = await conversationsService.getConversationById(vId.value);
  if (!conversation) throw createHttpError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found', { conversationId: vId.value });

  const result = await conversationsService.addMessageToConversation(vId.value, req.body.content);
  return sendSuccess(res, 200, result);
});

const finishConversation = withErrorHandling(async (req, res) => {
  const vId = validateIdParam(req.params.id, 'id');
  if (!vId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', vId.message, vId.details);

  const conversation = await conversationsService.getConversationById(vId.value);
  if (!conversation) throw createHttpError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found', { conversationId: vId.value });

  const result = await conversationsService.endConversation(vId.value);

  // Notify all teachers connected to this student via active relations
  const usersService = require('../services/users.service');
  const student = await usersService.getUserById(conversation.studentId);
  const studentName = student ? `${student.firstName} ${student.lastName}` : 'A student';
  const teacherRelations = await relationsService.getRelationsByStudentId(conversation.studentId);
  for (const rel of teacherRelations) {
    const teacher = await teachersService.getTeacherById(rel.teacherId);
    if (teacher?.userId) {
      emitToUser(teacher.userId, 'conversation:completed', { conversationId: vId.value, studentName, aiScore: result.aiScore });
    }
  }

  return sendSuccess(res, 200, result);
});

const getConversation = withErrorHandling(async (req, res) => {
  const vId = validateIdParam(req.params.id, 'id');
  if (!vId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', vId.message, vId.details);

  const conversation = await conversationsService.getConversationById(vId.value);
  if (!conversation) throw createHttpError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found', { conversationId: vId.value });

  const enrichedReviews = (conversation.reviews || []).map(r => ({
    teacherId: r.teacherId,
    userId: r.teacher?.userID || null,
    teacherName: r.teacher?.user ? `${r.teacher.user.firstName} ${r.teacher.user.lastName}` : null,
    teacherScore: r.teacherScore,
    teacherComment: r.teacherComment,
    reviewedAt: r.reviewedAt,
  }));

  return sendSuccess(res, 200, {
    conversationId: conversation.conversationId,
    messages: conversation.messages,
    aiScore: conversation.aiScore,
    teacherReviews: enrichedReviews,
    status: conversation.status,
    replies: conversation.replies || [],
  });
});

const commentOnConversation = withErrorHandling(async (req, res) => {
  const vId = validateIdParam(req.params.id, 'id');
  const reqValidation = validateRequiredFields(req.body, ['teacherScore', 'teacherComment']);
  if (!vId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', vId.message, vId.details);
  if (!reqValidation.isValid) throw createHttpError(400, 'VALIDATION_ERROR', reqValidation.message, reqValidation.details);

  const conversation = await conversationsService.getConversationById(vId.value);
  if (!conversation) throw createHttpError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found', { conversationId: vId.value });

  const vTeacherUserId = validateIdParam(req.header('x-user-id'), 'x-user-id');
  if (!vTeacherUserId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', vTeacherUserId.message, vTeacherUserId.details);

  const teacher = await teachersService.getTeacherByUserId(vTeacherUserId.value);
  if (!teacher) throw createHttpError(404, 'TEACHER_NOT_FOUND', 'Teacher profile not found for this user.', { userId: vTeacherUserId.value });

  const result = await conversationsService.addTeacherComment(vId.value, teacher.teacherId, req.body.teacherScore, req.body.teacherComment);

  // Notify the student that a teacher reviewed their conversation
  const lesson = await lessonsService.getLessonById(conversation.lessonId);
  emitToUser(conversation.studentId, 'conversation:reviewed', {
    conversationId: Number(vId.value),
    teacherName: `${teacher.firstName} ${teacher.lastName}`,
    lessonTitle: lesson?.title || 'a lesson',
    teacherScore: req.body.teacherScore,
  });

  return sendSuccess(res, 200, result);
});

const replyToConversation = withErrorHandling(async (req, res) => {
  const vId = validateIdParam(req.params.id, 'id');
  const reqValidation = validateRequiredFields(req.body, ['role', 'content']);
  if (!vId.isValid) throw createHttpError(400, 'VALIDATION_ERROR', vId.message, vId.details);
  if (!reqValidation.isValid) throw createHttpError(400, 'VALIDATION_ERROR', reqValidation.message, reqValidation.details);

  const normalizedRole = String(req.body.role).trim().toLowerCase();
  if (!ALLOWED_REPLY_ROLES.includes(normalizedRole)) {
    throw createHttpError(400, 'VALIDATION_ERROR', 'Invalid role value', { field: 'role', allowedValues: ALLOWED_REPLY_ROLES, receivedValue: req.body.role });
  }

  const conversation = await conversationsService.getConversationById(vId.value);
  if (!conversation) throw createHttpError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found', { conversationId: vId.value });

  const result = await conversationsService.addConversationReply(vId.value, normalizedRole, req.body.content);

  // Notify the other party — resolve sender's name from DB for informative notifications
  const usersServiceForReply = require('../services/users.service');
  const senderUser = await usersServiceForReply.getUserById(req.header('x-user-id'));
  const senderName = senderUser ? `${senderUser.firstName} ${senderUser.lastName}` : (normalizedRole === 'teacher' ? 'Your teacher' : 'A student');
  if (normalizedRole === 'student') {
    const reviews = conversation.reviews || [];
    reviews.forEach(r => {
      if (r.teacher?.userID) emitToUser(r.teacher.userID, 'conversation:new-reply', { conversationId: vId.value, from: 'student', senderName, message: req.body.content });
    });
  } else {
    emitToUser(conversation.studentId, 'conversation:new-reply', { conversationId: vId.value, from: 'teacher', senderName, message: req.body.content });
  }

  return sendSuccess(res, 200, result);
});

module.exports = { commentOnConversation, finishConversation, getConversation, listStudentConversations, listConversations, replyToConversation, sendConversationMessage, startConversation };
