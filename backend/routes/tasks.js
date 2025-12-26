const express = require('express');
const router = express.Router();
const pool = require('../pool');
const asyncHandler = require('../utils/asyncHandler');
const appError = require('../utils/appError');

// GET All + Filtri
router.get('/', asyncHandler(async (req, res) => {
  const { title, priority, due_date_order, featured_order, order, username } = req.query;

  let query = `
  SELECT 
    t.id, 
    t.title, 
    t.description, 
    t.priority, 
    t.status, 
    t.due_date, 
    t.completed_at, 
    t.created_at, 
    t.recurrence_rule, 
    t.is_featured, 
    t.featured_order,
    u.username AS user_username, 
    c.name AS category_name
  FROM tasks t
  LEFT JOIN users u ON t.user_id = u.id
  LEFT JOIN categories c ON t.category_id = c.id
  `;
  let params = [];
  let conditions = [];

  // filter by title
  if (username) {
    conditions.push(`u.username ILIKE $${params.length + 1}`);
    params.push(`%${username}%`);
  }

  // filter by title
  if (title) {
    conditions.push(`title ILIKE $${params.length + 1}`);
    params.push(`%${title}%`);
  }

  // filter by priority
  if (priority) {
    conditions.push(`priority = $${params.length + 1}`);
    params.push(priority);
  }

  // WHERE dinamico
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  // gestione ordine (default: Id - ASC)
  const idOrder = order === 'desc' ? 'DESC' : 'ASC';

  if (due_date_order === 'asc' || due_date_order === 'desc') {
    query += ` ORDER BY due_date ${due_date_order.toUpperCase()}`;
  } else if ((featured_order === 'asc' || featured_order === 'desc')) {
    query += ` ORDER BY featured_order ${featured_order.toUpperCase()}`;
  }  else {
    query += ` ORDER BY id ${idOrder}`;
  }

  const { rows } = await pool.query(query, params);
  res.status(200).json(rows);
}));


// GET by Id
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(
   `
  SELECT 
    t.id, 
    t.title, 
    t.description, 
    t.priority, 
    t.status, 
    t.due_date, 
    t.completed_at, 
    t.created_at, 
    t.recurrence_rule, 
    t.is_featured, 
    t.featured_order,
    u.username AS user_username, 
    c.name AS category_name
  FROM tasks t
  LEFT JOIN users u ON t.user_id = u.id
  LEFT JOIN categories c ON t.category_id = c.id
  WHERE t.id = $1`,
  [id]
  );

  if (rows.length === 0) {
    throw new appError('Tasks not found', 404);
  }

  res.status(200).json(rows[0]);
}));

// POST 
router.post('/', asyncHandler(async (req, res) => {
  const { user_id, category_id, title, description, priority, status, due_date, recurrence_rule, is_featured, featured_order } = req.body;
  
  // Valori di default
  const statusValue = status || 'da_eseguire';

  // check campi obbligatori
  if (!user_id) {
    throw new appError('user_id is required', 400);
  } else {
    const { rowCount } = await pool.query('SELECT 1 FROM users WHERE id = $1', [user_id]);
    if (rowCount === 0) {
      throw new appError(`user_id ${user_id} does not exist in users table`, 400);
    }
  }

  if (!title || typeof title !== 'string') {
    throw new appError('title is required and must be a string', 400);
  }

  if (!due_date || isNaN(Date.parse(due_date))) {
    throw new appError('due_date is required and must be a valid date', 400);
  }

  // check campi opzionali
  if (category_id) {
    const { rowCount } = await pool.query('SELECT 1 FROM categories WHERE id = $1', [category_id]);
    if (rowCount === 0) {
      throw new appError(`category_id ${category_id} does not exist in categories table`, 400);
    }
  }

  if (priority !== undefined && (priority < 1 || priority > 3)) {
    throw new appError('priority must be between 1 and 3', 400);
  }

  if (status && !['da_eseguire', 'in_corso', 'eseguita'].includes(status)) {
    throw new appError('invalid status value', 400);
  }

  if (recurrence_rule && !['daily', 'weekly', 'monthly', 'yearly'].includes(recurrence_rule)) {
    throw new appError('invalid recurrence_rule value', 400);
  }

  if (is_featured === true && (featured_order < 1 || featured_order > 3)) {
    throw new appError('featured_order must be between 1 and 3 when is_featured is true', 400);
  }

  //check univocità featured_order
  if (is_featured === true) {
    const { rowCount } = await pool.query(`SELECT 1 FROM tasks WHERE is_featured = true AND featured_order = $1`, [featured_order]);
    if (rowCount > 0) {
        throw new appError(`featured_order ${featured_order} is already used`, 400);
    }
  }

  if (is_featured === false && featured_order != null) {
    throw new appError('featured_order must be null when is_featured is false', 400);
  }

  const { rows } = await pool.query(
    `INSERT INTO tasks (user_id, category_id, title, description, priority, status, due_date, recurrence_rule, is_featured, featured_order) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [user_id, category_id, title, description, priority, status, due_date, recurrence_rule, is_featured, featured_order]
  );

  res.status(201).json(rows[0]);
}));


// PUT 
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user_id, category_id, title, description, priority, status, due_date, completed_at, recurrence_rule, is_featured, featured_order } = req.body;

  // validazioni campi presenti
  if (priority !== undefined && (priority < 1 || priority > 3)) {
    throw new appError('priority must be between 1 and 3', 400);
  }

  if (status && !['da_eseguire', 'in_corso', 'eseguita'].includes(status)) {
    throw new appError('invalid status value', 400);
  }

  if (due_date && isNaN(Date.parse(due_date))) {
    throw new appError('due_date must be a valid date', 400);
  }

  if (recurrence_rule && !['daily', 'weekly', 'monthly', 'monthly', 'yearly'].includes(recurrence_rule)) {
    throw new appError('invalid recurrence_rule value', 400);
  }

  if (is_featured === true && (featured_order < 1 || featured_order > 3)) {
    throw new appError('featured_order must be between 1 and 3 when is_featured is true', 400);
  }

  const { rows } = await pool.query(
    `UPDATE tasks SET
      user_id = COALESCE($1, user_id),
      category_id = COALESCE($2, category_id),
      title = COALESCE($3, title),
      description = COALESCE($4, description),
      priority = COALESCE($5, priority),
      status = COALESCE($6, status),
      due_date = COALESCE($7, due_date),
      completed_at = COALESCE($8, completed_at),
      recurrence_rule = COALESCE($9, recurrence_rule),
      is_featured = COALESCE($10, is_featured),
      featured_order = COALESCE($11, featured_order)
    WHERE id = $12
    RETURNING *`,
    [ user_id, category_id, title, description, priority, status, due_date, completed_at, recurrence_rule, is_featured, featured_order,id ]
  );

  if (rows.length === 0) {
    throw new appError('Task not found', 404);
  }

  res.status(200).json(rows[0]);
}));

// DELETE 
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { rowCount } = await pool.query(
    'DELETE FROM tasks WHERE id = $1',
    [id]
  );

  if (rowCount === 0) {
    throw new appError('Task not found', 404);
  }

  res.status(204).send();
}));


module.exports = router;