import bcrypt from 'bcryptjs';
import type { Pool } from 'mysql2/promise';
import type { User } from '@tasqalent/shared';
import { ERROR_CODES } from '@tasqalent/shared';
import type { Config } from '../config/config';
import * as tokenService from './token.service';
import * as userRepo from '../repositories/user.repository';

const SALT_ROUNDS = 12;

export class AuthError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AuthError';
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

export async function register(
  pool: Pool,
  cfg: Config,
  params: { email: string; username: string; password: string }
): Promise<{ user: Omit<User, 'updatedAt'>; tokens: tokenService.TokenPair }> {
  const existingEmail = await userRepo.findUserByEmail(pool, params.email);
  if (existingEmail) throw new AuthError(ERROR_CODES.CONFLICT, 'Email already registered');

  const existingUsername = await userRepo.findUserByUsername(pool, params.username);
  if (existingUsername) throw new AuthError(ERROR_CODES.CONFLICT, 'Username already taken');

  const passwordHash = await bcrypt.hash(params.password, SALT_ROUNDS);
  const user = await userRepo.insertUser(pool, {
    email: params.email,
    username: params.username,
    passwordHash,
  });

  const accessToken = tokenService.signAccessToken(user, cfg);
  const refreshToken = tokenService.generateRefreshToken();

  const expiresAt = new Date(Date.now() + cfg.jwt.refreshExpiresIn * 1000);
  await userRepo.insertRefreshToken(pool, {
    userId: user.id,
    tokenHash: refreshToken.hash,
    expiresAt,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
    },
    tokens: { accessToken, refreshToken: refreshToken.plain, expiresIn: 900 },
  };
}

export async function login(
  pool: Pool,
  cfg: Config,
  params: { identifier: string; password: string }
): Promise<{ user: Omit<User, 'updatedAt'>; tokens: tokenService.TokenPair }> {
  const user = await userRepo.findUserByIdentifier(pool, params.identifier);
  if (!user) throw new AuthError(ERROR_CODES.UNAUTHORIZED, 'Invalid credentials');

  const match = await bcrypt.compare(params.password, user.passwordHash);
  if (!match) throw new AuthError(ERROR_CODES.UNAUTHORIZED, 'Invalid credentials');

  const accessToken = tokenService.signAccessToken(user, cfg);
  const refreshToken = tokenService.generateRefreshToken();

  const expiresAt = new Date(Date.now() + cfg.jwt.refreshExpiresIn * 1000);
  await userRepo.insertRefreshToken(pool, {
    userId: user.id,
    tokenHash: refreshToken.hash,
    expiresAt,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
    },
    tokens: { accessToken, refreshToken: refreshToken.plain, expiresIn: 900 },
  };
}

export async function refresh(
  pool: Pool,
  cfg: Config,
  refreshTokenPlain: string
): Promise<{ user: Omit<User, 'updatedAt'>; tokens: tokenService.TokenPair }> {
  const tokenHash = tokenService.hashRefreshToken(refreshTokenPlain);
  const stored = await userRepo.findRefreshToken(pool, tokenHash);
  if (!stored) throw new AuthError(ERROR_CODES.UNAUTHORIZED, 'Invalid or expired refresh token');

  await userRepo.deleteRefreshToken(pool, tokenHash);

  const user = await userRepo.findUserById(pool, stored.user_id);
  if (!user) throw new AuthError(ERROR_CODES.UNAUTHORIZED, 'User not found');

  const accessToken = tokenService.signAccessToken(user, cfg);
  const newRefreshToken = tokenService.generateRefreshToken();

  const expiresAt = new Date(Date.now() + cfg.jwt.refreshExpiresIn * 1000);
  await userRepo.insertRefreshToken(pool, {
    userId: user.id,
    tokenHash: newRefreshToken.hash,
    expiresAt,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
    },
    tokens: { accessToken, refreshToken: newRefreshToken.plain, expiresIn: 900 },
  };
}

export async function logout(pool: Pool, refreshTokenPlain: string): Promise<void> {
  const tokenHash = tokenService.hashRefreshToken(refreshTokenPlain);
  await userRepo.deleteRefreshToken(pool, tokenHash);
}
