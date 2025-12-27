const express = require('express');
const router = express.Router();
const pool = require('../pool');
const asyncHandler = require('../utils/asyncHandler');
const appError = require('../utils/appError');

// GET ALL
router.get('/', asyncHandler(async (req, res) => {
  
  const { remind_at_order, order } = req.query;
  let query = `SELECT * FROM reminders`

  // gestione ordine (default: Id - ASC)
  const idOrder = order === 'desc' ? 'DESC' : 'ASC';

  if (remind_at_order === 'asc' || remind_at_order === 'desc') {
      query += ` ORDER BY remind_at ${remind_at_order.toUpperCase()}`;
  }  else {
      query += ` ORDER BY id ${idOrder}`;
  }

  const { rows } = await pool.query(query);
  res.status(200).json(rows);

}));

// GET by Id
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(
    'SELECT * FROM reminders WHERE id = $1',
    [id]
  );

  if (rows.length === 0) {
    throw new appError('Reminders not found', 404);
  }

  res.status(200).json(rows[0]);
}));

// POST - Create reminders
router.post('/', asyncHandler(async (req, res) => {
  const { task_id, remind_at } = req.body;

  // check campi obbligatori
  if (!task_id) {
    throw new appError('Id Task is required', 400);
  } else {
    const { rowCount } = await pool.query('SELECT 1 FROM tasks WHERE id = $1', [task_id]);
    if (rowCount === 0) {
      throw new appError(`task_id ${task_id} does not exist in tasks table`, 400);
    }
  }

  if (!remind_at) {
    throw new appError('Reminder date is required', 400);
  }

  const { rows } = await pool.query(
    `INSERT INTO reminders (task_id, remind_at) VALUES ($1, $2) RETURNING *`,
    [task_id, remind_at]
  );

  res.status(201).json(rows[0]);
}));


// PUT - Update reminders
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { remind_at } = req.body;

  const { rows } = await pool.query(
    `UPDATE reminders
     SET
       remind_at = COALESCE($1, remind_at)
     WHERE id = $2
     RETURNING *`,
    [remind_at, id]
  );

  if (rows.length === 0) {
    throw new appError('Reminders not found', 404);
  }

  res.status(202).json(rows[0]);
}));


// DELETE - Remove reminders
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { rowCount } = await pool.query(
    'DELETE FROM reminders WHERE id = $1',
    [id]
  );

  if (rowCount === 0) {
    throw new appError('Reminders not found', 404);
  }

  res.status(204).send();
}));


module.exports = router;