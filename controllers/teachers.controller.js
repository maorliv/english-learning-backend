const { sendError, sendSuccess } = require('../utils/response');
const { getAllTeachers } = require('../models/teachers.model');

function listTeachers(req, res) {
  const { available, specialty, maxPrice } = req.query; ///teachers?available=true&specialty=Math&maxPrice=100
  const filters = {};

  if (available !== undefined) {
    if (available !== 'true' && available !== 'false') {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid available filter', {
        available,
        expected: ['true', 'false'],
      });
    }

    filters.available = available === 'true';
  }

  if (specialty !== undefined) {
    filters.specialty = String(specialty).trim();
  }

  if (maxPrice !== undefined) {
    const parsedMaxPrice = Number(maxPrice);

    if (Number.isNaN(parsedMaxPrice)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid maxPrice filter', {
        maxPrice,
        expected: 'number',
      });
    }

    filters.maxPrice = parsedMaxPrice;
  }

  return sendSuccess(res, 200, getAllTeachers(filters));
}

module.exports = {
  listTeachers,
};