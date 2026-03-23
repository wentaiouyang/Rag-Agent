require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { index } = require('../utils/pineconeClient');
const { chunkText, CHUNK_SIZE, CHUNK_OVERLAP } = require('../utils/textChunker');
const { embedInBatches } = require('../utils/embeddingService');
const { addDocument } = require('../utils/documentRegistry');

const UPSERT_BATCH_SIZE = 100;

async function main() {
  console.log('Starting to scan documents in the docs directory...');

  const docsPath = path.join(__dirname, '../../docs');
  if (!fs.existsSync(docsPath)) {
    console.error(
      'Cannot find the docs folder. Please create the folder at the root and put test documents inside.',
    );
    return;
  }

  const files = fs.readdirSync(docsPath).filter((f) => f.endsWith('.md') || f.endsWith('.txt'));
  if (files.length === 0) {
    console.log('The docs folder is empty, or there are no .md or .txt files.');
    return;
  }

  const allChunks = [];

  for (const file of files) {
    const filePath = path.join(docsPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    const chunks = chunkText(content, CHUNK_SIZE, CHUNK_OVERLAP);
    console.log(`File [${file}] has been split into ${chunks.length} chunks.`);

    chunks.forEach((chunk, i) => {
      allChunks.push({
        text: chunk,
        source: file,
        chunkIndex: i,
      });
    });
  }

  console.log(
    `\nA total of ${allChunks.length} text chunks prepared. Starting Gemini embedding...`,
  );

  try {
    const textsToEmbed = allChunks.map((c) => c.text);

    const embeddings = await embedInBatches(textsToEmbed);

    console.log(
      `Successfully generated ${embeddings.length} embeddings. Assembling data for Pinecone...`,
    );

    const vectors = allChunks.map((chunkInfo, i) => ({
      id: `${chunkInfo.source}-chunk-${chunkInfo.chunkIndex}`,
      values: embeddings[i],
      metadata: {
        text: chunkInfo.text,
        source: chunkInfo.source,
        documentId: chunkInfo.source,
      },
    }));

    // Batch upserts to stay within Pinecone limits
    for (let i = 0; i < vectors.length; i += UPSERT_BATCH_SIZE) {
      const batch = vectors.slice(i, i + UPSERT_BATCH_SIZE);
      await index.namespace('my-company-docs').upsert(batch);
      console.log(`Upserted batch ${Math.floor(i / UPSERT_BATCH_SIZE) + 1}...`);
    }

    // Write to document registry for forward compatibility
    for (const file of files) {
      const fileChunks = allChunks.filter((c) => c.source === file);
      const vectorIds = fileChunks.map((c) => `${c.source}-chunk-${c.chunkIndex}`);
      await addDocument({
        documentId: file,
        filename: file,
        filePath: path.join(docsPath, file),
        chunkCount: fileChunks.length,
        vectorIds,
        createdAt: new Date().toISOString(),
        status: 'ready',
      });
    }

    console.log('Real document data successfully written to the Pinecone vector database!');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main();
