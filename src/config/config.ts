import dotenv from 'dotenv';
dotenv.config();

export interface Config {
  serviceName: string;
  port: number;
  logLevel: string;
  db: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
  };
  email: {
    host: string;
    port: number;
    user: string;
    password: string;
    fromAddress: string;
    resetTokenExpiresIn: number;
    verifyTokenExpiresIn: number;
  };
  jwt: {
    secret: string;
    accessExpiresIn: number;
    refreshExpiresIn: number;
    issuer: string;
  };
}

function parseDuration(str: string, defaultSec: number): number {
  const match = str.match(/^(\d+)\s*([smhd])$/);
  if (!match) return defaultSec;
  const num = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return num * (multipliers[unit] || 60);
}

export function load(): Config {
  return {
    serviceName: process.env.SERVICE_NAME ?? 'tq-auth-service',
    port: Number(process.env.PORT) || 3001,
    logLevel: process.env.LOG_LEVEL ?? 'INFO',
    db: {
      host: process.env.DB_HOST ?? '127.0.0.1',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER ?? 'tasqalent',
      password: process.env.DB_PASSWORD ?? 'tq_password',
      name: process.env.DB_NAME ?? 'tq_auth',
    },
    email: {
      host: process.env.SMTP_HOST ?? '',
      port: Number(process.env.SMTP_PORT) || 587,
      user: process.env.SMTP_USER ?? '',
      password: process.env.SMTP_PASSWORD ?? '',
      fromAddress: process.env.SMTP_FROM ?? 'noreply@tasqalent.com',
      resetTokenExpiresIn: parseDuration(process.env.RESET_TOKEN_EXPIRES_IN ?? '1h', 3600),
      verifyTokenExpiresIn: parseDuration(process.env.VERIFY_TOKEN_EXPIRES_IN ?? '24h', 86400),
    },
    jwt: {
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
      accessExpiresIn: parseDuration(process.env.JWT_ACCESS_EXPIRES_IN ?? '15m', 900),
      refreshExpiresIn: parseDuration(process.env.JWT_REFRESH_EXPIRES_IN ?? '7d', 604800),
      issuer: process.env.JWT_ISSUER ?? 'tasqalent',
    },
  };
}
