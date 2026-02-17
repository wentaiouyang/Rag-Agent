const { embed } = require('ai');
const { google } = require('@ai-sdk/google');
const { Pinecone } = require('@pinecone-database/pinecone');

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
// Note: The new SDK recommends placing the index operation within the request itself, or initializing like this
const index = pc.index(process.env.PINECONE_INDEX_NAME);

async function retrieveKnowledge(query) {
  // 1. Convert the agent-refined search term into a 3072-dimensional vector
  const { embedding } = await embed({
    model: google.textEmbeddingModel('gemini-embedding-001'),
    value: query,
  });

  // 2. Query Pinecone for the most similar 2 records
  const queryResponse = await index.namespace('my-company-docs').query({
    vector: embedding,
    topK: 2,
    includeMetadata: true, // Must be true to retrieve the original text
  });

  if (!queryResponse.matches || queryResponse.matches.length === 0) {
    return 'No relevant information found in the knowledge base.';
  }

  // 3. Concatenate the retrieved texts and return to the agent
  //   const context = queryResponse.matches.map((match) => match.metadata.text).join('\n\n');
  const context = queryResponse.matches
    .map((match) => {
      const sourceName = match.metadata.source || 'unknown document';
      return `[source: ${sourceName}]\n${match.metadata.text}`;
    })
    .join('\n\n---\n\n');

  return context;
}

module.exports = { retrieveKnowledge };
