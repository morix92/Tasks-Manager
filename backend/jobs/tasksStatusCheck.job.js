const cron = require('node-cron');
const db = require('../SQLiteDB/db');
const formatLocalDate = require('../utils/formatLocalDate');
const { sendNotificationTask } = require('../services/notification.service');

function checkTasksStatus() {
  try {
    const nowLocal = formatLocalDate(new Date());

    const tasks = db.prepare(`
      SELECT t.user_id, t.id, t.title, t.due_date, u.username, u.avatar_url
      FROM tasks t
      JOIN users u ON u.id = t.user_id
      WHERE status = 0
        AND due_date <= ?
    `).all(nowLocal);

    if (tasks.length > 0) {
      const updateQuery = db.prepare(
        `UPDATE tasks SET status = 2 WHERE id = ?`
      );

      tasks.forEach(task => {
        updateQuery.run(task.id);
        sendNotificationTask(task);
      });

      console.log(`${tasks.length} task status aggiornato/i.`);
    }

  } catch (err) {
    console.error('Errore durante l\'esecuzione del job:', err);
  }
}

/** Job schedulato */
function TasksStatusCheck() {

  checkTasksStatus();

  cron.schedule('* * * * *', () => {
    checkTasksStatus();
  });
}

module.exports = { TasksStatusCheck };
