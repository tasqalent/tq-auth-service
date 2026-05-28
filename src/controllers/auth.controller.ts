import type { Request, Response, NextFunction } from 'express';
import {
  HTTP_STATUS,
  success,
  errorResponse,
  ERROR_CODES,
  RegisterRequest,
  LoginRequest,
} from '@tasqalent/shared';
import { getPool } from '../db/pool';
import * as authService from '../services/auth.service';
import type { Config } from '../config/config';

export function register(cfg: Config) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pool = getPool(cfg);
      const result = await authService.register(pool, cfg, req.body as RegisterRequest);
      success(
        res,
        {
          user: result,
          message: 'Account created. Please check your email to verify your account.',
        },
        HTTP_STATUS.CREATED
      );
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
      const result = await authService.login(pool, cfg, req.body as LoginRequest);
      success(res, result);
    } catch (err) {
      if (err instanceof authService.AuthError) {
        const status =
          err.code === ERROR_CODES.FORBIDDEN ? HTTP_STATUS.FORBIDDEN : HTTP_STATUS.UNAUTHORIZED;
        errorResponse(res, err.code, err.message, status);
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

export function forgotPassword(cfg: Config) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pool = getPool(cfg);
      await authService.forgotPassword(pool, cfg, req.body.email);
      success(res, { message: 'If the email exists, a reset link has been sent' });
    } catch (err) {
      next(err);
    }
  };
}

export function resetPassword(cfg: Config) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pool = getPool(cfg);
      await authService.resetPassword(pool, cfg, req.body.token, req.body.password);
      success(res, { message: 'Password has been reset successfully' });
    } catch (err) {
      if (err instanceof authService.AuthError) {
        errorResponse(res, err.code, err.message, HTTP_STATUS.UNAUTHORIZED);
        return;
      }
      next(err);
    }
  };
}

export function verifyEmail(cfg: Config) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pool = getPool(cfg);
      await authService.verifyEmail(pool, cfg, req.body.token);
      success(res, { message: 'Email verified successfully' });
    } catch (err) {
      if (err instanceof authService.AuthError) {
        errorResponse(res, err.code, err.message, HTTP_STATUS.UNAUTHORIZED);
        return;
      }
      next(err);
    }
  };
}

export function resendVerification(cfg: Config) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pool = getPool(cfg);
      await authService.resendVerification(pool, cfg, req.body.email);
      success(res, { message: 'If the email exists, a verification link has been sent' });
    } catch (err) {
      next(err);
    }
  };
}
