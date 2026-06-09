const teachers = require('./data/teachers.json');

/**
 * Returns all teachers, optionally filtered by availability and/or max price.
 * Returns a projected shape (not all internal fields) to avoid leaking sensitive data.
 *
 * @param {object} filters
 * @param {boolean} [filters.available]  - If provided, only return teachers with this availability
 * @param {number}  [filters.maxPrice]   - If provided, only return teachers at or below this price
 */
function getAllTeachers(filters = {}) {
  return teachers
    .filter((teacher) => {
      // Skip teachers whose availability doesn't match the filter
      if (typeof filters.available === 'boolean' && teacher.available !== filters.available) {
        return false;
      }

      // Skip teachers that are too expensive
      if (typeof filters.maxPrice === 'number' && teacher.pricePerWeek > filters.maxPrice) {
        return false;
      }

      return true;
    })
    // map() projects each teacher to only the fields needed for listing
    .map((teacher) => ({
      teacherId: teacher.teacherId,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      rank: teacher.rank,
      pricePerWeek: teacher.pricePerWeek,
      specialties: teacher.specialties,
      available: teacher.available,
      experience: teacher.experience,
      bio: teacher.bio || null,
      teachingLevels: teacher.teachingLevels || [],
      availability: teacher.availability || null,
      onlineOnly: teacher.onlineOnly ?? null,
      feedbackFrequency: teacher.feedbackFrequency || null,
    }));
}

/** Finds a teacher profile by the linked userID. Returns null if not found. */
function getTeacherByUserId(userId) {
  return teachers.find((item) => String(item.userID) === String(userId)) || null;
}

/**
 * Finds a teacher by their numeric teacherId and returns their full profile.
 * Returns null if no match is found.
 */
function getTeacherById(id) {
  const teacher = teachers.find((item) => String(item.teacherId) === String(id));

  if (!teacher) {
    return null;
  }

  return {
    teacherId: teacher.teacherId,
    userId: teacher.userID,  // The user account linked to this teacher profile
    firstName: teacher.firstName,
    lastName: teacher.lastName,
    rank: teacher.rank,
    pricePerWeek: teacher.pricePerWeek,
    specialties: teacher.specialties,
    available: teacher.available,
    experience: teacher.experience,
    bio: teacher.bio || null,
    teachingLevels: teacher.teachingLevels || [],
    availability: teacher.availability || null,
    onlineOnly: teacher.onlineOnly ?? null,
    feedbackFrequency: teacher.feedbackFrequency || null,
  };
}

/**
 * Updates editable teacher profile fields.
 * Returns the updated teacher object, or null if not found.
 */
function updateTeacherById(id, teacherData) {
  const teacher = teachers.find((item) => String(item.teacherId) === String(id));

  if (!teacher) {
    return null;
  }

  teacher.experience = teacherData.experience;
  teacher.pricePerWeek = teacherData.pricePerWeek;
  teacher.specialties = teacherData.specialties;
  teacher.available = teacherData.available;
  teacher.feedbackFrequency = teacherData.feedbackFrequency;
  teacher.bio = teacherData.bio;
  teacher.teachingLevels = teacherData.teachingLevels;
  teacher.availability = teacherData.availability;
  teacher.onlineOnly = teacherData.onlineOnly;
  teacher.updateDate = new Date().toISOString();

  return {
    teacherId: teacher.teacherId,
    userId: teacher.userID,
    firstName: teacher.firstName,
    lastName: teacher.lastName,
    rank: teacher.rank,
    pricePerWeek: teacher.pricePerWeek,
    specialties: teacher.specialties,
    available: teacher.available,
    experience: teacher.experience,
    bio: teacher.bio || null,
    teachingLevels: teacher.teachingLevels || [],
    availability: teacher.availability || null,
    onlineOnly: teacher.onlineOnly ?? null,
    feedbackFrequency: teacher.feedbackFrequency || null,
  };
}

/**
 * Creates a blank teacher profile record for a newly registered teacher.
 * All professional fields are null/empty until the teacher completes profile setup.
 * Called automatically by the registration handler.
 *
 * @param {number|string} userId      - The userID from the users table
 * @param {string}        firstName
 * @param {string}        lastName
 * @returns {object} The new teacher profile record
 */
function createTeacherProfile(userId, firstName, lastName) {
  const nextTeacherId =
    teachers.reduce((maxId, t) => Math.max(maxId, Number(t.teacherId) || 0), 0) + 1;

  const now = new Date().toISOString();

  const newTeacher = {
    teacherId: nextTeacherId,
    userID: Number(userId),
    firstName,
    lastName,
    rank: 0,
    pricePerWeek: null,
    specialties: [],
    feedbackFrequency: null,
    available: false,
    experience: null,
    onlineOnly: null,
    bio: null,
    teachingLevels: [],
    availability: null,
    createdAt: now,
    updateDate: now,
  };

  teachers.push(newTeacher);

  return newTeacher;
}

module.exports = {
  getAllTeachers,
  getTeacherById,
  getTeacherByUserId,
  updateTeacherById,
  createTeacherProfile,
};