const { sendSuccess } = require('../utils/response');
const { getAllLessons } = require('../models/lessons.model');

function listLessons(req, res) {
  const level = req.query.level ? String(req.query.level).trim() : undefined;

  return sendSuccess(res, 200, getAllLessons(level));
}

module.exports = {
  listLessons,
};