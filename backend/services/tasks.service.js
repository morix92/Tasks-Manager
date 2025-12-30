const pool = require('../pool');
const appError = require('../utils/appError');
const { generateReminders } = require('../services/reminders.service')

/* ===================== GET ALL ===================== */
exports.getAllTasks = async (filters) => {
  const {
    username,
    title,
    priority,
    status,
    categoryName,
    due_date_order,
    featured_order,
    order
  } = filters;

  let query = `
    SELECT 
      t.id, t.title, t.description, t.priority, t.status,
      t.due_date, t.completed_at, t.created_at,
      t.exact_remind_at, t.recurrence_rule, t.recurrence_interval,
      t.is_featured, t.featured_order,
      u.username AS user_username,
      c.name AS category_name
    FROM tasks t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN categories c ON t.category_id = c.id
  `;

  const params = [];
  const conditions = [];

  if (username) {
    conditions.push(`u.username ILIKE $${params.length + 1}`);
    params.push(`%${username}%`);
  }

  if (title) {
    conditions.push(`t.title ILIKE $${params.length + 1}`);
    params.push(`%${title}%`);
  }

  if (priority) {
    conditions.push(`t.priority = $${params.length + 1}`);
    params.push(priority);
  }

  if (status) {
    conditions.push(`t.status = $${params.length + 1}`);
    params.push(status);
  }

  if (categoryName) {
    conditions.push(`c.name = $${params.length + 1}`);
    params.push(categoryName);
  }

  if (conditions.length) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  const idOrder = order === 'desc' ? 'DESC' : 'ASC';

  if (['asc', 'desc'].includes(due_date_order)) {
    query += ` ORDER BY t.due_date ${due_date_order.toUpperCase()}`;
  } else if (['asc', 'desc'].includes(featured_order)) {
    query += ` ORDER BY t.featured_order ${featured_order.toUpperCase()}`;
  } else {
    query += ` ORDER BY t.id ${idOrder}`;
  }

  const { rows } = await pool.query(query, params);
  return rows;
};

/* ===================== GET BY ID ===================== */
exports.getTaskById = async (id) => {
  const { rows } = await pool.query(
    `
    SELECT 
      t.*, 
      u.username AS user_username,
      c.name AS category_name
    FROM tasks t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id = $1
    `,
    [id]
  );

  if (!rows.length) {
    throw new appError('Task not found', 404);
  }

  return rows[0];
};

/* ===================== CREATE ===================== */
exports.createTask = async (data) => {
  const {user_id, category_id ,title ,description ,priority ,status = 'da_eseguire', due_date, exact_remind_at, recurrence_rule, recurrence_interval, is_featured, featured_order} = data;

  if (category_id) {
    const { rowCount } = await pool.query('SELECT 1 FROM categories WHERE id = $1', [category_id]);
    if (rowCount === 0) {
      throw new appError(`category_id ${category_id} does not exist in categories table`, 400);
    }
  }

  if (is_featured === true) {
    const { rowCount } = await pool.query(`SELECT 1 FROM tasks WHERE is_featured = true AND featured_order = $1`, [featured_order]);
    if (rowCount > 0) {
        throw new appError(`featured_order ${featured_order} is already used`, 400);
    }
  }

  const { rows } = await pool.query(
    `
    INSERT INTO tasks
    (user_id, category_id, title, description, priority, status,
     due_date, exact_remind_at, recurrence_rule, recurrence_interval,
     is_featured, featured_order)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING *
    `,
    [user_id,category_id,title,description,priority,status,due_date,exact_remind_at,recurrence_rule,recurrence_interval,is_featured,featured_order]
  );

  const task = rows[0];

  await createReminders(task);
  return task;
};

/* ===================== UPDATE ===================== */
exports.updateTask = async (id, data) => {
  const task = await pool.query(
    'SELECT due_date, exact_remind_at, recurrence_rule, recurrence_interval FROM tasks WHERE id = $1',
    [id]
  );

  if (!task.rows.length) {
    throw new appError('Task not found', 404);
  }

  isReminderEdit = true;

  let recurrence_rule_new;
  let recurrence_interval_new;

  if (data.recurrence_rule && data.recurrence_interval) {
    if (data.recurrence_rule && !data.recurrence_interval) {
      recurrence_rule_new = data.recurrence_rule;
      recurrence_interval_new = task.rows[0].recurrence_interval;
    } else if (!data.recurrence_rule && data.recurrence_interval) {
      recurrence_rule_new = task.rows[0].recurrence_rule;
      recurrence_interval_new = data.recurrence_interval;
    } else {
      recurrence_rule_new = data.recurrence_rule;
      recurrence_interval_new = data.recurrence_interval;
    }
  }

  const updated = await pool.query(
    `
    UPDATE tasks SET
      title = COALESCE($1, title),
      description = COALESCE($2, description),
      priority = COALESCE($3, priority),
      status = COALESCE($4, status),
      due_date = COALESCE($5, due_date),
      exact_remind_at = COALESCE($6, exact_remind_at),
      recurrence_rule = COALESCE($7, recurrence_rule),
      recurrence_interval = COALESCE($8, recurrence_interval),
      is_featured = COALESCE($9, is_featured),
      featured_order = COALESCE($10, featured_order)
    WHERE id = $11
    RETURNING *
    `,
    [data.title, data.description, data.priority, data.status, data.due_date, data.exact_remind_at, data.recurrence_rule, data.recurrence_interval, data.is_featured, data.featured_order, id]
  );

  if (isReminderEdit) {
    await recreateReminders(updated.rows[0]);
  }
  
  return updated.rows[0];
};

/* ===================== DELETE ===================== */
exports.deleteTask = async (id) => {
  const { rowCount } = await pool.query(
    'DELETE FROM tasks WHERE id = $1',
    [id]
  );

  if (!rowCount) {
    throw new appError('Task not found', 404);
  }
};

/* ===================== FUNZIONE INTERNA ===================== */
async function createReminders(task) {
  if (task.exact_remind_at) {
    await pool.query(
      'INSERT INTO reminders (task_id, due_date_task, remind_at) VALUES ($1,$2,$3)',
      [task.id, task.due_date, task.exact_remind_at]
    );
  } else if (task.recurrence_rule) {
    const reminderDates = generateReminders(task.due_date, task.recurrence_rule, task.recurrence_interval);
    for (const remindAt of reminderDates) {
      await pool.query(
        'INSERT INTO reminders (task_id, due_date_task, remind_at) VALUES ($1,$2,$3)',
        [task.id, task.due_date, remindAt]
      );
    }
  } else {
     console.log("Reminder non creati. Il task non prevede notidica")
  }
}

async function recreateReminders(task) {
  await pool.query('DELETE FROM reminders WHERE task_id = $1', [task.id]);
  await createReminders(task);
}
