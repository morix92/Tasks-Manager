const db = require('../SQLiteDB/db');
const appError = require('../utils/appError');
const { generateReminders } = require('../services/reminders.service');
const formatLocalDate = require('../utils/formatLocalDate');

/* ===================== GET ALL ===================== */
exports.getAllTasks = (filters = {}) => {
  const {
    username,
    title,
    priority,
    status,
    categoryName,
    due_date_order,
    order
  } = filters;

  let query = `
    SELECT 
      t.*,
      u.username AS user_username,
      c.name AS category_name,
      c.color AS category_color
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
      c.name AS category_name,
      c.color AS category_color
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

/* ===================== GET BY USER-ID ===================== */
exports.getTaskByUserId = (user_id, status) => {

  let query = 'SELECT t.*, c.name AS category_name, c.color AS category_color FROM tasks t LEFT JOIN categories c ON t.category_id = c.id WHERE t.user_id = ?'
  const params = [user_id];

  if (status !== null) {
    if (![0,1,2].includes(status)) {
      throw new appError('Inserire valori accettati (0 - 2) per il parametro status', 400);
    }
    query += ' AND status = ?';
    params.push(status);
  }
  
  const tasks = db.prepare(query).all(...params);
  return tasks;
};

/* ===================== COMPLETA TASK ===================== */
exports.completeTask = (id) => {
  const task = db.prepare(`
    SELECT * FROM tasks WHERE id = ?
  `).get(id);

  if (!task) {
    throw new appError('Task not found', 404);
  }

  const now = formatLocalDate(new Date());

  db.prepare(`
    UPDATE tasks SET status = 1, completed_at = ? WHERE id = ?
  `).run(now,id);

  const completedTask = db
    .prepare(`
      SELECT 
        t.*,
        u.username AS user_username,
        c.name AS category_name,
        c.color AS category_color
      FROM tasks t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `)
    .get(id);
  
  if (completedTask.status === 1){
    deleteTaskReminders(id);
  }
  
  return completedTask;
};

/* ===================== CREAZIONE REMINDERS ===================== */
function createReminders(task) {
  if (task.exact_remind_at) {
    db.prepare(`
      INSERT INTO reminders (user_id, task_id, task_title, task_due_date, remind_at)
      VALUES (?,?,?,?,?)
    `).run(
      task.user_id,
      task.id,
      task.title,
      task.due_date,
      task.exact_remind_at
    );
  } else if (task.recurrence_rule) {
    const dates = generateReminders(task.due_date, task.recurrence_rule, task.recurrence_interval);
    for (const remindAt of dates) {
      db.prepare(`
        INSERT INTO reminders (user_id, task_id, task_title, task_due_date, remind_at)
        VALUES (?,?,?,?,?)
      `).run(
        task.user_id,
        task.id,
        task.title,
        task.due_date,
        remindAt
      );
    }
  }
}

/* ===================== RECREAZIONE REMINDERS ===================== */
function recreateReminders(task) {
  db.prepare('DELETE FROM reminders WHERE task_id = ?').run(task.id);
  createReminders(task);
}

/* ===================== ELIMINA REMINDERS ===================== */
function deleteTaskReminders(taskId) {
  db.prepare('DELETE FROM reminders WHERE task_id = ?').run(taskId);
}

/* ===================== CREATE TASKS ===================== */
exports.createTask = (data) => {
  const {
    user_id,
    category_id,
    title,
    description,
    priority,
    due_date,
    exact_remind_at,
    recurrence_rule,
    recurrence_interval
  } = data;

  if (category_id) {
    const exists = db.prepare('SELECT 1 FROM categories WHERE id = ?').get(category_id);
    if (!exists) throw new appError(`category_id ${category_id} does not exist`, 400);
  }

  const now = formatLocalDate(new Date());

  const result = db.prepare(`
    INSERT INTO tasks (
      user_id, category_id, title, description, priority,
      due_date, exact_remind_at, recurrence_rule, recurrence_interval, created_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?)
  `).run(
    user_id,
    category_id,
    title,
    description,
    priority,
    due_date ?? null, 
    exact_remind_at ?? null,
    recurrence_rule,
    recurrence_interval,
    now
  );

  const task = db.prepare(`
    SELECT 
      t.*,
      u.username AS user_username,
      c.name AS category_name,
      c.color AS category_color
    FROM tasks t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id = ?
  `).get(result.lastInsertRowid);

  createReminders(task);
  return task;
};

/* ===================== UPDATE TASKS ===================== */

exports.updateTask = (id, data) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!task) throw new appError('Task not found', 404);

  db.prepare(`
    UPDATE tasks SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      priority = COALESCE(?, priority),
      category_id = COALESCE(?, category_id)
    WHERE id = ?
  `).run(
    data.title,
    data.description,
    data.priority,
    data.category_id,
    id
  );

  const updatedTask = db.prepare(`
    SELECT 
      t.*,
      u.username AS user_username,
      c.name AS category_name,
      c.color AS category_color
    FROM tasks t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id = ?
  `).get(id);

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
