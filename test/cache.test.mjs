import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test the cache logic from agentController.js
// Extracted here since the module has side effects (Pinecone init)

describe('agentController cache logic', () => {
  let cache;
  const CACHE_TTL = 10 * 60 * 1000;

  function getCached(prompt) {
    const key = prompt.trim().toLowerCase();
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      cache.delete(key);
      return null;
    }
    return entry.data;
  }

  function setCache(prompt, data) {
    const key = prompt.trim().toLowerCase();
    cache.set(key, { data, timestamp: Date.now() });
  }

  beforeEach(() => {
    cache = new Map();
    vi.useRealTimers();
  });

  it('returns null for uncached prompts', () => {
    expect(getCached('What is React?')).toBeNull();
  });

  it('returns cached data for matching prompts', () => {
    const data = { question: 'What is React?', answer: 'A JS library' };
    setCache('What is React?', data);
    expect(getCached('What is React?')).toEqual(data);
  });

  it('normalizes prompt case and whitespace for cache key', () => {
    const data = { question: 'test', answer: 'answer' };
    setCache('  WHAT IS REACT?  ', data);
    expect(getCached('what is react?')).toEqual(data);
  });

  it('returns null for expired cache entries', () => {
    vi.useFakeTimers();
    const data = { question: 'test', answer: 'answer' };
    setCache('test prompt', data);

    vi.advanceTimersByTime(CACHE_TTL + 1);

    expect(getCached('test prompt')).toBeNull();
    expect(cache.size).toBe(0);
  });

  it('does not expire entries within TTL', () => {
    vi.useFakeTimers();
    const data = { question: 'test', answer: 'answer' };
    setCache('test prompt', data);

    vi.advanceTimersByTime(CACHE_TTL - 1000);

    expect(getCached('test prompt')).toEqual(data);
  });
});
