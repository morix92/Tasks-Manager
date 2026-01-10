const db = require('./db');

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
    user_id INTEGER,
    category_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    priority INTEGER CHECK (priority BETWEEN 1 AND 3),
    status TEXT DEFAULT 'da_eseguire'
      CHECK (status IN ('da_eseguire', 'in_corso', 'eseguita')),
    due_date TEXT,
    completed_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    exact_remind_at TEXT,
    recurrence_rule TEXT
      CHECK (recurrence_rule IN ('hourly', 'daily', 'weekly', 'monthly', 'yearly')),
    recurrence_interval INTEGER DEFAULT 1 CHECK (recurrence_interval > 0),
    is_featured INTEGER DEFAULT 0,
    featured_order INTEGER,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,

    CHECK (
      (is_featured = 0 AND featured_order IS NULL)
      OR
      (is_featured = 1 AND featured_order BETWEEN 1 AND 3)
    )
  );

  CREATE UNIQUE INDEX IF NOT EXISTS unique_featured_order_per_user
  ON tasks (user_id, featured_order)
  WHERE is_featured = 1;

  CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    task_title TEXT NOT NULL,
    task_due_date TEXT NOT NULL,
    remind_at TEXT NOT NULL,
    is_sent INTEGER DEFAULT 0,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
  );

  -- Tabella di configurazione per primo inserimento dati
  CREATE TABLE IF NOT EXISTS app_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL
  );

  INSERT OR IGNORE INTO app_config (key, value) 
  VALUES ('initialized', '0');

  INSERT INTO users (id, username, avatar_url)
  SELECT 1, 'Default_User', '/avatar/profile.png'
  WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'Default_User') 
  AND (SELECT value FROM app_config WHERE key = 'initialized') = '0';

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

  -- Imposta il flag "initialized" a 1 dopo che i dati di default sono stati inseriti
  UPDATE app_config SET value = '1' WHERE key = 'initialized';
`);
