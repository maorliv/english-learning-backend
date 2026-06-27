const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('[Gemini] GEMINI_API_KEY is not set in .env');
} else {
  console.log(`[Gemini] API key loaded (starts with ${apiKey.substring(0, 4)}...)`);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

/** Sends a single prompt to Gemini and returns the text response (shared across all AI features). */
async function askGemini(prompt) {
  const start = Date.now();
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log(`[Gemini] SUCCESS in ${Date.now() - start}ms (${text.length} chars)`);
    return text;
  } catch (error) {
    console.error(`[Gemini] FAILED in ${Date.now() - start}ms — ${error.message}`);
    throw error;
  }
}

module.exports = { model, askGemini };
