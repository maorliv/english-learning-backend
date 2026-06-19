const prisma = require('../prisma/client');

async function getAllGrammarRules(category) {
  // MySQL string comparison is case-insensitive by default (utf8mb4_general_ci collation)
  const where = category ? { category } : {};

  const rules = await prisma.grammarRule.findMany({ where });
  return rules.map(r => ({ id: r.id, category: r.category, usage: r.usage }));
}

async function getGrammarRuleById(id) {
  return prisma.grammarRule.findUnique({ where: { id } });
}

async function createGrammarRule(data) {
  return prisma.grammarRule.create({
    data: {
      id: data.id,
      category: data.category,
      usage: data.usage,
      forms: data.forms,
      spellingRules: data.spellingRules || null,
      examples: data.examples,
      keywords: data.keywords,
    },
  });
}

async function updateGrammarRuleById(id, data) {
  try {
    return await prisma.grammarRule.update({
      where: { id },
      data: {
        category: data.category,
        usage: data.usage,
        forms: data.forms,
        spellingRules: data.spellingRules,
        examples: data.examples,
        keywords: data.keywords,
      },
    });
  } catch (error) {
    if (error.code === 'P2025') return null;
    throw error;
  }
}

async function deleteGrammarRuleById(id) {
  try {
    return await prisma.grammarRule.delete({ where: { id } });
  } catch (error) {
    if (error.code === 'P2025') return null;
    throw error;
  }
}

module.exports = {
  getAllGrammarRules,
  getGrammarRuleById,
  createGrammarRule,
  updateGrammarRuleById,
  deleteGrammarRuleById,
};
