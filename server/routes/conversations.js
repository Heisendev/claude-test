import express from 'express';
import { getDatabase, generateId } from '../db.js';

const router = express.Router();

// Get all conversations for a user
router.get('/', (req, res) => {
  try {
    const userId = req.query.user_id || 'default-user';
    const db = getDatabase();

    const conversations = db.prepare(`
      SELECT * FROM conversations
      WHERE user_id = ? AND is_deleted = 0
      ORDER BY last_message_at DESC, created_at DESC
    `).all(userId);

    // Parse JSON fields
    conversations.forEach(conv => {
      conv.settings = JSON.parse(conv.settings || '{}');
    });

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get a single conversation
router.get('/:id', (req, res) => {
  try {
    const db = getDatabase();

    const conversation = db.prepare(`
      SELECT * FROM conversations WHERE id = ?
    `).get(req.params.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    conversation.settings = JSON.parse(conversation.settings || '{}');

    res.json(conversation);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Create a new conversation
router.post('/', (req, res) => {
  try {
    const db = getDatabase();
    const { title, model, user_id, project_id, settings } = req.body;

    const conversationId = generateId();
    const userId = user_id || 'default-user';
    const conversationModel = model || 'claude-sonnet-4-5-20250929';
    const conversationTitle = title || 'New Conversation';

    const stmt = db.prepare(`
      INSERT INTO conversations
      (id, user_id, project_id, title, model, settings, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    stmt.run(
      conversationId,
      userId,
      project_id || null,
      conversationTitle,
      conversationModel,
      JSON.stringify(settings || {})
    );

    const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId);
    conversation.settings = JSON.parse(conversation.settings || '{}');

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Update a conversation
router.put('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const { title, model, settings, is_archived, is_pinned } = req.body;

    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (model !== undefined) {
      updates.push('model = ?');
      params.push(model);
    }
    if (settings !== undefined) {
      updates.push('settings = ?');
      params.push(JSON.stringify(settings));
    }
    if (is_archived !== undefined) {
      updates.push('is_archived = ?');
      params.push(is_archived ? 1 : 0);
    }
    if (is_pinned !== undefined) {
      updates.push('is_pinned = ?');
      params.push(is_pinned ? 1 : 0);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);

    if (updates.length === 1) { // Only updated_at
      return res.status(400).json({ error: 'No fields to update' });
    }

    const stmt = db.prepare(`
      UPDATE conversations
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    const result = stmt.run(...params);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
    conversation.settings = JSON.parse(conversation.settings || '{}');

    res.json(conversation);
  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

// Delete a conversation (soft delete)
router.delete('/:id', (req, res) => {
  try {
    const db = getDatabase();

    const stmt = db.prepare(`
      UPDATE conversations
      SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// Archive/unarchive a conversation
router.put('/:id/archive', (req, res) => {
  try {
    const db = getDatabase();
    const { archived } = req.body;

    const stmt = db.prepare(`
      UPDATE conversations
      SET is_archived = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(archived ? 1 : 0, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
    conversation.settings = JSON.parse(conversation.settings || '{}');

    res.json(conversation);
  } catch (error) {
    console.error('Error archiving conversation:', error);
    res.status(500).json({ error: 'Failed to archive conversation' });
  }
});

// Pin/unpin a conversation
router.put('/:id/pin', (req, res) => {
  try {
    const db = getDatabase();
    const { pinned } = req.body;

    const stmt = db.prepare(`
      UPDATE conversations
      SET is_pinned = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(pinned ? 1 : 0, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
    conversation.settings = JSON.parse(conversation.settings || '{}');

    res.json(conversation);
  } catch (error) {
    console.error('Error pinning conversation:', error);
    res.status(500).json({ error: 'Failed to pin conversation' });
  }
});

export default router;
