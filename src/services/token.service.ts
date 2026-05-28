import jwt from 'jsonwebtoken';
import { randomUUID, createHash } from 'crypto';
import type { JwtPayload } from '@tasqalent/shared';
import type { Config } from '../config/config';

function sha256(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function signAccessToken(
  user: { id: string; email: string; username: string; role: string },
  cfg: Config
): string {
  const payload: JwtPayload = {
    sub: user.id,
    username: user.username,
    email: user.email,
    role: user.role as JwtPayload['role'],
  };
  return jwt.sign(payload, cfg.jwt.secret, {
    expiresIn: cfg.jwt.accessExpiresIn,
    issuer: cfg.jwt.issuer,
  });
}

export function generateRefreshToken(): { plain: string; hash: string } {
  const plain = randomUUID() + '_' + randomUUID();
  return { plain, hash: sha256(plain) };
}

export function hashRefreshToken(plain: string): string {
  return sha256(plain);
}
