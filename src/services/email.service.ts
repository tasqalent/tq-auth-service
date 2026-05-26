import type { Config } from '../config/config';

export function sendPasswordResetEmail(cfg: Config, to: string, token: string): string | null {
  if (!cfg.email.host) {
    console.log(`[DEV] Password reset for ${to}: ${token}`);
    return token;
  }

  // SMTP integration will be added later
  console.log(`[EMAIL] Sending password reset to ${to}`);
  return null;
}
