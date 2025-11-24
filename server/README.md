# DeutschFlow Server

This is a minimal Node.js + Express + TypeScript backend used by the app to store dictionary entries in SQLite and to fetch missing entries from DeepSeek.

Quick start

1. Install dependencies

```bash
cd server
npm install
```

2. Create `.env` from `.env.example` and set `DEEPSEEK_API_KEY`

3. Run in dev

```bash
npm run dev
```

Endpoints

- GET `/api/dictionary/:word` — returns a stored entry or calls DeepSeek, stores and returns it.
- POST `/api/dictionary` — upsert a dictionary entry (JSON body).

Example

```bash
curl http://localhost:4000/api/dictionary/Haus

curl -X POST http://localhost:4000/api/dictionary \ 
  -H 'Content-Type: application/json' \
  -d '{"word":"Haus","translation":"house","gender":"das"}'
```
