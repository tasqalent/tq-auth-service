import { Router } from 'express';
import type { Config } from '../config/config';
import { authRoutes } from './auth.routes';

export function routes(cfg: Config): Router {
  const router = Router();
  router.use('/', authRoutes(cfg));
  return router;
}
