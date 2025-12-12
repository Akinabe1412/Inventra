const mysql = require('mysql2');
require('dotenv').config();

// Create connection pool for better performance
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.log('💡 Please check:');
    console.log('   1. Is MySQL running? (net start mysql)');
    console.log('   2. Are credentials in .env correct?');
    console.log('   3. Does the database exist?');
    process.exit(1);
  }
  console.log('✅ Connected to MySQL database');
  connection.release();
});

// Promisify for async/await
const promisePool = pool.promise();

module.exports = { pool, promisePool };