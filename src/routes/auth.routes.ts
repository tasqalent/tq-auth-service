import { Router } from 'express';
import type { Config } from '../config/config';
import { validate } from '../middleware/validate';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from '../validators/auth.validator';
import * as controller from '../controllers/auth.controller';

export function authRoutes(cfg: Config): Router {
  const router = Router();

  router.post('/register', validate(registerSchema), controller.register(cfg));
  router.post('/verify-email', validate(verifyEmailSchema), controller.verifyEmail(cfg));
  router.post(
    '/resend-verification',
    validate(resendVerificationSchema),
    controller.resendVerification(cfg)
  );

  router.post('/login', validate(loginSchema), controller.login(cfg));
  router.post('/refresh', validate(refreshSchema), controller.refresh(cfg));
  router.post('/logout', validate(refreshSchema), controller.logout(cfg));

  router.post('/forgot-password', validate(forgotPasswordSchema), controller.forgotPassword(cfg));
  router.post('/reset-password', validate(resetPasswordSchema), controller.resetPassword(cfg));

  return router;
}
