const db = require('../SQLiteDB/db');
const appError = require('../utils/appError');

/* ===================== GET ALL ===================== */
exports.getAllUsers = () => {
  return db
    .prepare('SELECT * FROM users ORDER BY id ASC')
    .all();
};

/* ===================== GET BY ID ===================== */
exports.getUserById = (id) => {
  const user = db
    .prepare('SELECT * FROM users WHERE id = ?')
    .get(id);

  if (!user) {
    throw new appError('User not found', 404);
  }

  return user;
};

/* ===================== CREATE ===================== */
exports.createUser = ({ username, avatar_url }) => {
  // 1️⃣ limite massimo utenti
  const { count } = db
    .prepare('SELECT COUNT(*) AS count FROM users')
    .get();

  if (count >= 4) {
    throw new appError(
      'User limit reached (max 4 users)',
      403
    );
  }

  // 2️⃣ inserimento
  try {
    const result = db
      .prepare(`
        INSERT INTO users (username, avatar_url)
        VALUES (?, ?)
      `)
      .run(
        username,
        avatar_url || '/public/profile.png'
      );

    return db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(result.lastInsertRowid);

  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new appError('Username already exists', 409);
    }
    throw err;
  }
};

/* ===================== UPDATE ===================== */
exports.updateUser = (id, { username, avatar_url }) => {
  const user = db
    .prepare('SELECT * FROM users WHERE id = ?')
    .get(id);

  if (!user) {
    throw new appError('User not found', 404);
  }

  // controllo username duplicato
  if (username) {
    const existing = db
      .prepare(
        'SELECT 1 FROM users WHERE username = ? AND id <> ?'
      )
      .get(username, id);

    if (existing) {
      throw new appError('Username already exists', 409);
    }
  }

  db.prepare(`
    UPDATE users
    SET
      username = COALESCE(?, username),
      avatar_url = COALESCE(?, avatar_url)
    WHERE id = ?
  `).run(username, avatar_url, id);

  return db
    .prepare('SELECT * FROM users WHERE id = ?')
    .get(id);
};

/* ===================== DELETE ===================== */
exports.deleteUser = (id) => {
  const result = db
    .prepare('DELETE FROM users WHERE id = ?')
    .run(id);

  if (result.changes === 0) {
    throw new appError('User not found', 404);
  }
};
