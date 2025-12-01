import * as deepseek from './deepseekService';
import * as gemini from '../legacy/geminiService';
import * as mockDictionary from './dictionaryService';

const SERVER_API_BASE = import.meta.env.VITE_DICTIONARY_API_BASE || '';

// Simple in-memory caches
const wordOfDayCache: Map<string, { value: any; expires: number }> = new Map();
const searchCache: Map<string, { value: any; expires: number }> = new Map();

const now = () => Date.now();

function setCache(map: Map<string, { value: any; expires: number }>, key: string, value: any, ttlMs: number) {
  map.set(key, { value, expires: now() + ttlMs });
}

function getCache(map: Map<string, { value: any; expires: number }>, key: string) {
  const item = map.get(key);
  if (!item) return null;
  if (item.expires < now()) {
    map.delete(key);
    return null;
  }
  return item.value;
}

const PREFERRED_PROVIDER = import.meta.env.VITE_PREFERRED_AI_PROVIDER || 'deepseek';

export async function fetchWordOfTheDay(level: string = 'A2') {
  // Check cache first (1 hour TTL)
  const cacheKey = `wod:${level}`;
  const cached = getCache(wordOfDayCache, cacheKey);
  if (cached) return cached;

  // Fast-fallback behavior: if DeepSeek is slow, return mock quickly and update later.
  const deepseekPromise = (async () => {
    if (PREFERRED_PROVIDER === 'gemini' && gemini.fetchWordOfTheDay) {
      try { return await gemini.fetchWordOfTheDay(level); } catch { /* fallback */ }
    }
    return await deepseek.fetchWordOfTheDay(level);
  })();

  // If DeepSeek resolves quickly (< 900ms), use it. Otherwise return mock and dispatch update when ready.
  const timeoutMs = 900;
  const timeoutPromise = new Promise((resolve) => setTimeout(async () => {
    const mock = await mockDictionary.fetchWordOfTheDay(level);
    resolve({ from: 'mock', value: mock });
  }, timeoutMs));

  const winner = await Promise.race([
    deepseekPromise.then((v) => ({ from: 'deepseek', value: v })),
    timeoutPromise,
  ] as any);

  // If winner is deepseek, cache and return it
  if ((winner as any).from === 'deepseek') {
    setCache(wordOfDayCache, cacheKey, (winner as any).value, 1000 * 60 * 60);
    return (winner as any).value;
  }

  // Otherwise, return the mock quickly and schedule update when deepseek finishes
  const quick = (winner as any).value;
  deepseekPromise.then((real) => {
    try {
      setCache(wordOfDayCache, cacheKey, real, 1000 * 60 * 60);
      // notify UI that a better result arrived
      window?.dispatchEvent(new CustomEvent('deepseek:wod:update', { detail: { level, data: real } }));
    } catch (e) {
      // ignore
    }
  }).catch(() => {});

  return quick;
}

export async function searchDictionaryWord(term: string) {
  const cacheKey = `search:${term.toLowerCase()}`;
  const cached = getCache(searchCache, cacheKey);
  if (cached) return cached;

  try {
    const base = SERVER_API_BASE || '';
    const resp = await fetch(`${base}/api/dictionary/${encodeURIComponent(term)}`);
    
    if (!resp.ok) {
      throw new Error(`Server error: ${resp.status}`);
    }
    
    const json = await resp.json();
    setCache(searchCache, cacheKey, json, 1000 * 60 * 60); // Cache for 1 hour
    return json;
  } catch (error: any) {
    console.error(`Failed to search dictionary for "${term}":`, error);
    throw error;
  }
}

export async function translateOrExplain(query: string) {
  if (PREFERRED_PROVIDER === 'deepseek') return deepseek.translateOrExplain(query);
  return gemini.translateOrExplain ? gemini.translateOrExplain(query) : deepseek.translateOrExplain(query);
}

export async function translateGermanToEnglish(germanText: string) {
  return deepseek.translateGermanToEnglish(germanText);
}

// TTS left to provider preference, but default to gemini if available (per your request to leave TTS alone)
export async function generateSpeech(text: string) {
  return gemini.generateSpeech ? gemini.generateSpeech(text) : undefined;
}

export const createTutorChat = () => {
  return gemini.createTutorChat ? gemini.createTutorChat() : undefined;
};

export async function generateChat(messages: any[]) {
  if (PREFERRED_PROVIDER === 'deepseek' && deepseek.generateFromDeepSeek) return deepseek.generateFromDeepSeek(messages);
  if (gemini.generateFromGemini) return gemini.generateFromGemini(messages as any);
  // fallback to deepseek if nothing else
  return deepseek.generateFromDeepSeek(messages);
}

export default {
  fetchWordOfTheDay,
  searchDictionaryWord,
  translateOrExplain,
  translateGermanToEnglish,
  generateSpeech,
  createTutorChat,
};
