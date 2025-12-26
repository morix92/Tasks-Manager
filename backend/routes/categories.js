const express = require('express');
const router = express.Router();
const pool = require('../pool');
const asyncHandler = require('../utils/asyncHandler');
const appError = require('../utils/appError');

// GET ALL
router.get('/', asyncHandler(async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM categories ORDER BY Id ASC;');
    res.status(200).json(rows);
  })
);

// GET by Id
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(
    'SELECT * FROM categories WHERE id = $1',
    [id]
  );

  if (rows.length === 0) {
    throw new appError('Category not found', 404);
  }

  res.status(200).json(rows[0]);
}));

// GET by Name
router.get('/name/:name', asyncHandler(async (req, res) => {
  const { name } = req.params;
  const { rows } = await pool.query(
    'SELECT * FROM categories WHERE name = $1',
    [name]
  );

  if (rows.length === 0) {
    throw new appError('Category not found', 404);
  }

  res.status(200).json(rows[0]);
}));


// POST - Create Category
router.post('/', asyncHandler(async (req, res) => {
  const { name, color } = req.body;

  if (!name) {
    throw new appError('Name is required', 400);
  }

  // Valori di default
  const categoryColor = color || "#4b33ffff";

  try {
    const { rows } = await pool.query(
    `INSERT INTO categories (name, color) VALUES ($1, $2) RETURNING *`,
    [name, categoryColor]
  );
    res.status(201).json(rows[0]);

  } catch (err) {

    if (err.code === '23505') {         //(violazione della chiave unica)
      throw new appError('Nome Categoria già esistente. Scegli un nome diverso.', 400);
    }
    throw new appError('',500);
  }
}));


// PUT - Update Category
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, color } = req.body;

  try {
    const { rows } = await pool.query(
        `UPDATE categories
        SET
        name = COALESCE($1, name),
        color = COALESCE($2, color)
        WHERE id = $3
        RETURNING *`,
        [name, color, id]
    );

    if (rows.length === 0) {
        throw new appError('Category not found', 404);
    }

    res.status(202).json(rows[0]);

  } catch (err) {
    if (err.code === '23505') {         //(violazione della chiave unica)
      throw new appError('Nome Categoria già esistente. Scegli un nome diverso.', 400);
    }
    throw new appError('',500);
  }
}));


// DELETE - Remove Category
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { rowCount } = await pool.query(
    'DELETE FROM categories WHERE id = $1',
    [id]
  );

  if (rowCount === 0) {
    throw new appError('Category not found', 404);
  }

  res.status(204).send();
}));


module.exports = router;