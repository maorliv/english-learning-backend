const vocabulary = require('./data/vocabulary.json');

/**
 * Returns all vocabulary items that belong to the given lesson.
 * Each item is projected to only expose the fields needed by clients.
 */
function getVocabularyByLessonId(lessonId) {
  return vocabulary
    .filter((item) => String(item.lessonId) === String(lessonId)) // Keep only items for this lesson
    .map((item) => ({
      vocabularyId: item.vocabularyId,
      word: item.word,
      translation: item.translation,
      example: item.example,
      definition: item.definition,
      completeSentence: item.completeSentence,
    }));
}

/**
 * Finds a single vocabulary item by both lessonId and vocabularyId.
 * Both must match — vocabularyIds are not globally unique across lessons.
 * Returns null if no match is found.
 */
function getVocabularyItemByLessonAndId(lessonId, vocabId) {
  const item = vocabulary.find(
    (entry) =>
      String(entry.lessonId) === String(lessonId) &&
      String(entry.vocabularyId) === String(vocabId)
  );

  if (!item) {
    return null;
  }

  return {
    vocabularyId: item.vocabularyId,
    word: item.word,
    translation: item.translation,
    example: item.example,
    definition: item.definition,
  };
}

/**
 * Creates a new vocabulary item linked to the given lesson.
 * The new item's ID is one greater than the current highest vocabularyId across all items.
 */
function createVocabularyItem(lessonId, vocabularyData) {
  const nextVocabularyId = vocabulary.reduce((maxVocabularyId, item) => {
    return Math.max(maxVocabularyId, Number(item.vocabularyId) || 0);
  }, 0) + 1;

  const newVocabularyItem = {
    vocabularyId: nextVocabularyId,
    lessonId: Number(lessonId), // Ensure lessonId is stored as a number for consistent comparison
    word: vocabularyData.word,
    translation: vocabularyData.translation,
    example: vocabularyData.example,
    definition: vocabularyData.definition,
    completeSentence: vocabularyData.completeSentence,
  };

  vocabulary.push(newVocabularyItem);

  return newVocabularyItem;
}

/**
 * Replaces all editable fields of a vocabulary item identified by lessonId + vocabId.
 * Returns the updated item, or null if not found.
 */
function updateVocabularyItemByLessonAndId(lessonId, vocabId, vocabularyData) {
  const item = vocabulary.find(
    (entry) =>
      String(entry.lessonId) === String(lessonId) &&
      String(entry.vocabularyId) === String(vocabId)
  );

  if (!item) {
    return null;
  }

  item.word = vocabularyData.word;
  item.translation = vocabularyData.translation;
  item.example = vocabularyData.example;
  item.definition = vocabularyData.definition;
  item.completeSentence = vocabularyData.completeSentence;

  return item;
}

/**
 * Removes a vocabulary item identified by lessonId + vocabId.
 * Returns the deleted item, or null if not found.
 */
function deleteVocabularyItemByLessonAndId(lessonId, vocabId) {
  const itemIndex = vocabulary.findIndex(
    (entry) =>
      String(entry.lessonId) === String(lessonId) &&
      String(entry.vocabularyId) === String(vocabId)
  );

  if (itemIndex === -1) {
    return null;
  }

  const [deletedItem] = vocabulary.splice(itemIndex, 1);

  return deletedItem;
}

module.exports = {
  getVocabularyByLessonId,
  getVocabularyItemByLessonAndId,
  createVocabularyItem,
  updateVocabularyItemByLessonAndId,
  deleteVocabularyItemByLessonAndId,
};