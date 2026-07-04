import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sslEnabled = process.env.DB_SSL === "true" || process.env.DB_SSL === "1";
const databaseName = process.env.DB_NAME || "github_analyzer_db";

const run = async () => {
  const connectionConfig = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  };

  if (sslEnabled) {
    connectionConfig.ssl = {
      rejectUnauthorized: true,
      minVersion: "TLSv1.2",
    };
  }

  const connection = await mysql.createConnection(connectionConfig);

  try {
    const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
    const normalizedSql = sql.replace(/github_analyzer/g, databaseName);
    await connection.query(normalizedSql);
    console.log("✅ Database schema migrated successfully");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
};

run();
