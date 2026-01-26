require('./SQLiteDB/init-db')
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const notificationEmitter = require('./services/notificationEmitter');

const usersRoutes = require('./routes/users.routes');
const tasksRoutes = require('./routes/tasks.routes');
const categoriesRoutes = require('./routes/categories.routes');
const RemindersRoutes = require('./routes/reminders.routes');
const { startReminderJob } = require('./jobs/reminder.job');
const { TasksStatusCheck } = require('./jobs/tasksStatusCheck.job');


const app = express();
const PORT = 3000;

app.use(cors({
  origin: [
    'http://localhost:4200', // Angular dev
  ]
}));

app.use(express.json())

//Rotte
app.use('/users', usersRoutes)
app.use('/tasks', tasksRoutes)
app.use('/categories', categoriesRoutes)
app.use('/reminders', RemindersRoutes)

app.use('/avatar', express.static('public/avatar'));
app.use('/avatars', require('./routes/avatars.routes'));


//Middleware errori
app.use((err, req, res, next) => {
  console.error(err);

  const status = err.statusCode || 500;
  const message = status === 500 ? 'Internal server error' : err.message;

  res.status(status).json({error: message});
});

startReminderJob();
TasksStatusCheck();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('Client Socket connesso:', socket.id);
});

notificationEmitter.on('reminder', (data) => {
  console.log("test rem :"+JSON.stringify(data))
  io.emit('reminder', data);
});

notificationEmitter.on('task', (data) => {
  console.log("test task :"+JSON.stringify(data))
  io.emit('task', data);
});

server.listen(PORT, () => {
  console.log(`Backend + Socket.io running on port ${PORT}`);
});

