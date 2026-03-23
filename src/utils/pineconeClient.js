const { Pinecone } = require('@pinecone-database/pinecone');

let pc = null;
let index = null;

try {
  if (process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_NAME) {
    pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    index = pc.index(process.env.PINECONE_INDEX_NAME);
  }
} catch (err) {
  console.error('Failed to initialize Pinecone:', err.message);
}

module.exports = { pc, index };
