import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { getDatabase, generateId } from '../db.js';
import fs from 'fs';

const router = express.Router();

// Initialize Anthropic client
let anthropic;
let API_KEY = process.env.VITE_ANTHROPIC_API_KEY;

// Try to read from /tmp/api-key if not in env
if (!API_KEY) {
  try {
    API_KEY = fs.readFileSync('/tmp/api-key', 'utf-8').trim();
  } catch (err) {
    console.warn('⚠️  Warning: No API key found');
  }
}

if (API_KEY) {
  anthropic = new Anthropic({ apiKey: API_KEY });
}

// Get all messages for a conversation
router.get('/:conversationId/messages', (req, res) => {
  try {
    const db = getDatabase();

    const messages = db.prepare(`
      SELECT * FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `).all(req.params.conversationId);

    // Parse JSON fields
    messages.forEach(msg => {
      msg.images = JSON.parse(msg.images || '[]');
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message and get streaming response
router.post('/:conversationId/messages', async (req, res) => {
  try {
    if (!anthropic) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const db = getDatabase();
    const { content, images, model: requestModel } = req.body;
    const conversationId = req.params.conversationId;

    // Verify conversation exists
    const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Save user message
    const userMessageId = generateId();
    db.prepare(`
      INSERT INTO messages (id, conversation_id, role, content, images, created_at)
      VALUES (?, ?, 'user', ?, ?, CURRENT_TIMESTAMP)
    `).run(userMessageId, conversationId, content, JSON.stringify(images || []));

    // Get conversation history
    const messages = db.prepare(`
      SELECT role, content FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `).all(conversationId);

    // Parse settings
    const settings = JSON.parse(conversation.settings || '{}');
    // Use model from request, then conversation, then default
    const model = requestModel || conversation.model || 'claude-sonnet-4-20250514';

    // Setup SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullResponse = '';
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      // Call Claude API with streaming
      const stream = await anthropic.messages.create({
        model: model,
        max_tokens: settings.max_tokens || 4096,
        temperature: settings.temperature || 1.0,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: true
      });

      // Stream response to client
      for await (const event of stream) {
        if (event.type === 'message_start') {
          inputTokens = event.message.usage.input_tokens;
        } else if (event.type === 'content_block_delta') {
          const text = event.delta.text;
          if (text) {
            fullResponse += text;
            res.write(`data: ${JSON.stringify({ type: 'content', text })}\n\n`);
          }
        } else if (event.type === 'message_delta') {
          outputTokens = event.usage.output_tokens;
        } else if (event.type === 'message_stop') {
          // Message complete
        }
      }

      // Save assistant message
      const assistantMessageId = generateId();
      db.prepare(`
        INSERT INTO messages (id, conversation_id, role, content, tokens, created_at)
        VALUES (?, ?, 'assistant', ?, ?, CURRENT_TIMESTAMP)
      `).run(assistantMessageId, conversationId, fullResponse, outputTokens);

      // Update conversation
      db.prepare(`
        UPDATE conversations
        SET last_message_at = CURRENT_TIMESTAMP,
            message_count = message_count + 2,
            token_count = token_count + ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(inputTokens + outputTokens, conversationId);

      // Auto-generate title if this is the first exchange
      if (messages.length <= 2) {
        const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
        db.prepare('UPDATE conversations SET title = ? WHERE id = ?').run(title, conversationId);
      }

      // Send completion event
      res.write(`data: ${JSON.stringify({
        type: 'done',
        messageId: assistantMessageId,
        inputTokens,
        outputTokens
      })}\n\n`);

      res.end();
    } catch (error) {
      console.error('Claude API error:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error('Error sending message:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to send message' });
    }
  }
});

// Update a message
router.put('/messages/:id', (req, res) => {
  try {
    const db = getDatabase();
    const { content } = req.body;

    const stmt = db.prepare(`
      UPDATE messages
      SET content = ?, edited_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(content, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id);
    message.images = JSON.parse(message.images || '[]');

    res.json(message);
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// Delete a message
router.delete('/messages/:id', (req, res) => {
  try {
    const db = getDatabase();

    const stmt = db.prepare('DELETE FROM messages WHERE id = ?');
    const result = stmt.run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;
