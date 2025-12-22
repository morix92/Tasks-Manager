const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;


const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'postgres', //è il nome del service del DB sul docker-compose
  user: process.env.POSTGRES_USER || 'taskapp',
  password: process.env.POSTGRES_PASSWORD || 'taskapp',
  database: process.env.POSTGRES_DB || 'taskapp',
  port: 5432,
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
