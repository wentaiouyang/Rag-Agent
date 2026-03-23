const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 100;

function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const chunks = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;

    // Try to break at a sentence boundary within 50 chars past the target
    if (endIndex < text.length) {
      const nextNewline = text.indexOf('\n', endIndex);
      const nextEnglishPeriod = text.indexOf('. ', endIndex);
      const nextChinesePeriod = text.indexOf('\u3002', endIndex);

      // Pick the closest boundary within 50 chars
      const candidates = [
        nextNewline !== -1 && nextNewline - endIndex < 50 ? nextNewline : -1,
        nextEnglishPeriod !== -1 && nextEnglishPeriod - endIndex < 50 ? nextEnglishPeriod + 1 : -1,
        nextChinesePeriod !== -1 && nextChinesePeriod - endIndex < 50 ? nextChinesePeriod + 1 : -1,
      ].filter((c) => c !== -1);

      if (candidates.length > 0) {
        endIndex = Math.min(...candidates);
      }
    }

    chunks.push(text.slice(startIndex, endIndex).trim());

    const nextStart = endIndex - overlap;
    // Prevent infinite loop: if no forward progress, force advance
    if (nextStart <= startIndex) {
      startIndex = endIndex;
    } else {
      startIndex = nextStart;
    }
  }

  return chunks.filter((chunk) => chunk.length > 10);
}

module.exports = { chunkText, CHUNK_SIZE, CHUNK_OVERLAP };
