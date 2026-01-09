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
    due_date_task TEXT NOT NULL,
    remind_at TEXT NOT NULL,
    is_sent INTEGER DEFAULT 0,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
  );

  INSERT OR IGNORE INTO users (id, username, avatar_url)
  VALUES (1, 'Default_User', '/avatar/profile.png');

  INSERT INTO categories (name, color)
  SELECT 'Lavoro', '#FF5733'
  WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Lavoro');

  INSERT INTO categories (name, color)
  SELECT 'Studio', '#33C1FF'
  WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Studio');

  INSERT INTO categories (name, color)
  SELECT 'Personale', '#98FF33'
  WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Personale');

  INSERT INTO categories (name, color)
  SELECT 'Pagamenti', '#4C6A92'
  WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Pagamenti');
`);
