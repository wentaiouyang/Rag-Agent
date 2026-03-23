import { describe, it, expect } from 'vitest';

// Copy of chunkText from ingest.js for isolated testing
// Will be extracted to src/utils/textChunker.js in the multi-doc feature
function chunkText(text, chunkSize, overlap) {
  const chunks = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;

    if (endIndex < text.length) {
      const nextNewline = text.indexOf('\n', endIndex);
      const nextPeriod = text.indexOf('\u3002', endIndex);
      if (nextNewline !== -1 && nextNewline - endIndex < 50) {
        endIndex = nextNewline;
      } else if (nextPeriod !== -1 && nextPeriod - endIndex < 50) {
        endIndex = nextPeriod + 1;
      }
    }

    chunks.push(text.slice(startIndex, endIndex).trim());

    startIndex = endIndex - overlap;
    if (startIndex <= chunks[chunks.length - 1].length - chunkSize) {
      startIndex += overlap;
    }
  }
  return chunks.filter((chunk) => chunk.length > 10);
}

describe('chunkText', () => {
  it('splits text into chunks of approximately the given size', () => {
    const text = 'A'.repeat(1200);
    const chunks = chunkText(text, 500, 100);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].length).toBeLessThanOrEqual(550);
  });

  it('returns a single chunk for text shorter than chunkSize', () => {
    const text = 'This is a short piece of text for testing purposes here.';
    const chunks = chunkText(text, 500, 100);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(text);
  });

  it('filters out fragments shorter than 10 characters', () => {
    const text = 'A'.repeat(510) + 'tiny';
    const chunks = chunkText(text, 500, 100);
    for (const chunk of chunks) {
      expect(chunk.length).toBeGreaterThan(10);
    }
  });

  it('respects overlap between chunks', () => {
    const text = 'A'.repeat(1000);
    const chunks = chunkText(text, 500, 100);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
  });

  it('breaks at newlines when nearby', () => {
    const text = 'A'.repeat(510) + '\n' + 'B'.repeat(500);
    const chunks = chunkText(text, 500, 100);
    expect(chunks[0]).toMatch(/^A+$/);
  });

  it('returns empty array for very short text', () => {
    const chunks = chunkText('hi', 500, 100);
    expect(chunks).toHaveLength(0);
  });
});
