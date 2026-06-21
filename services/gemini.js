const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

/** Sends a single prompt to Gemini and returns the text response (shared across all AI features). */
async function askGemini(prompt) {
  const result = await model.generateContent(prompt);
  return result.response.text();
}

module.exports = { model, askGemini };
