require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { chatWithAgent } = require('../src/controllers/agentController');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'AI Agent Server is running!' });
});

app.post('/api/chat', chatWithAgent);

// Document routes are not available on Vercel (no persistent filesystem)
app.use('/api/documents', (_req, res) => {
  res.status(501).json({ error: 'Document upload is not available in serverless mode' });
});

module.exports = app;
