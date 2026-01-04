require('./SQLiteDB/init-db')
const express = require('express');
const usersRoutes = require('./routes/users.routes');
const tasksRoutes = require('./routes/tasks.routes');
const categoriesRoutes = require('./routes/categories.routes');
const RemindersRoutes = require('./routes/reminders.routes');
const { startReminderJob } = require('./jobs/reminder.job');

const app = express();
const PORT = 3000;

app.use(express.json())

//Rotte
app.use('/users', usersRoutes)
app.use('/tasks', tasksRoutes)
app.use('/categories', categoriesRoutes)
app.use('/reminders', RemindersRoutes)

//Middleware errori
app.use((err, req, res, next) => {
  console.error(err);

  const status = err.statusCode || 500;
  const message = status === 500 ? 'Internal server error' : err.message;

  res.status(status).json({error: message});
});

startReminderJob();

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
