require('dotenv').config();
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { chatWithAgent } = require('./controllers/agentController');
const documentsRouter = require('./routes/documents');

// Ensure required directories exist (skip on serverless where /tmp is the only writable path)
try {
  fs.mkdirSync('uploads', { recursive: true });
  fs.mkdirSync('data', { recursive: true });
} catch (_err) {
  // Vercel serverless: directories may not be writable
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'AI Agent Server is running!' });
});

// Chat endpoint
app.post('/api/chat', chatWithAgent);

// Document management endpoints
app.use('/api/documents', documentsRouter);

// Export for Vercel serverless
module.exports = app;

// Start the server when running locally (not on Vercel)
if (!process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    console.error('Server failed to start:', err);
  });

  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception occurred:', err);
  });
}
