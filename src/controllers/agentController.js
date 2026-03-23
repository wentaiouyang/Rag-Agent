const { generateText, tool } = require('ai');
const { google } = require('@ai-sdk/google');
const { z } = require('zod');
const { retrieveKnowledge } = require('../services/ragService');

// Simple in-memory cache with TTL and size limit
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const CACHE_MAX_SIZE = 1000;

function getCached(prompt) {
  const key = prompt.trim().toLowerCase();
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(prompt, data) {
  if (cache.size >= CACHE_MAX_SIZE) {
    cache.clear();
  }
  const key = prompt.trim().toLowerCase();
  cache.set(key, { data, timestamp: Date.now() });
}

function clearCache() {
  cache.clear();
}

async function chatWithAgent(req, res) {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log(`\nUser question: "${prompt}"`);

    const cached = getCached(prompt);
    if (cached) {
      console.log('Cache hit! Returning cached response.');
      return res.status(200).json(cached);
    }

    // Track sources collected during tool calls
    let collectedSources = [];

    const result = await generateText({
      model: google('gemini-2.5-flash'),
      system: `You are a professional full-stack developer assistant.
               Directives:
               1. You MUST use the searchCompanyDocs tool for any questions regarding project architecture, auth, or deployment.
               2. Once you receive the tool output, combine it with your knowledge to give a detailed, helpful answer.
               3. Always cite your sources using [source: filename] notation.
               4. Always respond in the same language as the user's question.`,
      prompt: prompt,
      tools: {
        searchCompanyDocs: tool({
          description:
            'Search internal project documentation for frontend, backend, auth, and deployment specs.',
          parameters: z.object({
            query: z.string().optional().describe('Search query for the knowledge base'),
          }),
          execute: async (args) => {
            const searchQuery = args.query || prompt;
            const results = await retrieveKnowledge(searchQuery);
            collectedSources = results;
            // Format structured results back into context string for the LLM
            if (results.length === 0) {
              return 'No relevant information found in the knowledge base.';
            }
            return results.map((r) => `[source: ${r.source}]\n${r.text}`).join('\n\n---\n\n');
          },
        }),
      },
      maxSteps: 3,
    });

    let finalAnswer = result.text;

    // Fallback: if no direct text, build answer from structured tool results
    if (!finalAnswer) {
      console.log('No direct text response, extracting from tool results...');
      if (collectedSources.length > 0) {
        finalAnswer = collectedSources.map((s) => s.text).join('\n\n---\n\n');
      }
    }

    if (!finalAnswer || finalAnswer === 'undefined') {
      finalAnswer =
        "Sorry, I found information in the documentation, but couldn't properly summarize it.";
    }

    const response = {
      question: prompt,
      answer: finalAnswer,
      sources: collectedSources.map((s) => ({ text: s.text, source: s.source })),
    };
    setCache(prompt, response);
    res.status(200).json(response);
    console.log(`Success! Answer sent with ${collectedSources.length} sources.`);
  } catch (error) {
    console.error('Agent execution error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = { chatWithAgent, clearCache };
