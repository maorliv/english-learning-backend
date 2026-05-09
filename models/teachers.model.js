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
    }));
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
    feedback: teacher.feedback,
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
  teacher.feedback = teacherData.feedback;
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
    feedback: teacher.feedback,
  };
}

module.exports = {
  getAllTeachers,
  getTeacherById,
  updateTeacherById,
};