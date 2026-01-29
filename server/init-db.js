import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure database directory exists
const dbDir = join(__dirname, '../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = join(dbDir, 'claude.db');

console.log('Initializing database at:', dbPath);

// Initialize database
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
console.log('Creating tables...');

// Users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    preferences TEXT DEFAULT '{}',
    custom_instructions TEXT
  )
`);

// Projects table
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#CC785C',
    custom_instructions TEXT,
    knowledge_base_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_archived INTEGER DEFAULT 0,
    is_pinned INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

// Conversations table
db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_id TEXT,
    title TEXT,
    model TEXT DEFAULT 'claude-sonnet-4-5-20250929',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_message_at DATETIME,
    is_archived INTEGER DEFAULT 0,
    is_pinned INTEGER DEFAULT 0,
    is_deleted INTEGER DEFAULT 0,
    settings TEXT DEFAULT '{}',
    token_count INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
  )
`);

// Messages table
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    edited_at DATETIME,
    tokens INTEGER DEFAULT 0,
    finish_reason TEXT,
    images TEXT DEFAULT '[]',
    parent_message_id TEXT,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_message_id) REFERENCES messages(id) ON DELETE SET NULL
  )
`);

// Artifacts table
db.exec(`
  CREATE TABLE IF NOT EXISTS artifacts (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL,
    conversation_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('code', 'html', 'svg', 'react', 'mermaid', 'text')),
    title TEXT,
    identifier TEXT,
    language TEXT,
    content TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  )
`);

// Shared conversations table
db.exec(`
  CREATE TABLE IF NOT EXISTS shared_conversations (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    share_token TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    view_count INTEGER DEFAULT 0,
    is_public INTEGER DEFAULT 1,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  )
`);

// Prompt library table
db.exec(`
  CREATE TABLE IF NOT EXISTS prompt_library (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    prompt_template TEXT NOT NULL,
    category TEXT,
    tags TEXT DEFAULT '[]',
    is_public INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

// Conversation folders table
db.exec(`
  CREATE TABLE IF NOT EXISTS conversation_folders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_id TEXT,
    name TEXT NOT NULL,
    parent_folder_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    position INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_folder_id) REFERENCES conversation_folders(id) ON DELETE CASCADE
  )
`);

// Conversation folder items table
db.exec(`
  CREATE TABLE IF NOT EXISTS conversation_folder_items (
    id TEXT PRIMARY KEY,
    folder_id TEXT NOT NULL,
    conversation_id TEXT NOT NULL,
    FOREIGN KEY (folder_id) REFERENCES conversation_folders(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    UNIQUE(folder_id, conversation_id)
  )
`);

// Usage tracking table
db.exec(`
  CREATE TABLE IF NOT EXISTS usage_tracking (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    conversation_id TEXT,
    message_id TEXT,
    model TEXT NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cost_estimate REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE SET NULL
  )
`);

// API keys table
db.exec(`
  CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    key_name TEXT,
    api_key_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used_at DATETIME,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

// Create indices for better query performance
console.log('Creating indices...');

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
  CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON conversations(project_id);
  CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
  CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
  CREATE INDEX IF NOT EXISTS idx_artifacts_conversation_id ON artifacts(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_artifacts_message_id ON artifacts(message_id);
  CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
  CREATE INDEX IF NOT EXISTS idx_usage_tracking_created_at ON usage_tracking(created_at);
`);

// Insert default user for development
console.log('Creating default user...');

const defaultUserId = 'default-user-001';
const existingUser = db.prepare('SELECT id FROM users WHERE id = ?').get(defaultUserId);

if (!existingUser) {
  db.prepare(`
    INSERT INTO users (id, email, name, preferences, custom_instructions)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    defaultUserId,
    'user@example.com',
    'Demo User',
    JSON.stringify({
      theme: 'auto',
      fontSize: 16,
      messageDensity: 'comfortable',
      codeTheme: 'okaidia'
    }),
    ''
  );
  console.log('✓ Default user created');
} else {
  console.log('✓ Default user already exists');
}

console.log('');
console.log('✅ Database initialization complete!');
console.log('   Database location:', dbPath);
console.log('   Tables created: 11');
console.log('   Indices created: 8');
console.log('');

db.close();
