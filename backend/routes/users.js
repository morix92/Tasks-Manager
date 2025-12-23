const express = require('express');
const router = express.Router();
const pool = require('../pool');
const asyncHandler = require('../utils/asyncHandler');
const appError = require('../utils/appError');

// GET ALL
router.get('/', asyncHandler(async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM users ORDER BY Id ASC;');
    res.status(200).json(rows);
  })
);

// GET by Id
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );

  if (rows.length === 0) {
    throw new appError('User not found', 404);
  }

  res.status(200).json(rows[0]);
}));

// POST - Create user
router.post('/', asyncHandler(async (req, res) => {
  const { username, avatar_url } = req.body;

  if (!username) {
    throw new appError('Username is required', 400);
  }

  const { rows } = await pool.query(
    `WITH user_count AS (
       SELECT COUNT(*) AS count FROM users
     ), inserted AS (
       INSERT INTO users (username, avatar_url)
       SELECT $1, $2
       FROM user_count
       WHERE count < 4
       RETURNING *
     )
     SELECT * FROM inserted`,
    [username, avatar_url || '/public/profile.png']
  );

  if (rows.length === 0) {
    throw new appError('User limit reached (max 4)', 403);
  }

  res.status(201).json(rows[0]);
}));


// PUT - Update user
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { username, avatar_url } = req.body;

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

  res.status(202).json(rows[0]);
}));


// DELETE - Remove user
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { rowCount } = await pool.query(
    'DELETE FROM users WHERE id = $1',
    [id]
  );

  if (rowCount === 0) {
    throw new appError('User not found', 404);
  }

  res.status(204).send("Utente cancellato");
}));


module.exports = router;