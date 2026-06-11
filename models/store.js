'use strict';
const fs = require('fs');
const path = require('path');

function load(filename) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', filename), 'utf8'));
}

// All collections are loaded once when the server starts.
// Runtime mutations (push, property assignment) operate only on these in-memory copies.
// The original JSON files under data/ are NEVER modified at runtime.
// Restarting the server resets all data back to the files on disk.
module.exports = {
  users: load('users.json'),
  teachers: load('teachers.json'),
  lessons: load('lessons.json'),
  conversations: load('conversations.json'),
  relations: load('relations.json'),
  progress: load('progress.json'),
  settings: load('settings.json'),
  grammarRules: load('grammarRules.json'),
  vocabulary: load('vocabulary.json'),
  warmUpGrammar: load('warmUpGrammar.json'),
  assessments: load('assessments.json'),
  studentPreferences: load('studentPreferences.json'),
};
