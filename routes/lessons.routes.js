// Lesson routes including nested vocabulary sub-routes under /:id/vocab
// Vocabulary routes use :vocabId as the second dynamic segment
const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const {
	createLessonVocabularyItem,
	deleteLessonVocabularyItem,
  getLessonVocabularyItem,
  listLessonVocabulary,
	updateLessonVocabularyItem,
} = require('../controllers/vocabulary.controller');
const {
	createLessonHandler,
	deleteLesson,
	getLesson,
	getLessonGrammar,
	getLessonGrammarWarmUp,
	getLessonVocabularyWarmUp,
	listLessons,
	updateLesson,
} = require('../controllers/lessons.controller');

const router = express.Router();

router.get('/', authorize(['student', 'admin']), listLessons);
router.post('/', authorize(['admin']), createLessonHandler);
router.get('/:id/grammar', authorize(['student', 'admin']), getLessonGrammar);
router.get('/:id/grammar-warmup', authorize(['student']), getLessonGrammarWarmUp);       // Student warm-up only
router.get('/:id/vocab-warmup', authorize(['student', 'admin']), getLessonVocabularyWarmUp);
router.post('/:id/vocab', authorize(['admin']), createLessonVocabularyItem);
router.get('/:id/vocab/:vocabId', authorize(['student', 'admin']), getLessonVocabularyItem);
router.get('/:id/vocab', authorize(['student', 'admin']), listLessonVocabulary);
router.put('/:id/vocab/:vocabId', authorize(['admin']), updateLessonVocabularyItem);
router.delete('/:id/vocab/:vocabId', authorize(['admin']), deleteLessonVocabularyItem);
router.put('/:id', authorize(['admin']), updateLesson);
router.delete('/:id', authorize(['admin']), deleteLesson);
router.get('/:id', authorize(['student', 'admin']), getLesson);

module.exports = router;