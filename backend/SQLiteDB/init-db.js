const path = require('path');
const fs = require('fs-extra'); // per copiare avatar
const db = require('./db');

// Assicurati che ci sia la cartella avatar dentro dataDir
const dataDir = process.env.TASK_MANAGER_DATA_DIR;
const avatarDestDir = path.join(dataDir, 'avatar');
fs.ensureDirSync(avatarDestDir);

// Copia gli avatar dalla cartella originale (backend/public/avatar) solo se non esistono
const avatarSrcDir = path.join(__dirname, '..' , 'public', 'avatar');
fs.copySync(avatarSrcDir, avatarDestDir, { overwrite: false });

// Esegui SQL di inizializzazione
db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    priority INTEGER CHECK (priority BETWEEN 1 AND 3),
    status INTEGER DEFAULT 0 CHECK (status BETWEEN 0 AND 2),
    completed_at TEXT,
    due_date TEXT,
    created_at TEXT NOT NULL,
    exact_remind_at TEXT,
    recurrence_rule TEXT
      CHECK (recurrence_rule IN ('hourly', 'daily', 'weekly', 'monthly', 'yearly')),
    recurrence_interval INTEGER DEFAULT 1 CHECK (recurrence_interval > 0),
    is_featured INTEGER DEFAULT 0,
    featured_order INTEGER DEFAULT 0,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,

    CHECK (
      (is_featured = 0 AND featured_order = 0)
      OR
      (is_featured = 1 AND featured_order BETWEEN 1 AND 3)
    )
  );

  CREATE UNIQUE INDEX IF NOT EXISTS unique_featured_order_per_user
  ON tasks (user_id, featured_order)
  WHERE is_featured = 1;

  CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    task_id INTEGER NOT NULL,
    task_title TEXT NOT NULL,
    task_due_date TEXT NOT NULL,
    remind_at TEXT NOT NULL,
    is_sent INTEGER DEFAULT 0,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS app_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL
  );

  INSERT OR IGNORE INTO app_config (key, value) 
  VALUES ('initialized', '0');

  -- Inserimento default user solo se non esiste e DB non inizializzato
  INSERT INTO users (id, username, avatar_url)
  SELECT 1, 'Utente', 'http://127.0.0.1:3000/avatar/profile.png'
  WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'Default_User') 
  AND (SELECT value FROM app_config WHERE key = 'initialized') = '0';

  -- Inserimento categorie di default
  INSERT INTO categories (name, color)
  SELECT 'Lavoro', '#e85b2e'
  WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Lavoro') 
  AND (SELECT value FROM app_config WHERE key = 'initialized') = '0';

  INSERT INTO categories (name, color)
  SELECT 'Studio', '#ab9cff'
  WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Studio') 
  AND (SELECT value FROM app_config WHERE key = 'initialized') = '0';

  INSERT INTO categories (name, color)
  SELECT 'Personale', '#6cadf9'
  WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Personale') 
  AND (SELECT value FROM app_config WHERE key = 'initialized') = '0';

  INSERT INTO categories (name, color)
  SELECT 'Pagamenti', '#6ea47b'
  WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Pagamenti') 
  AND (SELECT value FROM app_config WHERE key = 'initialized') = '0';

  -- Segna DB come inizializzato
  UPDATE app_config SET value = '1' WHERE key = 'initialized';
`);

console.log('DB inizializzato in:', dataDir);
