const prisma = require('../prisma/client');

/** Flattens the Prisma teacher+user join into the flat shape the frontend expects. */
function flattenTeacher(teacher) {
  if (!teacher) return null;
  const { user, ...rest } = teacher;
  return {
    teacherId: rest.teacherId,
    userId: rest.userID,
    firstName: user?.firstName || null,
    lastName: user?.lastName || null,
    rank: rest.rank,
    pricePerWeek: rest.pricePerWeek,
    specialties: rest.specialties,
    available: rest.available,
    experience: rest.experience,
    bio: rest.bio || null,
    teachingLevels: rest.teachingLevels || [],
    availability: rest.availability || null,
    onlineOnly: rest.onlineOnly ?? null,
    feedbackFrequency: rest.feedbackFrequency || null,
  };
}

// ─────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────

// include: { user: true } tells Prisma to JOIN the users table.
// The where clause replaces the old manual .filter() on the array.
async function getAllTeachers(filters = {}) {
  const where = {};

  if (typeof filters.available === 'boolean') {
    where.available = filters.available;
  }

  // Prisma's `lte` (less-than-or-equal) replaces: teacher.pricePerWeek > maxPrice
  if (typeof filters.maxPrice === 'number') {
    where.pricePerWeek = { lte: filters.maxPrice };
  }

  const teachers = await prisma.teacher.findMany({
    where,
    include: { user: true },
  });

  return teachers.map(flattenTeacher);
}

async function getTeacherById(id) {
  const teacher = await prisma.teacher.findUnique({
    where: { teacherId: Number(id) },
    include: { user: true },
  });
  return flattenTeacher(teacher);
}

// Look up a teacher by their linked user account (used for "my profile" endpoints)
async function getTeacherByUserId(userId) {
  const teacher = await prisma.teacher.findUnique({
    where: { userID: Number(userId) },
    include: { user: true },
  });
  return flattenTeacher(teacher);
}

// ─────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────

async function updateTeacherById(id, data) {
  try {
    const updated = await prisma.teacher.update({
      where: { teacherId: Number(id) },
      data: {
        experience: data.experience,
        pricePerWeek: data.pricePerWeek,
        specialties: data.specialties,
        available: data.available,
        feedbackFrequency: data.feedbackFrequency,
        bio: data.bio,
        teachingLevels: data.teachingLevels,
        availability: data.availability,
        onlineOnly: data.onlineOnly,
      },
      include: { user: true },
    });
    return flattenTeacher(updated);
  } catch (error) {
    if (error.code === 'P2025') return null;
    throw error;
  }
}

// ─────────────────────────────────────────────────────────
// REVIEWS — teacher reviews from student_teacher_relations
// ─────────────────────────────────────────────────────────

async function getReviewedRelationsByTeacherId(teacherId) {
  return prisma.studentTeacherRelation.findMany({
    where: {
      teacherId: Number(teacherId),
      rating: { not: null },
    },
  });
}

module.exports = {
  getAllTeachers,
  getTeacherById,
  getTeacherByUserId,
  updateTeacherById,
  getReviewedRelationsByTeacherId,
};
