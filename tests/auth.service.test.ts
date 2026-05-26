import bcrypt from 'bcryptjs';
import * as authService from '../src/services/auth.service';
import type { Config } from '../src/config/config';
import type { Pool } from 'mysql2/promise';

const mockCfg: Config = {
  serviceName: 'test',
  port: 0,
  logLevel: 'silent',
  db: { host: '', port: 0, user: '', password: '', name: '' },
  email: {
    host: '',
    port: 587,
    user: '',
    password: '',
    fromAddress: 'noreply@tasqalent.com',
    resetTokenExpiresIn: 3600,
    verifyTokenExpiresIn: 86400,
  },
  jwt: { secret: 'test-secret', accessExpiresIn: 900, refreshExpiresIn: 604800, issuer: 'test' },
};

function mockPool(overrides: Record<string, jest.Mock>): Pool {
  return { execute: jest.fn(), ...overrides } as unknown as Pool;
}

describe('AuthService', () => {
  describe('register', () => {
    it('throws CONFLICT when email already exists', async () => {
      const pool = mockPool({
        execute: jest.fn().mockResolvedValueOnce([
          [
            {
              id: 'x',
              email: 'a@b.com',
              username: 'a',
              password_hash: 'h',
              is_verified: false,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        ]),
      });
      await expect(
        authService.register(pool, mockCfg, {
          email: 'a@b.com',
          username: 'new',
          password: '12345678',
        })
      ).rejects.toThrow('Email already registered');
    });

    it('creates a user and returns tokens on success', async () => {
      const pool = mockPool({
        execute: jest
          .fn()
          .mockResolvedValueOnce([[]])
          .mockResolvedValueOnce([[]])
          .mockResolvedValueOnce([{ affectedRows: 1 }])
          .mockResolvedValueOnce([{ affectedRows: 1 }]),
      });
      const result = await authService.register(pool, mockCfg, {
        email: 'new@b.com',
        username: 'newguy',
        password: '12345678',
      });
      expect(result.email).toBe('new@b.com');
      expect(result.username).toBe('newguy');
      expect(result.id).toBeTruthy();
    });
  });

  describe('login', () => {
    it('throws UNAUTHORIZED for wrong password', async () => {
      const hash = await bcrypt.hash('correct', 4);
      const pool = mockPool({
        execute: jest.fn().mockResolvedValueOnce([
          [
            {
              id: '1',
              email: 'a@b.com',
              username: 'a',
              password_hash: hash,
              role: 'user',
              is_verified: true,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        ]),
      });
      await expect(
        authService.login(pool, mockCfg, { identifier: 'a@b.com', password: 'wrong' })
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
