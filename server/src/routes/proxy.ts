import express from 'express';
import axios from 'axios';

const router = express.Router();

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const API_KEY = process.env.DEEPSEEK_API_KEY;

router.post('/api/proxy/chat', async (req, res) => {
  if (!API_KEY) return res.status(500).json({ error: 'server_missing_api_key' });

  const { messages } = req.body || {};
  if (!messages) return res.status(400).json({ error: 'missing_messages' });

  try {
    const r = await axios.post(
      DEEPSEEK_URL,
      { model: 'deepseek-chat', messages, temperature: 0.7, stream: false },
      { headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' }, timeout: 20000 }
    );

    const body = r.data;
    const content = body?.choices?.[0]?.message?.content ?? null;
    return res.json({ content, raw: body });
  } catch (err: any) {
    console.error('proxy chat error', err?.message || err);
    return res.status(500).json({ error: 'proxy_error', detail: String(err?.message || err) });
  }
});

export default router;
