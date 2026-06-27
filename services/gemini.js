const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('[Gemini] GEMINI_API_KEY is not set in .env');
} else {
  console.log(`[Gemini] API key loaded (starts with ${apiKey.substring(0, 4)}...)`);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const MAX_RETRIES = 3;

/** Sends a single prompt to Gemini with automatic retry on rate-limit (429) errors. */
async function askGemini(prompt) {
  const start = Date.now();

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      console.log(`[Gemini] SUCCESS in ${Date.now() - start}ms (${text.length} chars, attempt ${attempt})`);
      return text;
    } catch (error) {
      const isRateLimit = error.message?.includes('429') || error.message?.includes('quota');

      if (isRateLimit && attempt < MAX_RETRIES) {
        const retryMatch = error.message.match(/retry in ([\d.]+)s/i);
        const waitSeconds = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 15;
        console.warn(`[Gemini] Rate limited (attempt ${attempt}/${MAX_RETRIES}), retrying in ${waitSeconds}s...`);
        await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
        continue;
      }

      console.error(`[Gemini] FAILED in ${Date.now() - start}ms (attempt ${attempt}) — ${error.message}`);
      throw error;
    }
  }
}

module.exports = { model, askGemini };
