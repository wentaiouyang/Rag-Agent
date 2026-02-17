require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { embedMany } = require('ai');
const { google } = require('@ai-sdk/google');
const { Pinecone } = require('@pinecone-database/pinecone');

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index(process.env.PINECONE_INDEX_NAME);

// Core configuration: text chunking parameters
const CHUNK_SIZE = 500; // Each chunk is about 500 characters
const CHUNK_OVERLAP = 100; // Each chunk overlaps the previous chunk by 100 characters to avoid abrupt context breaks

/**
 * Smart text splitter function
 */
function chunkText(text, chunkSize, overlap) {
  const chunks = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;

    // Try not to break a sentence; look for the nearest period (Chinese) or newline
    if (endIndex < text.length) {
      const nextNewline = text.indexOf('\n', endIndex);
      const nextPeriod = text.indexOf('。', endIndex);
      // If there is nearby punctuation, break at the punctuation
      if (nextNewline !== -1 && nextNewline - endIndex < 50) {
        endIndex = nextNewline;
      } else if (nextPeriod !== -1 && nextPeriod - endIndex < 50) {
        endIndex = nextPeriod + 1;
      }
    }

    chunks.push(text.slice(startIndex, endIndex).trim());

    // Move to the next chunk, keeping the overlap
    startIndex = endIndex - overlap;
    // Prevent infinite loop
    if (startIndex <= chunks[chunks.length - 1].length - chunkSize) {
      startIndex += overlap;
    }
  }
  return chunks.filter((chunk) => chunk.length > 10); // Filter out fragments that are too short
}

async function main() {
  console.log('Starting to scan documents in the docs directory...');

  const docsPath = path.join(__dirname, '../../docs'); // Make sure the path points to your docs folder
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

  const allChunks = []; // Collect all chunks from all files

  // 1. Read and chunk all files
  for (const file of files) {
    const filePath = path.join(docsPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    const chunks = chunkText(content, CHUNK_SIZE, CHUNK_OVERLAP);
    console.log(`File [${file}] has been split into ${chunks.length} chunks.`);

    // Bind each chunk with its source file name
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
    // To avoid array size API errors, only extract the plain text array for embedding
    const textsToEmbed = allChunks.map((c) => c.text);

    // 2. Generate vectors in batch
    const { embeddings } = await embedMany({
      model: google.textEmbeddingModel('gemini-embedding-001'),
      values: textsToEmbed,
    });

    console.log(
      `Successfully generated ${embeddings.length} embeddings. Assembling data for Pinecone...`,
    );

    // 3. Assemble and write to the database (store original text and source file in the metadata)
    const vectors = allChunks.map((chunkInfo, i) => ({
      id: `${chunkInfo.source}-chunk-${chunkInfo.chunkIndex}`,
      values: embeddings[i],
      metadata: {
        text: chunkInfo.text,
        source: chunkInfo.source, // Records which file this text comes from
      },
    }));

    await index.upsert({
      namespace: 'my-company-docs',
      records: vectors,
    });

    console.log(
      'Real document data successfully written to the Pinecone vector database! Your Agent is now smarter!',
    );
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main();
