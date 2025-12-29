const express = require('express');
const router = express.Router();
const pool = require('../pool');
const asyncHandler = require('../utils/asyncHandler');
const appError = require('../utils/appError');
const { generateReminders } = require('../reminder.service');

// GET All + Filtri
router.get('/', asyncHandler(async (req, res) => {
  const { username, title, priority, status, categoryName, due_date_order, featured_order, order } = req.query;

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
    t.exact_remind_at, 
    t.recurrence_rule,
    t.recurrence_interval,
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

  if (status) {
    conditions.push(`status = $${params.length + 1}`);
    params.push(status);
  }

  if (categoryName) {
    conditions.push(`c.name = $${params.length + 1}`);
    params.push(categoryName);
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
    t.exact_remind_at, 
    t.recurrence_rule,
    t.recurrence_interval,
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
  const { user_id, category_id, title, description, priority, status, due_date, exact_remind_at, recurrence_rule, recurrence_interval, is_featured, featured_order } = req.body;
  
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

  if (status && !['da_eseguire', 'in_corso', 'eseguita'].includes(status)) {
    throw new appError('invalid status value', 400);
  }

  if (!title || typeof title !== 'string') {
    throw new appError('title is required and must be a string', 400);
  }

  if (!due_date || isNaN(Date.parse(due_date))) {
    throw new appError('due_date is required and must be a valid date', 400);
  }

  if (!recurrence_rule && !exact_remind_at) {
      throw new appError('recurrence_rule OR exact_remind_at is required', 400);
  }

  if ( exact_remind_at && recurrence_rule) {
      throw new appError('Cannot use exact_remind_at together with recurrence_rule', 400);
  }

  if (exact_remind_at && recurrence_interval) {
      throw new appError('Cannot use exact_remind_at together with recurrence_interval', 400);
  }

  if (recurrence_rule && !recurrence_interval) {
    throw new appError('recurrence_interval is required if recurrence_rule is set.', 400);
  }

  if (!recurrence_rule && recurrence_interval) {
    throw new appError('recurrence_rule is required if recurrence_interval is set.', 400);
  }

  if (exact_remind_at && isNaN(Date.parse(exact_remind_at))) {
    throw new appError('exact_remind_at must be a valid date', 400);
  }

  if (recurrence_rule && !['hourly', 'daily', 'weekly', 'monthly', 'yearly'].includes(recurrence_rule)) {
      throw new appError('recurrence_rule must be a valid recurrence_rule', 400);
  }

  if (recurrence_interval && recurrence_interval < 1) {
    throw new appError('recurrence_interval must be >= 1', 400);
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
    `INSERT INTO tasks (user_id, category_id, title, description, priority, status, due_date, exact_remind_at, recurrence_rule, recurrence_interval, is_featured, featured_order) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [user_id, category_id, title, description, priority, statusValue, due_date, exact_remind_at, recurrence_rule, recurrence_interval, is_featured, featured_order]
  );

  // Creazione dei reminders 
  const task = rows[0];

  if (exact_remind_at) {
    // Flusso reminder singolo
    await pool.query(
      `INSERT INTO reminders (task_id, due_date_task, remind_at) VALUES ($1, $2, $3)`,
      [task.id, task.due_date, exact_remind_at]
    );
  } else if (recurrence_rule) {
    // Flusso reminder multipli
    const reminderDates = generateReminders(due_date, recurrence_rule, recurrence_interval);
    for (const remindAt of reminderDates) {
      await pool.query(
        `INSERT INTO reminders (task_id, due_date_task, remind_at) VALUES ($1, $2, $3)`,
        [task.id, task.due_date, remindAt]
      );
    }
  }

  res.status(201).json(rows[0]);
}));

// PUT 
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user_id, category_id, title, description, priority, status, due_date, exact_remind_at, recurrence_rule, recurrence_interval, is_featured, featured_order } = req.body;

  // Valori di Default
  isReminderEdit = true;

  // check campi opzionali
  if (priority !== undefined && (priority < 1 || priority > 3)) {
    throw new appError('priority must be between 1 and 3', 400);
  }

  if (status && !['da_eseguire', 'in_corso', 'eseguita'].includes(status)) {
    throw new appError('invalid status value', 400);
  }

  if (due_date && isNaN(Date.parse(due_date))) {
    throw new appError('due_date must be a valid date', 400);
  }

  if (exact_remind_at && recurrence_rule) {
      throw new appError('Cannot use exact_remind_at together with recurrence_rule', 400);
  }
  if (exact_remind_at && recurrence_interval) {
      throw new appError('Cannot use exact_remind_at together with recurrence_interval', 400);
  }

  if (exact_remind_at && isNaN(Date.parse(exact_remind_at))) {
    throw new appError('exact_remind_at must be a valid date', 400);
  }

  if (recurrence_rule && !['hourly', 'daily', 'weekly', 'monthly', 'yearly'].includes(recurrence_rule)) {
    throw new appError('recurrence_rule must be a valid recurrence_rule', 400);
  }

  if (recurrence_interval && recurrence_interval < 1) {
    throw new appError('recurrence_interval must be >= 1', 400);
  }

  if (is_featured === true && (featured_order < 1 || featured_order > 3)) {
    throw new appError('featured_order must be between 1 and 3 when is_featured is true', 400);
  }

  let recurrence_rule_new;
  let recurrence_interval_new;
  let exact_remind_at_new;

  const task = await pool.query('SELECT due_date, exact_remind_at, recurrence_rule, recurrence_interval FROM tasks WHERE id = $1', [id]);
  
  if (task.rows.length === 0) {
    throw new appError('Task not found', 404);
  }

  if (exact_remind_at) {
    recurrence_rule_new = null;
    recurrence_interval_new = null;
    exact_remind_at_new = exact_remind_at;
  }

  if (recurrence_rule || recurrence_interval) {
    if (recurrence_rule && !recurrence_interval) {
      recurrence_rule_new = recurrence_rule;
      recurrence_interval_new = task.rows[0].recurrence_interval;
    } else if (!recurrence_rule && recurrence_interval) {
      recurrence_rule_new = task.rows[0].recurrence_rule;
      recurrence_interval_new = recurrence_interval;
    } else {
      recurrence_rule_new = recurrence_rule;
      recurrence_interval_new = recurrence_interval;
    }
    exact_remind_at_new = null;
  }

  if (!exact_remind_at && !recurrence_rule && !recurrence_interval) {
    exact_remind_at_new = task.rows[0].exact_remind_at;
    recurrence_rule_new = task.rows[0].recurrence_rule;
    recurrence_interval_new = task.rows[0].recurrence_interval;

    if (due_date && new Date(due_date).getTime() !== new Date(task.rows[0].due_date).getTime()) {
        console.log("due_date di input diversa dalla due_date esistente di questo task - i reminder verranno aggiornati");
    } else {
      isReminderEdit = false;
    }
  }

  // Modifica tasks
  const { rows } = await pool.query(
    `UPDATE tasks SET
      user_id = COALESCE($1, user_id),
      category_id = COALESCE($2, category_id),
      title = COALESCE($3, title),
      description = COALESCE($4, description),
      priority = COALESCE($5, priority),
      status = COALESCE($6, status),
      due_date = COALESCE($7, due_date),
      exact_remind_at = $8,
      recurrence_rule = $9,
      recurrence_interval = $10,
      is_featured = COALESCE($11, is_featured),
      featured_order = COALESCE($12, featured_order)
    WHERE id = $13
    RETURNING *`,
    [ user_id, category_id, title, description, priority, status, due_date, exact_remind_at_new, recurrence_rule_new, recurrence_interval_new, is_featured, featured_order, id ]
  );

  if (rows.length === 0) {
    throw new appError('Task not found', 404);
  }

  const updatedTask = rows[0];

  if (isReminderEdit){

      // Flusso reminder singolo
    if (updatedTask.exact_remind_at) {
      await pool.query('DELETE FROM reminders WHERE task_id = $1', [id]);
      await pool.query(`INSERT INTO reminders (task_id, due_date_task, remind_at) VALUES ($1, $2, $3)`, [id, updatedTask.due_date, updatedTask.exact_remind_at]);
  
      // Flusso reminder multipli
    } else if (updatedTask.recurrence_rule && updatedTask.recurrence_interval)  {
      await pool.query('DELETE FROM reminders WHERE task_id = $1', [id]);
      const reminderDates = generateReminders(updatedTask.due_date, updatedTask.recurrence_rule, updatedTask.recurrence_interval);
      for (const remindAt of reminderDates) {
        await pool.query(`INSERT INTO reminders (task_id, due_date_task, remind_at) VALUES ($1, $2, $3)`, [id, updatedTask.due_date, remindAt]);
      }
    }

  } else {
    console.log(`Task modificato senza modificare i Reminder`)
  }



  res.status(200).json(updatedTask);
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