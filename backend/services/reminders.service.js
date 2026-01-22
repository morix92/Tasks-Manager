const db = require('../SQLiteDB/db');
const appError = require('../utils/appError');
const formatLocalDate = require('../utils/formatLocalDate');

/* ===================== GENERA REMINDERS ===================== */
function generateReminders(dueDate, rule, interval = 1) {
  const reminders = [];
  let current = new Date(dueDate.replace(' ', 'T'));
  const now = Date.now();

  while (current.getTime() > now) {
    reminders.push(formatLocalDate(current));

    switch (rule) {
      case 'hourly':
        current.setHours(current.getHours() - interval);
        break;
      case 'daily':
        current.setDate(current.getDate() - interval);
        break;
      case 'weekly':
        current.setDate(current.getDate() - interval * 7);
        break;
      case 'monthly':
        current.setMonth(current.getMonth() - interval);
        break;
      case 'yearly':
        current.setFullYear(current.getFullYear() - interval);
        break;
      default:
        throw new Error(`Unsupported rule: ${rule}`);
    }
  }

  return reminders
}
exports.generateReminders = generateReminders;

/* ===================== GET ALL ===================== */
exports.getAllReminders = ({ remind_at_order, order }) => {
  let query = 'SELECT * FROM reminders';

  if (['asc', 'desc'].includes(remind_at_order)) {
    query += ` ORDER BY remind_at ${remind_at_order.toUpperCase()}`;
  } else {
    query += ` ORDER BY id ${order === 'desc' ? 'DESC' : 'ASC'}`;
  }

  return db.prepare(query).all();
};

/* ===================== GET BY ID ===================== */
exports.getReminderById = (id) => {
  const reminder = db
    .prepare('SELECT * FROM reminders WHERE id = ?')
    .get(id);

  if (!reminder) {
    throw new appError('Reminder not found', 404);
  }

  return reminder;
};

/* ===================== GET BY USER ===================== */
exports.getReminderByUserId = (user_id, is_sent = null) => {
  let query = 'SELECT * FROM reminders WHERE user_id = ?';
  const params = [user_id];

  if (is_sent !== null) {
    if (![0, 1].includes(is_sent)) {
      throw new appError('Inserire valori accettati (0 - 1)', 400);
    }
    query += ' AND is_sent = ?';
    params.push(is_sent);
  }

  return db.prepare(query).all(...params);
};

/* ===================== GET REMINDER BY TASK ===================== */
exports.getReminderByTask = (task_id, limit = true) => {
  let query = 'SELECT * FROM reminders WHERE is_sent = 0 AND task_id = ? ORDER BY remind_at ASC';
  const params = [task_id];

  if (limit) query += ' LIMIT 1';

  const reminder = db.prepare(query).all(...params);
  return reminder;
};

/* ===================== CREATE ===================== */
exports.createReminder = ({ task_id, remind_at }) => {
  const task = db
    .prepare('SELECT user_id, title, due_date FROM tasks WHERE id = ?')
    .get(task_id);

  if (!task) throw new appError(`task_id ${task_id} does not exist`, 400);

  const dueDate  = new Date(task.due_date);
  const remindAtDate = new Date(remind_at);
  if (remindAtDate.getTime() > dueDate.getTime()) throw new appError('remind_at cannot be after the task due_date', 400);

  const result = db
    .prepare(`
      INSERT INTO reminders (user_id, task_id, task_title, task_due_date, remind_at)
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(
      task.user_id,
      task_id,
      task.title,
      task.due_date,
      remind_at
    );

  return db
    .prepare('SELECT * FROM reminders WHERE id = ?')
    .get(result.lastInsertRowid);
};

/* ===================== UPDATE ===================== */
exports.updateReminder = (id, { remind_at }) => {
  const reminder = db
    .prepare('SELECT task_due_date FROM reminders WHERE id = ?')
    .get(id);

  if (!reminder) throw new appError('Reminder not found', 404);

  const dueDate  = new Date(reminder.task_due_date);
  const remindAtDate = new Date(remind_at);
  if (remindAtDate.getTime() > dueDate.getTime()) throw new appError('remind_at cannot be after the task due_date', 400);

  db.prepare('UPDATE reminders SET remind_at = ? WHERE id = ?')
    .run(remind_at, id);

  return db.prepare('SELECT * FROM reminders WHERE id = ?').get(id);
};

/* ===================== DELETE ===================== */
exports.deleteReminder = (id) => {
  const result = db.prepare('DELETE FROM reminders WHERE id = ?').run(id);

  if (result.changes === 0) {
    throw new appError('Reminder not found', 404);
  }
};
