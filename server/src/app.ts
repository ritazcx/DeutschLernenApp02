import express from 'express';
import cors from 'cors';
import dictionaryRouter from './routes/dictionary';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '64kb' }));

  app.use(dictionaryRouter);

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  return app;
}
