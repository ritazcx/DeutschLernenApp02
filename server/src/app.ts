import express from 'express';
import cors from 'cors';
import dictionaryRouter from './routes/dictionary';
import proxyRouter from './routes/proxy';
import grammarRouter from './routes/grammar';
import analysisRouter from './routes/analysis';
import vocabularyRouter from './routes/vocabulary';
import nlpRouter from './routes/nlp';

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
  app.use(proxyRouter);
  app.use(grammarRouter);
  app.use(analysisRouter);
  app.use('/api/vocabulary', vocabularyRouter);
  app.use('/api/nlp', nlpRouter);

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  return app;
}
