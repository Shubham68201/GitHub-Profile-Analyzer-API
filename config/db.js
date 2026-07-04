import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const sslEnabled = process.env.DB_SSL === "true" || process.env.DB_SSL === "1";
const poolConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "github_analyzer",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
};

if (sslEnabled) {
  poolConfig.ssl = {
    rejectUnauthorized: true,
    minVersion: "TLSv1.2",
  };
}

const pool = mysql.createPool(poolConfig);

export const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL connected successfully");
    conn.release();
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);
    process.exit(1);
  }
};

export default pool;
