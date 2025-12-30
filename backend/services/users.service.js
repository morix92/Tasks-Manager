const pool = require('../pool');
const appError = require('../utils/appError');

/* ===================== GET ALL ===================== */
exports.getAllUsers = async () => {
  const { rows } = await pool.query(
    'SELECT * FROM users ORDER BY id ASC;'
  );
  return rows;
};

/* ===================== GET by Id ===================== */
exports.getUserById = async (id) => {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );

  if (rows.length === 0) {
    throw new appError('User not found', 404);
  }

  return rows[0];
};

/* ===================== CREATE ===================== */
exports.createUser = async ({ username, avatar_url }) => {
  const { rows } = await pool.query(
    `WITH user_count AS (
       SELECT COUNT(*) AS count FROM users
     ), inserted AS (
       INSERT INTO users (username, avatar_url)
       SELECT $1, $2
       FROM user_count
       WHERE count < 4
       ON CONFLICT (username) DO NOTHING
       RETURNING *
     )
     SELECT * FROM inserted`,
    [username, avatar_url || '/public/profile.png']
  );

  if (rows.length === 0) {
    throw new appError('Username already exists or user limit reached (max 4)', 403);
  }

  return rows[0];
};

/* ===================== UPDATE ===================== */
exports.updateUser = async (id, { username, avatar_url }) => {
  const { rows } = await pool.query(
    `UPDATE users
     SET
       username = COALESCE($1, username),
       avatar_url = COALESCE($2, avatar_url)
     WHERE id = $3
     RETURNING *`,
    [username, avatar_url, id]
  );

  if (rows.length === 0) {
    throw new appError('User not found', 404);
  }

  return rows[0];
};

/* ===================== DELETE ===================== */
exports.deleteUser = async (id) => {
  const { rowCount } = await pool.query(
    'DELETE FROM users WHERE id = $1',
    [id]
  );

  if (rowCount === 0) {
    throw new appError('User not found', 404);
  }
};
