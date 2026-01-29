import { getDatabase } from './db.js';

const db = getDatabase();

// Check if default user exists
let user = db.prepare('SELECT * FROM users WHERE id = ?').get('default-user');
console.log('Existing user:', user);

if (!user) {
  console.log('Creating default user...');
  db.prepare(`
    INSERT INTO users (id, email, name, created_at)
    VALUES ('default-user', 'user@example.com', 'Default User', CURRENT_TIMESTAMP)
  `).run();

  user = db.prepare('SELECT * FROM users WHERE id = ?').get('default-user');
  console.log('Created user:', user);
} else {
  console.log('Default user already exists');
}
