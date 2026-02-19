const cron = require('node-cron');
const db = require('../SQLiteDB/db');
const { sendNotificationReminder } = require('../services/notification.service');
const formatLocalDate = require('../utils/formatLocalDate');

function checkReminders() {
  try {
    const nowLocal = formatLocalDate(new Date());

    const reminders = db.prepare(`
      SELECT 
        r.id,
        r.task_id,
        r.remind_at,
        t.title,
        t.user_id,
        u.username,
        u.avatar_url
      FROM reminders r
      JOIN tasks t ON t.id = r.task_id
      JOIN users u ON u.id = t.user_id
      WHERE r.is_sent = 0
        AND r.remind_at <= ?
    `).all(nowLocal);

    for (const reminder of reminders) {
      sendNotificationReminder(reminder);
      console.log(reminder)

      db.prepare(`
        UPDATE reminders
        SET is_sent = 1
        WHERE id = ?
      `).run(reminder.id);
    }

    if (reminders.length > 0) {
      console.log(`${reminders.length} reminder inviato/i.`);
    }

  } catch (err) {
    console.error('Reminder job error:', err);
  }
}

/** Job schedulato */
function startReminderJob() {

  checkReminders();

  cron.schedule('* * * * *', () => {
    checkReminders();
  });
}

module.exports = { startReminderJob };
