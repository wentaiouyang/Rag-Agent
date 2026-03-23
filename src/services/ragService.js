const { embed } = require('ai');
const { google } = require('@ai-sdk/google');
const { index } = require('../utils/pineconeClient');

async function retrieveKnowledge(query) {
  const { embedding } = await embed({
    model: google.textEmbeddingModel('gemini-embedding-001'),
    value: query,
  });

  const queryResponse = await index.namespace('my-company-docs').query({
    vector: embedding,
    topK: 5,
    includeMetadata: true,
  });

  if (!queryResponse.matches || queryResponse.matches.length === 0) {
    return [];
  }

  return queryResponse.matches.map((match) => ({
    text: match.metadata.text,
    source: match.metadata.source || 'unknown document',
  }));
}

module.exports = { retrieveKnowledge };
