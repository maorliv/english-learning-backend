const teachers = require('./data/teachers.json');

function getAllTeachers(filters = {}) {
  return teachers
    .filter((teacher) => {
      if (typeof filters.available === 'boolean' && teacher.available !== filters.available) {
        return false;
      }

      if (
        filters.specialty &&
        !teacher.specialties.some((specialty) =>
          specialty.toLowerCase().includes(filters.specialty.toLowerCase())
        )
      ) {
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

module.exports = {
  getAllTeachers,
};