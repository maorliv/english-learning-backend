const vocabulary = require('./data/vocabulary.json');

function getVocabularyByLessonId(lessonId) {
  return vocabulary
    .filter((item) => String(item.lessonId) === String(lessonId))
    .map((item) => ({
      vocabularyId: item.vocabularyId,
      word: item.word,
      translation: item.translation,
      example: item.example,
      definition: item.definition,
      completeSentence: item.completeSentence,
    }));
}

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

function createVocabularyItem(lessonId, vocabularyData) {
  const nextVocabularyId = vocabulary.reduce((maxVocabularyId, item) => {
    return Math.max(maxVocabularyId, Number(item.vocabularyId) || 0);
  }, 0) + 1;

  const newVocabularyItem = {
    vocabularyId: nextVocabularyId,
    lessonId: Number(lessonId),
    word: vocabularyData.word,
    translation: vocabularyData.translation,
    example: vocabularyData.example,
    definition: vocabularyData.definition,
    completeSentence: vocabularyData.completeSentence,
  };

  vocabulary.push(newVocabularyItem);

  return newVocabularyItem;
}

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