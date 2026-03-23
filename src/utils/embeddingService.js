const { embedMany } = require('ai');
const { google } = require('@ai-sdk/google');

const BATCH_SIZE = 100;
const RATE_LIMIT_DELAY_MS = 250; // Stay under 5 req/s Gemini limit

async function embedInBatches(texts, batchSize = BATCH_SIZE) {
  if (texts.length === 0) {
    return [];
  }

  const allEmbeddings = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const { embeddings } = await embedMany({
      model: google.textEmbeddingModel('gemini-embedding-001'),
      values: batch,
    });
    allEmbeddings.push(...embeddings);

    // Rate limit delay between batches (skip after last batch)
    if (i + batchSize < texts.length) {
      await new Promise((r) => setTimeout(r, RATE_LIMIT_DELAY_MS));
    }
  }

  return allEmbeddings;
}

module.exports = { embedInBatches, BATCH_SIZE };
