const db = require('../SQLiteDB/db');
const appError = require('../utils/appError');
const { generateReminders } = require('../services/reminders.service');

/* ===================== GET ALL ===================== */
exports.getAllTasks = (filters = {}) => {
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

  const conditions = [];
  const params = [];

  if (username) {
    conditions.push('u.username LIKE ?');
    params.push(`%${username}%`);
  }

  if (title) {
    conditions.push('t.title LIKE ?');
    params.push(`%${title}%`);
  }

  if (priority) {
    conditions.push('t.priority = ?');
    params.push(priority);
  }

  if (status) {
    conditions.push('t.status = ?');
    params.push(status);
  }

  if (categoryName) {
    conditions.push('c.name = ?');
    params.push(categoryName);
  }

  if (conditions.length) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  if (['asc', 'desc'].includes(due_date_order)) {
    query += ` ORDER BY t.due_date ${due_date_order.toUpperCase()}`;
  } else if (['asc', 'desc'].includes(featured_order)) {
    query += ` ORDER BY t.featured_order ${featured_order.toUpperCase()}`;
  } else {
    query += ` ORDER BY t.id ${order === 'desc' ? 'DESC' : 'ASC'}`;
  }

  return db.prepare(query).all(...params);
};

/* ===================== GET BY ID ===================== */
exports.getTaskById = (id) => {
  const task = db.prepare(`
    SELECT 
      t.*,
      u.username AS user_username,
      c.name AS category_name
    FROM tasks t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id = ?
  `).get(id);

  if (!task) {
    throw new appError('Task not found', 404);
  }

  return task;
};

/* ===================== CREATE ===================== */
exports.createTask = (data) => {
  const {
    user_id,
    category_id,
    title,
    description,
    priority,
    status = 'da_eseguire',
    due_date,
    exact_remind_at,
    recurrence_rule,
    recurrence_interval,
    is_featured,
    featured_order
  } = data;

  if (category_id) {
    const exists = db
      .prepare('SELECT 1 FROM categories WHERE id = ?')
      .get(category_id);

    if (!exists) {
      throw new appError(
        `category_id ${category_id} does not exist`,
        400
      );
    }
  }

  if (is_featured === true) {
    const used = db.prepare(`
      SELECT 1 FROM tasks
      WHERE is_featured = 1 AND featured_order = ?
    `).get(featured_order);

    if (used) {
      throw new appError(
        `featured_order ${featured_order} is already used`,
        400
      );
    }
  }

  const result = db.prepare(`
    INSERT INTO tasks (
      user_id, category_id, title, description, priority, status,
      due_date, exact_remind_at, recurrence_rule, recurrence_interval,
      is_featured, featured_order
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    user_id,
    category_id,
    title,
    description,
    priority,
    status,
    due_date,
    exact_remind_at,
    recurrence_rule,
    recurrence_interval,
    is_featured ? 1 : 0,
    featured_order
  );

  const task = db
    .prepare('SELECT * FROM tasks WHERE id = ?')
    .get(result.lastInsertRowid);

  createReminders(task);
  return task;
};

/* ===================== UPDATE ===================== */
exports.updateTask = (id, data) => {
  const task = db.prepare(`
    SELECT * FROM tasks WHERE id = ?
  `).get(id);

  if (!task) {
    throw new appError('Task not found', 404);
  }

  db.prepare(`
    UPDATE tasks SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      priority = COALESCE(?, priority),
      status = COALESCE(?, status),
      due_date = COALESCE(?, due_date),
      exact_remind_at = COALESCE(?, exact_remind_at),
      recurrence_rule = COALESCE(?, recurrence_rule),
      recurrence_interval = COALESCE(?, recurrence_interval),
      is_featured = COALESCE(?, is_featured),
      featured_order = COALESCE(?, featured_order)
    WHERE id = ?
  `).run(
    data.title,
    data.description,
    data.priority,
    data.status,
    data.due_date,
    data.exact_remind_at,
    data.recurrence_rule,
    data.recurrence_interval,
    data.is_featured,
    data.featured_order,
    id
  );

  const updatedTask = db
    .prepare('SELECT * FROM tasks WHERE id = ?')
    .get(id);

  recreateReminders(updatedTask);
  return updatedTask;
};

/* ===================== DELETE ===================== */
exports.deleteTask = (id) => {
  const result = db
    .prepare('DELETE FROM tasks WHERE id = ?')
    .run(id);

  if (result.changes === 0) {
    throw new appError('Task not found', 404);
  }
};

/* ===================== FUNZIONI INTERNE ===================== */

function formatDateForSQLite(date) {
  return new Date(date).toISOString().replace('T', ' ').slice(0, 19);
}

function createReminders(task) {
  if (task.exact_remind_at) {
    db.prepare(`
      INSERT INTO reminders (task_id, task_title, task_due_date, remind_at)
      VALUES (?,?,?,?)
    `).run(
      task.id,
      task.title,
      formatDateForSQLite(task.due_date),
      formatDateForSQLite(task.exact_remind_at)
    );
  } else if (task.recurrence_rule) {
    const dates = generateReminders(
      formatDateForSQLite(task.due_date),
      task.recurrence_rule,
      task.recurrence_interval
    );

    for (const remindAt of dates) {
      db.prepare(`
        INSERT INTO reminders (task_id, task_title, task_due_date, remind_at)
        VALUES (?,?,?,?)
      `).run(
        task.id,
        task.title,
        formatDateForSQLite(task.due_date),
        formatDateForSQLite(remindAt)
      );
    }
  }
}

function recreateReminders(task) {
  db.prepare('DELETE FROM reminders WHERE task_id = ?')
    .run(task.id);
  createReminders(task);
}
