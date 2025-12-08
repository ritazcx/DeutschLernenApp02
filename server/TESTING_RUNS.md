# Running Tests (Quick Reference)

This document describes how to run the server unit and integration tests locally (macOS / zsh).

Prerequisites
- Node.js 20.x (project `engines` requires >=20 <21)
- Python 3 (for spaCy service) and German model installed if running integration tests that manage spaCy:
  - `pip install -U spacy`
  - `python3 -m spacy download de_core_news_sm` (or your preferred German model)

Common locations & files
- Server root (commands below assume current directory: `server/`).
- Server API: `http://localhost:4000` (default)
- HTTP integration tests run against `/api/grammar/analyze-detection`.
- Server logs (when starting with `nohup`): `/tmp/deutsch-server.log`

Build (optional)
1. Compile TypeScript to `dist`:
   ```bash
   cd server
   npm run build
   ```

Unit tests (fast)
- Run all unit tests:
  ```bash
  cd server
  npm run test:unit
  ```
- Run a single unit test file (isolated):
  ```bash
  # run a specific test file, interactive mode
  npm run test:unit -- tests/unit/collocationDetector.test.ts -i
  ```

Integration tests (managed spaCy via Jest globalSetup)
- Run full integration suite (Jest will start the local spaCy service using `tests/globalSetup.ts`):
  ```bash
  cd server
  npm run test:integration
  ```
- Run a single integration file (this also runs global setup/teardown):
  ```bash
  npm run test:integration -- tests/integration/testCollocationDetector.integration.test.ts -i
  ```

HTTP-only integration tests (server already running)
- Start the server (after `npm run build`) in background and save logs:
  ```bash
  cd server
  nohup node dist/index.js > /tmp/deutsch-server.log 2>&1 &
  ```
- Or start in foreground (dev):
  ```bash
  cd server
  npm run dev
  ```
- Run the HTTP-only integration tests (they expect an HTTP server on port 4000):
  ```bash
  npm run test:integration:http
  ```
- Quick manual API check (curl):
  ```bash
  curl -X POST http://localhost:4000/api/grammar/analyze-detection \
    -H 'Content-Type: application/json' \
    -d '{"text":"Ich warte auf den Bus."}'
  ```

Troubleshooting
- If tests report `fetch failed` or `connection refused`:
  - Verify the server is running: `lsof -i :4000` or `ps aux | grep node`.
  - Check server logs: `tail -n 200 /tmp/deutsch-server.log`.
  - If server started but spaCy not ready, check spaCy logs in the same log file and ensure `python3` + model available.

- If Jest global setup fails to start spaCy:
  - Ensure `spacy-service.py` exists at `server/spacy-service.py`.
  - Ensure Python and spaCy model are installed.
  - Run `python3 server/spacy-service.py` manually to see errors.

- If tests hang or Jest reports open handles:
  - Run with Jest `--detectOpenHandles` to find the culprit.
  - Make sure spaCy child processes are being shut down by tests (globalTeardown). If a previous run left a process, kill it: `pkill -f spacy-service.py`.

- Common quick fixes:
  - Rebuild before running the HTTP tests: `npm run build`.
  - Remove stale Jest cache: `rm -rf node_modules/.cache/jest`.

Useful commands summary
```bash
# Build
cd server && npm run build

# Run all unit tests
npm run test:unit

# Run specific unit test file (interactive)
npm run test:unit -- tests/unit/collocationDetector.test.ts -i

# Run integration tests (with spaCy globalSetup)
npm run test:integration

# Start server and run HTTP-only integration tests
nohup node dist/index.js > /tmp/deutsch-server.log 2>&1 &
npm run test:integration:http
```

If you want, I can add this doc contents into the top-level `TESTING.md` or open a small PR. 
