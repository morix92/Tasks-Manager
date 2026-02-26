// services/tasks.service.js
const db = require('../SQLiteDB/db');
const appError = require('../utils/appError');
const formatLocalDate = require('../utils/formatLocalDate');
const { createReminder } = require('./reminders.service');

/* ============ Ricorrenze util ============ */
function nextDate(date, rule, interval) {
  const d = new Date(date);
  switch (rule) {
    case 'hourly': d.setHours(d.getHours() + interval); break;
    case 'daily': d.setDate(d.getDate() + interval); break;
    case 'weekly': d.setDate(d.getDate() + interval * 7); break;
    case 'monthly': d.setMonth(d.getMonth() + interval); break;
    case 'yearly': d.setFullYear(d.getFullYear() + interval); break;
    default: throw new appError("Invalid recurrence_rule", 400);
  }
  return d;
}

function generateDates(start, rule, interval, occurrences) {
  const result = [];
  let curr = new Date(start);
  for (let i = 0; i < occurrences; i++) {
    result.push(formatLocalDate(curr));
    curr = nextDate(curr, rule, interval);
  }
  return result;
}

/* ===================== GET ALL ===================== */
exports.getAllTasks = (filters = {}) => {
  let q = `
    SELECT t.*, 
      u.username AS user_username,
      c.name AS category_name,
      c.color AS category_color
    FROM tasks t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN categories c ON t.category_id = c.id
  `;

  const cond = [];
  const params = [];

  if (filters.username) { cond.push(`u.username LIKE ?`); params.push(`%${filters.username}%`); }
  if (filters.title) { cond.push(`t.title LIKE ?`); params.push(`%${filters.title}%`); }
  if (filters.priority) { cond.push(`t.priority = ?`); params.push(filters.priority); }
  if (filters.status !== undefined) { cond.push(`t.status = ?`); params.push(filters.status); }
  if (filters.categoryName) { cond.push(`c.name = ?`); params.push(filters.categoryName); }

  if (cond.length) q += " WHERE " + cond.join(" AND ");

  if (['asc', 'desc'].includes(filters.due_date_order)) {
    q += ` ORDER BY t.due_date ${filters.due_date_order.toUpperCase()}`;
  } else {
    q += ` ORDER BY t.id ASC`;
  }

  return db.prepare(q).all(...params);
};

/* ===================== GET BY ID ===================== */
exports.getTaskById = (id) => {
  const t = db.prepare(`
    SELECT t.*, 
      u.username AS user_username,
      c.name AS category_name,
      c.color AS category_color
    FROM tasks t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id = ?
  `).get(id);

  if (!t) throw new appError("Task not found", 404);
  return t;
};

/* ===================== GET BY USER ===================== */
exports.getTaskByUserId = (user_id, status = null) => {
  let q = `
    SELECT t.*, c.name AS category_name, c.color AS category_color
    FROM tasks t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ?
  `;
  const p = [user_id];

  if (status !== null) {
    if (![0,1,2].includes(status)) throw new appError("Invalid status", 400);
    q += " AND status = ?";
    p.push(status);
  }

  return db.prepare(q).all(...p);
};

/* ===================== CREATE TASK(S) ===================== */
exports.createTask = (data) => {
  const {
    user_id, category_id, title, description,
    priority, due_date, exact_remind_at,
    remind_offset_minutes, recurrence_rule,
    recurrence_interval = 1, occurrences = 1
  } = data;
  
  const baseDue = new Date(due_date);

  let offset = null;
  if (exact_remind_at) {
    const r = new Date(exact_remind_at);
    if (r > baseDue) throw new appError("Invalid reminder", 400);
    offset = baseDue - r;
  } else if (remind_offset_minutes != null) {
    offset = Math.max(0, remind_offset_minutes) * 60000;
  }

  const dates = recurrence_rule
    ? generateDates(baseDue, recurrence_rule, recurrence_interval, occurrences)
    : [formatLocalDate(baseDue)];

  const now = formatLocalDate(new Date());
  const insert = db.prepare(`
    INSERT INTO tasks (user_id, category_id, title, description, priority, status, due_date, created_at)
    VALUES (?, ?, ?, ?, ?, 0, ?, ?)
  `);

  const results = [];

  for (let dd of dates) {
    const result = insert.run(
      user_id,
      category_id ?? null,
      title,
      description ?? null,
      priority ?? null,
      dd,
      now
    );
    
    const taskId = result.lastInsertRowid;
    const task = exports.getTaskById(taskId);

    if (offset !== null) {
      const remindAt = new Date(dd);
      remindAt.setTime(remindAt.getTime() - offset);
      createReminder({ task_id: taskId, remind_at: remindAt });
    }

    results.push(task);
  }

  return recurrence_rule ? results : results[0];
};

/* ===================== UPDATE TASK ===================== */
exports.updateTask = (id, data) => {
  const existing = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id);
  if (!existing) throw new appError("Task not found", 404);

  db.prepare(`
    UPDATE tasks SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      priority = COALESCE(?, priority),
      category_id = COALESCE(?, category_id)
    WHERE id = ?
  `)
  .run(
    data.title,
    data.description,
    data.priority,
    data.category_id,
    id
  );

  return exports.getTaskById(id);
};

/* ===================== COMPLETE TASK ===================== */
exports.completeTask = (id) => {
  const t = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id);
  if (!t) throw new appError("Task not found", 404);

  const now = formatLocalDate(new Date());
  db.prepare(`UPDATE tasks SET status = 1, completed_at = ? WHERE id = ?`)
    .run(now, id);

  db.prepare(`DELETE FROM reminders WHERE task_id = ?`).run(id);

  return exports.getTaskById(id);
};

/* ===================== DELETE TASK ===================== */
exports.deleteTask = (id) => {
  const r = db.prepare(`DELETE FROM tasks WHERE id = ?`).run(id);
  if (r.changes === 0) throw new appError("Task not found", 404);
};