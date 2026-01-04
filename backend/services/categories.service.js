const db = require('../SQLiteDB/db');
const appError = require('../utils/appError');

// GET All
exports.getAllCategories = () => {
  return db
    .prepare('SELECT * FROM categories ORDER BY id ASC')
    .all();
};

// GET by Id
exports.getCategoryById = (id) => {
  const category = db
    .prepare('SELECT * FROM categories WHERE id = ?')
    .get(id);

  if (!category) {
    throw new appError('Category not found', 404);
  }

  return category;
};

// GET by Name
exports.getCategoryByName = (name) => {
  const category = db
    .prepare('SELECT * FROM categories WHERE name = ?')
    .get(name);

  if (!category) {
    throw new appError('Category not found', 404);
  }

  return category;
};

// POST
exports.createCategory = ({ name, color = '#4b33ffff' }) => {
  const stmt = db.prepare(`
    INSERT INTO categories (name, color)
    VALUES (?, ?)
  `);

  try {
    const result = stmt.run(name, color);

    return db
      .prepare('SELECT * FROM categories WHERE id = ?')
      .get(result.lastInsertRowid);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new appError('CategoryName already exists.', 409);
    }
    throw err;
  }
};

// PUT
exports.updateCategory = (id, { name, color }) => {
  const category = db
    .prepare('SELECT * FROM categories WHERE id = ?')
    .get(id);

  if (!category) {
    throw new appError('Category not found', 404);
  }

  if (name) {
    const existing = db
      .prepare('SELECT 1 FROM categories WHERE name = ? AND id <> ?')
      .get(name, id);

    if (existing) {
      throw new appError(
        'Nome categoria già esistente. Scegli un nome diverso.',
        409
      );
    }
  }

  db.prepare(`
    UPDATE categories
    SET
      name  = COALESCE(?, name),
      color = COALESCE(?, color)
    WHERE id = ?
  `).run(name, color, id);

  return db
    .prepare('SELECT * FROM categories WHERE id = ?')
    .get(id);
};

// DELETE
exports.deleteCategory = (id) => {
  const result = db
    .prepare('DELETE FROM categories WHERE id = ?')
    .run(id);

  if (result.changes === 0) {
    throw new appError('Category not found', 404);
  }
};
