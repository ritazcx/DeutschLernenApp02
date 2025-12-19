import express from 'express';
import axios from 'axios';
import { createValidationError, ErrorCode, AppError } from '../utils/errors';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const API_KEY = process.env.DEEPSEEK_API_KEY;

router.post('/api/proxy/chat', asyncHandler(async (req, res) => {
  if (!API_KEY) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      'Server configuration error: API key is missing',
      500,
      undefined,
      false // Programming error - should be configured
    );
  }

  const { messages } = req.body || {};
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw createValidationError('Messages array is required and must not be empty');
  }

  try {
    const r = await axios.post(
      DEEPSEEK_URL,
      { model: 'deepseek-chat', messages, temperature: 0.7, stream: false },
      { headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' }, timeout: 20000 }
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
