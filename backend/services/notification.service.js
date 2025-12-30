async function sendNotification(reminder) {
  console.log('REMINDER: ', {
    id: reminder.id,
    taskId: reminder.task_id,
    title: reminder.title,
    remindAt: reminder.remind_at
  });
}

module.exports = { sendNotification };
