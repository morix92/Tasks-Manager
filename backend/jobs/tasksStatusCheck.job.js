const cron = require('node-cron');
const db = require('../SQLiteDB/db');
const formatLocalDate = require('../utils/formatLocalDate');
const { sendNotificationTask } = require('../services/notification.service');

/** Job per aggiornare lo status dei task scaduti. */
function TasksStatusCheck() {
  cron.schedule('* * * * *', () => {
    try {
      const nowLocal = formatLocalDate(new Date());

      // Seleziona tutti i task scaduti ma con status = 0
      const tasks = db.prepare(`
        SELECT t.user_id, t.id, t.title, t.due_date, u.username
        FROM tasks t
        JOIN users u ON u.id = t.user_id
        WHERE status = 0
          AND due_date <= ?
      `).all(nowLocal);

      if (tasks.length > 0) {
        const updateQuery = db.prepare(`UPDATE tasks SET status = 2 WHERE id = ?`);

        tasks.forEach(task => {
          updateQuery.run(task.id);
          sendNotificationTask(task);
        });

        console.log(`${tasks.length} task status aggiornato/i.`);
      }

    } catch (err) {
      console.error('Errore durante l\'esecuzione del job:', err);
    }
  });
}

module.exports = { TasksStatusCheck };
