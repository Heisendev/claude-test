import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Key handling
let API_KEY = process.env.VITE_ANTHROPIC_API_KEY;

// Try to read from /tmp/api-key if not in env
if (!API_KEY) {
  try {
    API_KEY = fs.readFileSync('/tmp/api-key', 'utf-8').trim();
  } catch (err) {
    console.warn('⚠️  Warning: No API key found in environment or /tmp/api-key');
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!API_KEY
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!API_KEY
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Claude AI Clone API',
    version: '0.1.0',
    status: 'running',
    endpoints: {
      health: '/health',
      api: '/api/*'
    }
  });
});

// Import routes
import conversationsRouter from './routes/conversations.js';
import messagesRouter from './routes/messages.js';

// API routes
app.use('/api/conversations', conversationsRouter);
app.use('/api/conversations', messagesRouter);
// More routes will be added here
// app.use('/api/artifacts', artifactsRouter);
// app.use('/api/projects', projectsRouter);
// etc.

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Endpoint not found',
      status: 404
    }
  });
});

// Start server
app.listen(PORT, 'localhost', () => {
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   Claude AI Clone - Backend Server        ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/health`);
  console.log(`✓ API Key: ${API_KEY ? '✓ Configured' : '✗ Not configured'}`);
  console.log('');
  console.log('Ready to accept requests...');
  console.log('');
});

export default app;
