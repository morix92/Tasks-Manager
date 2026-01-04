const cron = require('node-cron');
const db = require('../SQLiteDB/db');
const { sendNotification } = require('../services/notification.service');

function startReminderJob() {
  cron.schedule('* * * * *', () => {
    try {
      const reminders = db.prepare(`
        SELECT 
          r.id,
          r.task_id,
          r.remind_at,
          t.title
        FROM reminders r
        JOIN tasks t ON t.id = r.task_id
        WHERE r.is_sent = 0
          AND r.remind_at <= strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')
      `).all();

      for (const reminder of reminders) {
        sendNotification(reminder);

        db.prepare(`
          UPDATE reminders
          SET is_sent = 1
          WHERE id = ?
        `).run(reminder.id);
      }

    } catch (err) {
      console.error('Reminder job error:', err);
    }
  });
}

module.exports = { startReminderJob };
