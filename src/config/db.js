/**
 * MySQL connection pool setup.
 * Initializes the shared pool and verifies connectivity at startup.
 */

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const mysql = require("mysql2");

// Logs current environment to help distinguish local vs deployed runtime.
console.log(process.env.NODE_ENV);

// Shared connection pool used across services.
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Smoke-test the DB connection once during startup.
db.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed:", err.message);
  } else {
    console.log("MySQL connected successfully");
    connection.release();
  }
});

module.exports = db;
