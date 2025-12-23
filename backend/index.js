const express = require('express');
const usersRoutes = require('./routes/users');

const app = express();
const PORT = 3000;

app.use(express.json())

//Rotte
app.use('/users', usersRoutes)

//Middleware errori
app.use((err, req, res, next) => {
  console.error(err);

  const status = err.statusCode || 500;
  const message = status === 500 ? 'Internal server error' : err.message;

  res.status(status).json({error: message});
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
