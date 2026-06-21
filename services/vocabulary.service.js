const prisma = require('../prisma/client');

async function getVocabularyByLessonId(lessonId) {
  return prisma.vocabulary.findMany({
    where: { lessonId: Number(lessonId) },
  });
}

async function getVocabularyItemByLessonAndId(lessonId, vocabId) {
  return prisma.vocabulary.findFirst({
    where: {
      lessonId: Number(lessonId),
      vocabularyId: Number(vocabId),
    },
  });
}

async function createVocabularyItem(lessonId, data) {
  return prisma.vocabulary.create({
    data: {
      lessonId: Number(lessonId),
      word: data.word,
      translation: data.translation,
      example: data.example,
      definition: data.definition,
      completeSentence: data.completeSentence,
    },
  });
}

async function updateVocabularyItemByLessonAndId(lessonId, vocabId, data) {
  const item = await getVocabularyItemByLessonAndId(lessonId, vocabId);
  if (!item) return null;

  return prisma.vocabulary.update({
    where: { vocabularyId: item.vocabularyId },
    data: {
      word: data.word,
      translation: data.translation,
      example: data.example,
      definition: data.definition,
      completeSentence: data.completeSentence,
    },
  });
}

async function deleteVocabularyItemByLessonAndId(lessonId, vocabId) {
  const item = await getVocabularyItemByLessonAndId(lessonId, vocabId);
  if (!item) return null;

  return prisma.vocabulary.delete({
    where: { vocabularyId: item.vocabularyId },
  });
}

module.exports = {
  getVocabularyByLessonId,
  getVocabularyItemByLessonAndId,
  createVocabularyItem,
  updateVocabularyItemByLessonAndId,
  deleteVocabularyItemByLessonAndId,
};
