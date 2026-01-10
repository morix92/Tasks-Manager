const db = require('../SQLiteDB/db');
const appError = require('../utils/appError');

/* ===================== FUNZIONE ESTERNA ===================== */
function generateReminders(dueDate, rule, interval = 1) {
  const reminders = [];
  let date = new Date(dueDate);
  const now = new Date();

  while (date > now) {
    reminders.push(new Date(date));
    switch (rule) {
      case 'hourly':
        date.setHours(date.getHours() - interval);
        break;
      case 'daily':
        date.setDate(date.getDate() - interval);
        break;
      case 'weekly':
        date.setDate(date.getDate() - interval * 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() - interval);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() - interval);
        break;
      default:
        throw new Error(`Unsupported rule: ${rule}`);
    }
  }

  return reminders.filter(d => d > now);
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

/* ===================== CREATE ===================== */
exports.createReminder = ({ task_id, remind_at }) => {
  // recupero due_date e title del task
  const task = db
    .prepare('SELECT title, due_date FROM tasks WHERE id = ?')
    .get(task_id);

  if (!task) {
    throw new appError(
      `task_id ${task_id} does not exist in tasks table`,
      400
    );
  }

  const dueDate = new Date(task.due_date);
  const remindAtDate = new Date(remind_at);

  if (remindAtDate > dueDate) {
    throw new appError(
      'remind_at cannot be after the task due_date',
      400
    );
  }

  const result = db
    .prepare(`
      INSERT INTO reminders (task_id, task_title, task_due_date, remind_at)
      VALUES (?, ?, ?, ?)
    `)
    .run(
      task_id,
      task_title,
      formatDateForSQLite(dueDate),
      formatDateForSQLite(remindAtDate)
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

  if (!reminder) {
    throw new appError('Reminder not found', 404);
  }

  const dueDate = new Date(reminder.due_date_task);
  const remindAtDate = new Date(remind_at);

  if (remindAtDate > dueDate) {
    throw new appError(
      'remind_at cannot be after the task due_date',
      400
    );
  }

  db.prepare(`
    UPDATE reminders
    SET remind_at = ?
    WHERE id = ?
  `).run(
    formatDateForSQLite(remindAtDate),
    id
  );

  return db
    .prepare('SELECT * FROM reminders WHERE id = ?')
    .get(id);
};

/* ===================== DELETE ===================== */
exports.deleteReminder = (id) => {
  const result = db
    .prepare('DELETE FROM reminders WHERE id = ?')
    .run(id);

  if (result.changes === 0) {
    throw new appError('Reminder not found', 404);
  }
};

function formatDateForSQLite(date) {
  return new Date(date).toISOString().replace('T', ' ').slice(0, 19);
}
