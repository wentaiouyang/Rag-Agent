const { generateText } = require('ai');
const { google } = require('@ai-sdk/google');

async function summarizeTitle(req, res) {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }

    const result = await generateText({
      model: google('gemini-2.5-flash'),
      system:
        'Generate a concise conversation title (max 8 words, same language as the input) for this message. Reply with only the title, no quotes or punctuation.',
      prompt: message.trim(),
    });

    const title = (result.text || 'New Chat').trim();
    res.status(200).json({ title });
  } catch (error) {
    console.error('Title summarization error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || String(error),
    });
  }
}

module.exports = { summarizeTitle };
