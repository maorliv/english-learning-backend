const express = require('express');

const authorize = require('../middleware/authorize.middleware');
const {
	createLessonHandler,
	createLessonVocabularyItem,
	deleteLesson,
	deleteLessonVocabularyItem,
	getLesson,
	getLessonGrammar,
	getLessonGrammarWarmUp,
	getLessonVocabularyItem,
	getLessonVocabularyWarmUp,
	getLessonsCatalog,
	listLessonVocabulary,
	listLessons,
	updateLesson,
	updateLessonVocabularyItem,
} = require('../controllers/lessons.controller');

const router = express.Router();

router.get('/', authorize(['student', 'admin', 'teacher']), listLessons);
router.post('/', authorize(['admin']), createLessonHandler);
router.get('/catalog', authorize(['student']), getLessonsCatalog);
router.get('/:id/grammar', authorize(['student', 'admin']), getLessonGrammar);
router.get('/:id/grammar-warmup', authorize(['student']), getLessonGrammarWarmUp);
router.get('/:id/vocab-warmup', authorize(['student', 'admin']), getLessonVocabularyWarmUp);
router.post('/:id/vocab', authorize(['admin']), createLessonVocabularyItem);
router.get('/:id/vocab/:vocabId', authorize(['student', 'admin']), getLessonVocabularyItem);
router.get('/:id/vocab', authorize(['student', 'admin']), listLessonVocabulary);
router.put('/:id/vocab/:vocabId', authorize(['admin']), updateLessonVocabularyItem);
router.delete('/:id/vocab/:vocabId', authorize(['admin']), deleteLessonVocabularyItem);
router.put('/:id', authorize(['admin']), updateLesson);
router.delete('/:id', authorize(['admin']), deleteLesson);
router.get('/:id', authorize(['student', 'admin', 'teacher']), getLesson);

module.exports = router;
