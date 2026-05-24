import { load } from './config/config';
import { createApp } from './app';

async function main(): Promise<void> {
  const cfg = load();
  const { app } = await createApp(cfg);

  app.listen(cfg.port, () => {
    console.log(`${cfg.serviceName} listening on port ${cfg.port}`);
  });
}

main().catch(err => {
  console.error('Failed to start auth service:', err);
  process.exit(1);
});
