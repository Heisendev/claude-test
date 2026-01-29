import { getDatabase } from './db.js';

const db = getDatabase();

// Get all conversations
const conversations = db.prepare('SELECT * FROM conversations ORDER BY created_at DESC').all();
console.log('\n=== CONVERSATIONS ===');
conversations.forEach(conv => {
  console.log(`${conv.id}: ${conv.title} (${conv.message_count} messages)`);
});

// Get all messages
const messages = db.prepare('SELECT * FROM messages ORDER BY created_at ASC').all();
console.log('\n=== MESSAGES ===');
messages.forEach(msg => {
  console.log(`[${msg.role}] ${msg.content.substring(0, 50)}...`);
});

console.log(`\nTotal conversations: ${conversations.length}`);
console.log(`Total messages: ${messages.length}`);
