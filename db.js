const mysql = require('mysql2');
require('dotenv').config();

const poolConfig = process.env.DB_URL || {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
};

const pool = mysql.createPool(poolConfig);
console.log('Database connection pool created with config:', poolConfig);

const db = pool.promise();

module.exports = db;
