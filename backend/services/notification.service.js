const notificationEmitter = require('./notificationEmitter');

async function sendNotificationReminder(reminder) {

  // Invia evento al socket
  notificationEmitter.emit('reminder', {
    username: reminder.username,
    id: reminder.id,
    taskId: reminder.task_id,
    title: reminder.title,
    remindAt: reminder.remind_at
  });

  console.log(`NOTIFICA per il profilo ${reminder.username}: ${reminder.title}`);
}

async function sendNotificationTask(task) {

  // Invia evento al socket
  notificationEmitter.emit('task', {
    username: task.username,
    id: task.id,
    title: task.title,
    dueDate: task.due_date
  });

  // (opzionale) mantieni il log
    console.log(`TASK del profilo ${task.username} SCADUTO: ${task.title}`);
}


module.exports = {
  sendNotificationReminder,
  sendNotificationTask
};