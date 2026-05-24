import type { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { randomUUID } from 'crypto';
import type { User } from '@tasqalent/shared';

export interface UserRow extends User {
  passwordHash: string;
  isVerified: boolean;
}

interface RefreshTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
}

export async function insertUser(
  pool: Pool,
  params: { email: string; username: string; passwordHash: string }
): Promise<UserRow> {
  const id = randomUUID();
  await pool.execute<ResultSetHeader>(
    'INSERT INTO users (id, email, username, password_hash, role) VALUES (?, ?, ?, ?, ?)',
    [id, params.email, params.username, params.passwordHash, 'user']
  );
  return {
    id,
    email: params.email,
    username: params.username,
    role: 'user' as User['role'],
    passwordHash: params.passwordHash,
    isVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function findUserByEmail(pool: Pool, email: string): Promise<UserRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [
    email,
  ]);
  return rows.length ? mapRow(rows[0]) : null;
}

export async function findUserByUsername(pool: Pool, username: string): Promise<UserRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM users WHERE username = ?', [
    username,
  ]);
  return rows.length ? mapRow(rows[0]) : null;
}

export async function findUserById(pool: Pool, id: string): Promise<UserRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM users WHERE id = ?', [id]);
  return rows.length ? mapRow(rows[0]) : null;
}

export async function findUserByIdentifier(
  pool: Pool,
  identifier: string
): Promise<UserRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM users WHERE email = ? OR username = ?',
    [identifier, identifier]
  );
  return rows.length ? mapRow(rows[0]) : null;
}

export async function insertRefreshToken(
  pool: Pool,
  params: { userId: string; tokenHash: string; expiresAt: Date }
): Promise<void> {
  const id = randomUUID();
  await pool.execute<ResultSetHeader>(
    'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
    [id, params.userId, params.tokenHash, params.expiresAt]
  );
}

export async function findRefreshToken(
  pool: Pool,
  tokenHash: string
): Promise<RefreshTokenRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM refresh_tokens WHERE token_hash = ? AND expires_at > NOW()',
    [tokenHash]
  );
  return rows.length ? (rows[0] as RefreshTokenRow) : null;
}

export async function deleteRefreshToken(pool: Pool, tokenHash: string): Promise<void> {
  await pool.execute('DELETE FROM refresh_tokens WHERE token_hash = ?', [tokenHash]);
}

function mapRow(row: RowDataPacket): UserRow {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    role: row.role,
    passwordHash: row.password_hash,
    isVerified: Boolean(row.is_verified),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
