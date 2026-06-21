const prisma = require('../prisma/client');

// ─────────────────────────────────────────────────────────
// READ operations
// ─────────────────────────────────────────────────────────

// findMany() — returns all rows from the users table as an array.
// This replaces: store.users (returning the whole in-memory array)
async function getAllUsers() {
  return prisma.user.findMany();
}

// findUnique() — looks up one row by its primary key.
// Returns the user object, or null if not found.
// This replaces: users.find(u => String(u.userID) === String(id))
async function getUserById(id) {
  return prisma.user.findUnique({
    where: { userID: Number(id) },
  });
}

// findUnique on a @unique field — email has a unique constraint in the schema,
// so we can use findUnique (not findFirst) which is faster.
// This replaces: users.find(u => u.email.toLowerCase() === email.toLowerCase())
async function getUserByEmail(email) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
}

// ─────────────────────────────────────────────────────────
// CREATE — register a new user + related records atomically
// ─────────────────────────────────────────────────────────

/** Atomically creates a user + settings + role-specific records (progress/preferences for students, profile for teachers). */
async function registerUser({ firstName, lastName, email, password, userRole, sex, learning_goal, mainGoal, onlineOnly }) {
  return prisma.$transaction(async (tx) => {
    // tx is a "transaction client" — use it instead of prisma for all operations
    // inside this block to ensure they all run in the same transaction.
    const newUser = await tx.user.create({
      data: {
        firstName,
        lastName,
        email: email.toLowerCase(),
        password,
        role: userRole,
        sex: sex || '',
      },
    });

    // Every user gets a settings record
    await tx.settings.create({
      data: {
        userId: newUser.userID,
        displayName: `${firstName} ${lastName}`,
        email: email.toLowerCase(),
      },
    });

    // Students get a progress record + preferences record
    if (userRole === 'student') {
      await tx.progress.create({
        data: { studentId: newUser.userID },
      });
      await tx.studentPreferences.create({
        data: {
          userId: newUser.userID,
          learning_goal: learning_goal || '',
          onboarding_text: '',
          budget_max: 100,
          mainGoal: mainGoal || null,
          onlineOnly: onlineOnly || false,
        },
      });
    }

    // Teachers get a teacher profile
    if (userRole === 'teacher') {
      await tx.teacher.create({
        data: { userID: newUser.userID },
      });
    }

    return newUser;
  });
}

// ─────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────

// update() — finds a row by PK and updates the specified fields.
// If the row doesn't exist, Prisma throws a P2025 error.
// We catch it and return null to keep the same contract the controller expects.
async function updateUserById(id, { firstName, lastName, userRole }) {
  try {
    return await prisma.user.update({
      where: { userID: Number(id) },
      data: {
        firstName,
        lastName,
        role: userRole,
      },
    });
  } catch (error) {
    if (error.code === 'P2025') return null;
    throw error;
  }
}

// ─────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────

/** Cascades deletion of all related records (settings, progress, conversations, assessments, etc.) in a transaction. */
async function deleteUserById(id) {
  const numericId = Number(id);
  const user = await prisma.user.findUnique({ where: { userID: numericId } });
  if (!user) return null;

  return prisma.$transaction(async (tx) => {
    await tx.settings.deleteMany({ where: { userId: numericId } });
    await tx.progress.deleteMany({ where: { studentId: numericId } });
    await tx.studentPreferences.deleteMany({ where: { userId: numericId } });
    await tx.teacher.deleteMany({ where: { userID: numericId } });
    await tx.studentTeacherRelation.deleteMany({ where: { studentId: numericId } });
    await tx.studentCompletedLesson.deleteMany({ where: { studentId: numericId } });
    await tx.conversationMessage.deleteMany({
      where: { conversation: { studentId: numericId } },
    });
    await tx.teacherReview.deleteMany({
      where: { conversation: { studentId: numericId } },
    });
    await tx.conversationReply.deleteMany({
      where: { conversation: { studentId: numericId } },
    });
    await tx.conversation.deleteMany({ where: { studentId: numericId } });
    await tx.assessmentMessage.deleteMany({
      where: { assessment: { studentId: numericId } },
    });
    await tx.assessment.deleteMany({ where: { studentId: numericId } });

    return tx.user.delete({ where: { userID: numericId } });
  });
}

module.exports = {
  getAllUsers,
  getUserById,
  getUserByEmail,
  registerUser,
  updateUserById,
  deleteUserById,
};
