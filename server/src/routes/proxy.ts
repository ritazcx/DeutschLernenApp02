import express from 'express';
import axios from 'axios';
import { createValidationError, ErrorCode, AppError } from '../utils/errors';
import { asyncHandler } from '../middleware/errorHandler';
import { config } from '../config';

const router = express.Router();

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

router.post('/api/proxy/chat', asyncHandler(async (req, res) => {
  const { messages } = req.body || {};
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw createValidationError('Messages array is required and must not be empty');
  }

  try {
    const r = await axios.post(
      DEEPSEEK_URL,
      { model: 'deepseek-chat', messages, temperature: 0.7, stream: false },
      { headers: { Authorization: `Bearer ${config.deepseekApiKey}`, 'Content-Type': 'application/json' }, timeout: 20000 }
    );

    const body = r.data;
    const content = body?.choices?.[0]?.message?.content ?? null;
    res.json({ content, raw: body });
  } catch (err: any) {
    // Convert axios/network errors to proxy errors
    throw new AppError(
      ErrorCode.PROXY_ERROR,
      'Failed to communicate with external service',
      502, // Bad Gateway
      err?.message || String(err)
    );
  }
}));

export default router;
