-- 1. Utenti
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categorie
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL,
    UNIQUE(user_id, name) -- Impedisce doppioni dello stesso nome per lo stesso utente
);

-- 3. Task
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority INTEGER CHECK (priority BETWEEN 1 AND 3), -- 1:Bassa, 2:Media, 3:Alta
    status VARCHAR(20) DEFAULT 'da_eseguire' CHECK (status IN ('da_eseguire', 'in_corso', 'eseguita')),
    due_date TIMESTAMP,
	completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recurrence_rule VARCHAR(20) CHECK (recurrence_rule IN ('daily', 'weekly', 'monthly', 'yearly')),
	is_featured BOOLEAN DEFAULT false,
	featured_order INTEGER,
	
	CONSTRAINT check_featured_consistency
    CHECK (
        (is_featured = false AND featured_order IS NULL)
        OR
        (is_featured = true AND featured_order BETWEEN 1 AND 3)
    )
);

-- Indice per task in evidenza
CREATE UNIQUE INDEX IF NOT EXISTS unique_featured_order_per_user
ON tasks (user_id, featured_order)
WHERE is_featured = true;

-- 4. Promemoria
CREATE TABLE IF NOT EXISTS reminders (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    remind_at TIMESTAMP NOT NULL,
    is_sent BOOLEAN DEFAULT FALSE
);