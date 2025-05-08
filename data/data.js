// jobemdat-BE/data/data.js
const mysql = require("mysql2/promise");


const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

pool.getConnection()
  .then(() => console.log("Database connected successfully."))
  .catch(err => console.error("Database connection failed:", err));

module.exports = pool;
