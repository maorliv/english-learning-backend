const teachers = require('./data/teachers.json');

function getAllTeachers(filters = {}) {
  return teachers
    .filter((teacher) => {
      if (typeof filters.available === 'boolean' && teacher.available !== filters.available) {
        return false;
      }

      if (typeof filters.maxPrice === 'number' && teacher.pricePerWeek > filters.maxPrice) {
        return false;
      }

      return true;
    })
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

function getTeacherById(id) {
  const teacher = teachers.find((item) => String(item.teacherId) === String(id));

  if (!teacher) {
    return null;
  }

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