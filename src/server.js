require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { chatWithAgent } = require('./controllers/agentController');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'AI Agent Server is running!' });
});

// Chat endpoint
app.post('/api/chat', chatWithAgent);

// Start the server and listen for errors
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

// Catch server startup errors
server.on('error', (err) => {
  console.error('❌ Server failed to start:', err);
});

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught exception occurred:', err);
});
