import mysql, { Pool } from 'mysql2/promise';
import type { Config } from '../config/config';

let pool: Pool | null = null;

export function getPool(cfg: Config): Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: cfg.db.host,
      port: cfg.db.port,
      user: cfg.db.user,
      password: cfg.db.password,
      database: cfg.db.name,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

export function closePool(): void {
  if (pool) {
    pool.end();
    pool = null;
  }
}
