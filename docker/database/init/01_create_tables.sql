-- 1. Tabella Profili Utente
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    avatar_url TEXT, -- Percorso a un'immagine o nome di una icona
    profile_color VARCHAR(7) DEFAULT '#3f51b5',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabella Categorie (ogni utente ha le sue)
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL,
    UNIQUE(user_id, name) -- Impedisce doppioni dello stesso nome per lo stesso utente
);

-- 3. Tabella Task
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority INTEGER CHECK (priority BETWEEN 1 AND 3), -- 1:Bassa, 2:Media, 3:Alta
    status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done')),
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabella Promemoria
CREATE TABLE IF NOT EXISTS reminders (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    remind_at TIMESTAMP NOT NULL,
    is_sent BOOLEAN DEFAULT FALSE
);