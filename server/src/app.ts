import express from 'express';
import cors from 'cors';
import dictionaryRouter from './routes/dictionary';

export function createApp() {
  const app = express();

  // Allow restricting CORS to a specific origin in production by setting FRONTEND_URL
  // Example: FRONTEND_URL=https://deutschflow-frontend.onrender.com
  const frontend = process.env.FRONTEND_URL;
  if (frontend) {
    // support comma-separated list of allowed origins
    const origins = frontend.split(',').map(s => s.trim()).filter(Boolean);
    app.use(cors({ origin: origins }));
  } else {
    // default: permissive during development
    app.use(cors());
  }

  app.use(express.json({ limit: '64kb' }));

  app.use(dictionaryRouter);

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  return app;
}
