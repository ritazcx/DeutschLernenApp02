import dotenv from 'dotenv';
import path from 'path';

// Load .env before anything else
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { createApp } from './app';
import { config } from './config';

const app = createApp();

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${config.port}`);
});
