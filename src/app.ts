import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import type { Config } from './config/config';
import { createLogger, requestIdMiddleware, errorMiddleware } from '@tasqalent/shared';
import { routes } from './routes';
import { getPool } from './db/pool';
import { migrate } from './db/migrate';

export async function createApp(cfg: Config) {
  createLogger({ serviceName: cfg.serviceName, level: cfg.logLevel });

  const pool = getPool(cfg);
  await migrate(pool);

  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet({ hsts: false }));

  app.use(express.json());

  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    })
  );

  app.use(requestIdMiddleware);

  app.use(routes(cfg));

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(errorMiddleware);

  return { app, pool };
}
