const { generateText, tool } = require('ai');
const { google } = require('@ai-sdk/google');
const { z } = require('zod');
const { retrieveKnowledge } = require('../services/ragService');

async function chatWithAgent(req, res) {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log(`\nUser question: "${prompt}"`);

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
      maxSteps: 5,
    });

    // ROBUST EXTRACTION: Iterate through steps to find the actual content
    let finalAnswer = result.text;

    if (!finalAnswer) {
      // Agent did not directly generate a summary, intercepting raw text and forcing a summary...
      console.log(
        'Agent did not directly generate a summary, intercepting raw text and forcing a summary...',
      );
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

      // Ultimate fallback: If we get raw slices, force LLM to polish it!
      if (rawToolOutput) {
        console.log('Calling the language model to polish the raw segments...');
        const summaryResult = await generateText({
          model: google('gemini-2.5-flash'),
          system:
            "You are a professional R&D assistant. Based on the provided <Context>, answer the user's question in a professional and concise manner. At the end of your answer, be sure to indicate [source file] used as reference.",
          prompt: `User Question: ${prompt}\n\n<Context>\n${rawToolOutput}\n</Context>`,
        });
        finalAnswer = summaryResult.text;
      }
    }

    // Final safety net
    if (!finalAnswer || finalAnswer === 'undefined') {
      finalAnswer =
        "Sorry, I found information in the documentation, but couldn't properly summarize it.";
    }

    res.status(200).json({
      question: prompt,
      answer: finalAnswer,
    });
    console.log(`Success! Answer sent.`);
  } catch (error) {
    console.error('Agent execution error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = { chatWithAgent };
