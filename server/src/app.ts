import express from 'express';
import cors from 'cors';
import dictionaryRouter from './routes/dictionary';
import proxyRouter from './routes/proxy';
import grammarRouter from './routes/grammar';
import vocabularyRouter from './routes/vocabulary';
import { errorHandler } from './middleware/errorHandler';
import { config } from './config';

export function createApp() {
  const app = express();

  // Allow restricting CORS to a specific origin in production by setting FRONTEND_URL
  // Example: FRONTEND_URL=https://deutschflow-frontend.onrender.com
  if (config.frontendUrl) {
    // support comma-separated list of allowed origins
    const origins = config.frontendUrl.split(',').map(s => s.trim()).filter(Boolean);
    app.use(cors({ origin: origins }));
  } else {
    // default: permissive during development
    app.use(cors());
  }

  app.use(express.json({ limit: '64kb' }));

  app.use(dictionaryRouter);
  app.use(proxyRouter);
  app.use('/api/grammar', grammarRouter);
  app.use('/api/vocabulary', vocabularyRouter);

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  // Error handler must be registered last, after all routes
  app.use(errorHandler);

  return app;
}
