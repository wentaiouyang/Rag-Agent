const { generateText, tool } = require('ai');
const { google } = require('@ai-sdk/google');
const { z } = require('zod');
const { retrieveKnowledge } = require('../services/ragService');

// Simple in-memory cache with TTL
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

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

async function chatWithAgent(req, res) {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log(`\nUser question: "${prompt}"`);

    // Check cache first to avoid unnecessary API calls
    const cached = getCached(prompt);
    if (cached) {
      console.log('Cache hit! Returning cached response.');
      return res.status(200).json(cached);
    }

    const result = await generateText({
      model: google('gemini-2.5-flash'),
      system: `You are a professional full-stack developer assistant.
               Directives:
               1. You MUST use the searchCompanyDocs tool for any questions regarding project architecture, auth, or deployment.
               2. Once you receive the tool output, combine it with your knowledge to give a detailed, helpful answer.
               3. Always respond in the same language as the user's question.`,
      prompt: prompt,
      tools: {
        searchCompanyDocs: tool({
          description:
            'Search internal project documentation for frontend, backend, auth, and deployment specs.',
          parameters: z.object({
            query: z.string().optional().describe('Search query for the knowledge base'),
          }),
          execute: async (args) => {
            // Use the provided query or fallback to the original prompt
            const searchQuery = args.query || prompt;
            const info = await retrieveKnowledge(searchQuery);
            return info; // This returns the string from your rawData
          },
        }),
      },
      maxSteps: 3,
    });

    // ROBUST EXTRACTION: Iterate through steps to find the actual content
    let finalAnswer = result.text;

    if (!finalAnswer) {
      // Extract raw tool output directly instead of making a second API call
      console.log('No direct text response, extracting from tool results...');
      let rawToolOutput = '';

      for (const step of result.steps) {
        if (step.content) {
          for (const part of step.content) {
            if (part.type === 'tool-result') {
              rawToolOutput += (part.result || part.output) + '\n';
            }
          }
        }
      }

      if (rawToolOutput) {
        finalAnswer = rawToolOutput.trim();
      }
    }

    // Final safety net
    if (!finalAnswer || finalAnswer === 'undefined') {
      finalAnswer =
        "Sorry, I found information in the documentation, but couldn't properly summarize it.";
    }

    const response = { question: prompt, answer: finalAnswer };
    setCache(prompt, response);
    res.status(200).json(response);
    console.log(`Success! Answer sent.`);
  } catch (error) {
    console.error('Agent execution error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = { chatWithAgent };
