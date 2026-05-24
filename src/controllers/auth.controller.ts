import type { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS, success, errorResponse } from '@tasqalent/shared';
import { getPool } from '../db/pool';
import * as authService from '../services/auth.service';
import type { Config } from '../config/config';

export function register(cfg: Config) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pool = getPool(cfg);
      const result = await authService.register(pool, cfg, req.body);
      success(res, result, HTTP_STATUS.CREATED);
    } catch (err) {
      if (err instanceof authService.AuthError) {
        errorResponse(
          res,
          err.code,
          err.message,
          err.code === 'CONFLICT' ? HTTP_STATUS.CONFLICT : HTTP_STATUS.UNAUTHORIZED
        );
        return;
      }
      next(err);
    }
  };
}

export function login(cfg: Config) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pool = getPool(cfg);
      const result = await authService.login(pool, cfg, req.body);
      success(res, result);
    } catch (err) {
      if (err instanceof authService.AuthError) {
        errorResponse(res, err.code, err.message, HTTP_STATUS.UNAUTHORIZED);
        return;
      }
      next(err);
    }
  };
}

export function refresh(cfg: Config) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pool = getPool(cfg);
      const result = await authService.refresh(pool, cfg, req.body.refreshToken);
      success(res, result);
    } catch (err) {
      if (err instanceof authService.AuthError) {
        errorResponse(res, err.code, err.message, HTTP_STATUS.UNAUTHORIZED);
        return;
      }
      next(err);
    }
  };
}

export function logout(_cfg: Config) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pool = getPool(_cfg);
      await authService.logout(pool, req.body.refreshToken);
      success(res, { message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  };
}
