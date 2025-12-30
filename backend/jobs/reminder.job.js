const cron = require('node-cron');
const pool = require('../pool');
const { sendNotification } = require('../services/notification.service');

function startReminderJob() {
  cron.schedule('* * * * *', async () => {
    // ogni minuto
    try {
      const { rows } = await pool.query(`
        SELECT r.id, r.task_id, r.remind_at, t.title
        FROM reminders r
        JOIN tasks t ON t.id = r.task_id
        WHERE r.is_sent = false
          AND r.remind_at < NOW()
      `);

      for (const reminder of rows) {
        // 1. INVIO NOTIFICA
        await sendNotification(reminder);

        // 2. SEGNA COME INVIATO
        await pool.query(
          `UPDATE reminders SET is_sent = true WHERE id = $1`,
          [reminder.id]
        );
      }

    } catch (err) {
      console.error('Reminder job error:', err);
    }
  });
}

module.exports = { startReminderJob };
