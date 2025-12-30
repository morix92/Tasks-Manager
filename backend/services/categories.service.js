const pool = require('../pool');
const appError = require('../utils/appError');

exports.getAllCategories = async () => {
  const { rows } = await pool.query(
    'SELECT * FROM categories ORDER BY id ASC;'
  );
  return rows;
};

exports.getCategoryById = async (id) => {
  const { rows } = await pool.query(
    'SELECT * FROM categories WHERE id = $1',
    [id]
  );

  if (rows.length === 0) {
    throw new appError('Category not found', 404);
  }

  return rows[0];
};

exports.getCategoryByName = async (name) => {
  const { rows } = await pool.query(
    'SELECT * FROM categories WHERE name = $1',
    [name]
  );

  if (rows.length === 0) {
    throw new appError('Category not found', 404);
  }

  return rows[0];
};

exports.createCategory = async ({ name, color = '#4b33ffff'}) => {

  const { rows } = await pool.query(
    `
    INSERT INTO categories (name, color)
    VALUES ($1, $2)
    ON CONFLICT (name) DO NOTHING
    RETURNING *
    `,
    [name, color]
  );

  if (rows.length === 0) {
    throw new appError('CategoryName already exists.', 409);
  }

  return rows[0];
};


exports.updateCategory = async (id, { name, color }) => {
  const categoryExists = await pool.query('SELECT 1 FROM categories WHERE id = $1', [id]);

  if (categoryExists.rowCount === 0) {
    throw new appError('Category not found', 404);
  }

  const { rows } = await pool.query(
    `
    UPDATE categories c
    SET
      name  = COALESCE($1, c.name),
      color = COALESCE($2, c.color)
    WHERE c.id = $3
      AND NOT EXISTS (
        SELECT 1
        FROM categories c2
        WHERE c2.name = $1
          AND c2.id <> $3
      )
    RETURNING *
    `,
    [name, color, id]
  );

  if (rows.length === 0) {
    throw new appError('Nome categoria già esistente. Scegli un nome diverso.', 409);
  }

  return rows[0];
};


exports.deleteCategory = async (id) => {
  const { rowCount } = await pool.query(
    'DELETE FROM categories WHERE id = $1',
    [id]
  );

  if (rowCount === 0) {
    throw new appError('Category not found', 404);
  }
};
