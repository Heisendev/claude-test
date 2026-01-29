import { getDatabase } from './db.js';

const db = getDatabase();

// Get all users
const users = db.prepare('SELECT * FROM users').all();
console.log('All users:', JSON.stringify(users, null, 2));

// Try to create with unique email
if (users.length === 0 || !users.find(u => u.id === 'default-user')) {
  console.log('\nCreating default-user with unique email...');
  try {
    db.prepare(`
      INSERT INTO users (id, email, name, created_at)
      VALUES ('default-user', 'default-user@example.com', 'Default User', CURRENT_TIMESTAMP)
    `).run();
    console.log('✓ Default user created successfully');
  } catch (error) {
    console.error('Error creating user:', error.message);
  }
}
