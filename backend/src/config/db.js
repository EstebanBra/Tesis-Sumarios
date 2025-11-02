// src/config/db.js


import sql from "mssql";
import dotenv from "dotenv";
dotenv.config();

const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS } = process.env;

const config = {
  user: DB_USER,
  password: DB_PASS,
  server: DB_HOST,
  port: Number(DB_PORT) || 1433, 
  database: DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let pool;

export async function getPool() {
  if (!pool) {
    console.log("⏳ Conectando a SQL Server...");
    pool = await sql.connect(config);
    console.log("✅ Conectado a SQL Server");
  }
  return pool;
}

export async function probarConexion() {
  const p = await getPool();
  const r = await p.request().query("SELECT DB_NAME() AS db");
  return r.recordset[0].db;
}
