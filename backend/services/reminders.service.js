const pool = require('../pool');
const appError = require('../utils/appError');

/* ===================== FUNZIONE Esterna ===================== */
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

  // Ritorna solo reminder futuri
  return reminders.filter(d => d > now);
}
exports.generateReminders = generateReminders;


/* ===================== GET ALL ===================== */
exports.getAllReminders = async ({ remind_at_order, order }) => {
  let query = 'SELECT * FROM reminders';

  const idOrder = order === 'desc' ? 'DESC' : 'ASC';

  if (['asc', 'desc'].includes(remind_at_order)) {
    query += ` ORDER BY remind_at ${remind_at_order.toUpperCase()}`;
  } else {
    query += ` ORDER BY id ${idOrder}`;
  }

  const { rows } = await pool.query(query);
  return rows;
};

/* ===================== GET BY ID ===================== */
exports.getReminderById = async (id) => {
  const { rows } = await pool.query(
    'SELECT * FROM reminders WHERE id = $1',
    [id]
  );

  if (!rows.length) {
    throw new appError('Reminder not found', 404);
  }

  return rows[0];
};

/* ===================== CREATE ===================== */
exports.createReminder = async ({ task_id, remind_at }) => {

  // Recupero due_date del task
  const taskResult = await pool.query(
    'SELECT due_date FROM tasks WHERE id = $1',
    [task_id]
  );

  if (!taskResult.rowCount) {
    throw new appError(`task_id ${task_id} does not exist in tasks table`, 400);
  }

  const dueDate = new Date(taskResult.rows[0].due_date);
  const remindAtDate = new Date(remind_at);

  if (remindAtDate > dueDate) {
    throw new appError('remind_at cannot be after the task due_date', 400);
  }

  const { rows } = await pool.query(
    `
    INSERT INTO reminders (task_id, due_date_task, remind_at)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [task_id, dueDate, remindAtDate]
  );

  return rows[0];
};

/* ===================== UPDATE ===================== */
exports.updateReminder = async (id, { remind_at }) => {

  const reminderResult = await pool.query(
    'SELECT due_date_task FROM reminders WHERE id = $1',
    [id]
  );

  if (!reminderResult.rowCount) {
    throw new appError('Reminder not found', 404);
  }

  const dueDate = new Date(reminderResult.rows[0].due_date_task);
  const remindAtDate = new Date(remind_at);
  
  if (remindAtDate > dueDate) {
    throw new appError('remind_at cannot be after the task due_date', 400);
  }

  const { rows } = await pool.query(
    `
    UPDATE reminders
    SET remind_at = $1
    WHERE id = $2
    RETURNING *
    `,
    [remindAtDate, id]
  );

  return rows[0];
};

/* ===================== DELETE ===================== */
exports.deleteReminder = async (id) => {
  const { rowCount } = await pool.query(
    'DELETE FROM reminders WHERE id = $1',
    [id]
  );

  if (!rowCount) {
    throw new appError('Reminder not found', 404);
  }
};

