const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'postgres',
  user: process.env.POSTGRES_USER || 'taskapp',
  password: process.env.POSTGRES_PASSWORD || 'taskapp',
  database: process.env.POSTGRES_DB || 'taskapp',
  port: 5432,
});

module.exports = pool;
