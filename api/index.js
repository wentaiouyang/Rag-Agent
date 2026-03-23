require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { chatWithAgent } = require('../src/controllers/agentController');
const documentsRouter = require('../src/routes/documents');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'AI Agent Server is running!' });
});

app.post('/api/chat', chatWithAgent);

// Document management endpoints (uses /tmp on Vercel for temp file storage)
app.use('/api/documents', documentsRouter);

module.exports = app;
