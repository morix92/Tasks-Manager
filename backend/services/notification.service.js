const notificationEmitter = require('./notificationEmitter');
const { pathToFileURL } = require('url');
const path = require('path');

const avatarFolder = path.join(process.env.APPDATA,'TaskManager','avatar');

async function sendNotificationReminder(reminder) {

  const url = new URL(reminder.avatar_url);
  const filename = path.basename(url.pathname);

  const fullPath = path.join(avatarFolder, filename);

  // Invia evento al socket
  notificationEmitter.emit('reminder', {
    username: reminder.username,
    avatar_url: fullPath,
    id: reminder.id,
    taskId: reminder.task_id,
    title: reminder.title,
    remindAt: reminder.remind_at
  });

  console.log(`NOTIFICA per il profilo ${reminder.username}: ${reminder.title}`);
}

async function sendNotificationTask(task) {

  const url = new URL(task.avatar_url);
  const filename = path.basename(url.pathname);

  const fullPath = path.join(avatarFolder, filename);

  // Invia evento al socket
  notificationEmitter.emit('task', {
    username: task.username,
    avatar_url: fullPath,
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