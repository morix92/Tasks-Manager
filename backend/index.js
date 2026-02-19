const path = require('path');
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const fsExtra = require('fs-extra');

// Routes e servizi
const notificationEmitter = require('./services/notificationEmitter');
const usersRoutes = require('./routes/users.routes');
const tasksRoutes = require('./routes/tasks.routes');
const categoriesRoutes = require('./routes/categories.routes');
const RemindersRoutes = require('./routes/reminders.routes');
const { startReminderJob } = require('./jobs/reminder.job');
const { TasksStatusCheck } = require('./jobs/tasksStatusCheck.job');

// --------------------
// Controllo variabile Tauri / dev
if (!process.env.TASK_MANAGER_DATA_DIR) {
  throw new Error("TASK_MANAGER_DATA_DIR non definita!");
}

// Inizializza DB (tabelle, profilo default)
require('./SQLiteDB/init-db');

// --------------------
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Rotte
app.use('/users', usersRoutes);
app.use('/tasks', tasksRoutes);
app.use('/categories', categoriesRoutes);
app.use('/reminders', RemindersRoutes);

// Statics
const avatarDest = path.join(process.env.TASK_MANAGER_DATA_DIR, 'avatar');
app.use('/avatar', express.static(avatarDest));
app.use('/avatars', require('./routes/avatars.routes'));

// Health check per FE
app.get('/health', (req, res) => res.send('OK'));

// Middleware errori
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({ error: status === 500 ? 'Internal server error' : err.message });
});

// Server + Socket.io
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: 'http://127.0.0.1:4200', methods: ['GET', 'POST'] } });

io.on('connection', socket => console.log('Client Socket connesso:', socket.id));
notificationEmitter.on('reminder', data => io.emit('reminder', data));
notificationEmitter.on('task', data => io.emit('task', data));

// Job
setTimeout(() => {
  //Aspetto 5 secondi dall'avvio del BE
  startReminderJob();
  TasksStatusCheck();
}, 6000);


// Porta fissa 3000
const PORT = 3000;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend + Socket.io running on port ${PORT}`);
});
