// services/reminders.service.js
const db = require('../SQLiteDB/db');
const appError = require('../utils/appError');
const formatLocalDate = require('../utils/formatLocalDate');

/* ===================== CREATE (sempre INSERT) ===================== */
exports.createReminder = ({ task_id, remind_at }) => {

  const task = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(Number(task_id));
  
  if (!task) throw new appError("task_id does not exist", 400);

  const due = new Date(task.due_date);
  const rem = new Date(remind_at);

  if (rem > due) throw new appError("remind_at cannot be after task due_date", 400);

  const inserted = db.prepare(`
    INSERT INTO reminders (user_id, task_id, task_due_date, remind_at)
    VALUES (?, ?, ?, ?)
  `).run(
    task.user_id,
    Number(task_id),
    task.due_date,
    formatLocalDate(rem)
  );

  console.log("Insert result:", inserted);

  return db.prepare(`
    SELECT r.*, t.title AS task_title
    FROM reminders r
    JOIN tasks t ON r.task_id = t.id
    WHERE r.id = ?
  `).get(inserted.lastInsertRowid);
};


/* ===================== UPDATE ===================== */
exports.updateReminder = (id, { remind_at }) => {
  const existing = db.prepare(`SELECT * FROM reminders WHERE id = ?`).get(id);
  if (!existing) throw new appError("Reminder not found", 404);

  const due = new Date(existing.task_due_date);
  const rem = new Date(remind_at);

  if (rem > due) throw new appError("remind_at cannot be after task due_date", 400);

  db.prepare(`UPDATE reminders SET remind_at = ? WHERE id = ?`)
    .run(formatLocalDate(rem), id);

  return db.prepare(`
    SELECT r.*, t.title AS task_title
    FROM reminders r
    JOIN tasks t ON r.task_id = t.id
    WHERE r.id = ?
  `).get(id);
};


/* ===================== GET ALL ===================== */
exports.getAllReminders = (filters = {}) => {
  let q = `
    SELECT r.*, t.title AS task_title
    FROM reminders r
    JOIN tasks t ON r.task_id = t.id
  `;

  if (['asc', 'desc'].includes(filters.remind_at_order)) {
    q += ` ORDER BY r.remind_at ${filters.remind_at_order.toUpperCase()}`;
  } else {
    q += ` ORDER BY r.id ASC`;
  }

  return db.prepare(q).all();
};


/* ===================== GET SINGLE ===================== */
exports.getReminderById = (id) => {
  const r = db.prepare(`
    SELECT r.*, t.title AS task_title
    FROM reminders r
    JOIN tasks t ON r.task_id = t.id
    WHERE r.id = ?
  `).get(id);

  if (!r) throw new appError("Reminder not found", 404);
  return r;
};


/* ===================== GET BY USER ===================== */
exports.getReminderByUserId = (user_id, is_sent = null) => {

  let q = `
    SELECT r.*, t.title AS task_title
    FROM reminders r
    JOIN tasks t ON r.task_id = t.id
    WHERE r.user_id = ?
  `;

  const p = [user_id];

  if (is_sent !== null) {
    if (![0, 1].includes(is_sent)) {
      throw new appError("is_sent must be 0 or 1", 400);
    }
    q += ` AND r.is_sent = ?`;
    p.push(is_sent);
  }

  return db.prepare(q).all(...p);
};


/* ===================== GET BY TASK (lista completa) ===================== */
exports.getReminderByTask = (task_id, is_sent = null) => {

  let q = `
    SELECT r.*, t.title AS task_title
    FROM reminders r
    JOIN tasks t ON r.task_id = t.id
    WHERE r.task_id = ?
  `;

  const p = [task_id];

  if (is_sent !== null) {
    if (![0, 1].includes(is_sent)) {
      throw new appError("is_sent must be 0 or 1", 400);
    }
    q += ` AND r.is_sent = ?`;
    p.push(is_sent);
  }

  return db.prepare(q).all(...p);
};


/* ===================== DELETE ===================== */
exports.deleteReminder = (id) => {
  const r = db.prepare(`DELETE FROM reminders WHERE id = ?`).run(id);
  if (r.changes === 0) throw new appError("Reminder not found", 404);
};