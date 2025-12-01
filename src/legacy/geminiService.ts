import { DictionaryEntry } from '@/types';

// This legacy module previously used the Google GenAI SDK in the browser, which caused
// the runtime error "An API Key must be set when running in a browser" because the
// SDK was being constructed at import time. To avoid bundling the SDK into the
// client, we use server proxy endpoints when running in the browser and only
// dynamically import the SDK server-side if needed.

const isBrowser = typeof window !== 'undefined';

async function proxyChat(messages: any[]) {
  const base = typeof window !== 'undefined' ? (import.meta.env.VITE_DICTIONARY_API_BASE || '') : '';
  const resp = await fetch(`${base}/api/proxy/chat`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages })
  });
  if (!resp.ok) throw new Error(`proxy failed: ${resp.status}`);
  const body = await resp.json();
  return body.content ?? null;
}

export const fetchWordOfTheDay = async (difficulty: string = 'A2'): Promise<DictionaryEntry> => {
  if (isBrowser) {
    const prompt = `Generate a useful German word for a ${difficulty} level learner. Return JSON with fields: word, gender, translation, definition, exampleSentenceGerman, exampleSentenceEnglish, difficulty.`;
    const content = await proxyChat([{ role: 'system', content: prompt }]);
    try { return JSON.parse(content); } catch { return { word: '', gender: '', translation: '', definition: '', exampleSentenceGerman: '', exampleSentenceEnglish: '', difficulty } as DictionaryEntry; }
  }

  // server-side: dynamically import Google SDK only if running on Node and needed
  const mod = await import('@google/genai');
  const { GoogleGenAI, Type } = mod as any;
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY });
  const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: `Generate a useful German word for a ${difficulty} level learner.`, config: { responseMimeType: 'application/json' } });
  const text = response.text; if (!text) throw new Error('No data returned');
  return JSON.parse(text) as DictionaryEntry;
};

export const searchDictionaryWord = async (term: string): Promise<DictionaryEntry> => {
  if (isBrowser) {
    // prefer server cache endpoint
    try {
      const base = import.meta.env.VITE_DICTIONARY_API_BASE || '';
      const resp = await fetch(`${base}/api/dictionary/${encodeURIComponent(term)}`);
      if (resp.ok) return await resp.json();
    } catch (e) {}
    const prompt = `Provide a dictionary entry for the word: "${term}". Return JSON with fields word, gender, translation, definition, exampleSentenceGerman, exampleSentenceEnglish.`;
    const content = await proxyChat([{ role: 'system', content: prompt }]);
    try { return JSON.parse(content); } catch { return { word: term, gender: '', translation: '', definition: '', exampleSentenceGerman: '', exampleSentenceEnglish: '', difficulty: '' } as DictionaryEntry; }
  }

  const mod = await import('@google/genai');
  const { GoogleGenAI } = mod as any;
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY });
  const textResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: `Provide a dictionary entry for: "${term}". Return JSON.` });
  const text = textResponse.text; if (!text) throw new Error('No data');
  return JSON.parse(text) as DictionaryEntry;
};

export const createTutorChat = async () => {
  if (isBrowser) {
    // Return a lightweight client that posts messages to the server proxy and returns a simple { text } shape
    return {
      sendMessage: async ({ message }: { message: string }) => {
        const prompt = `You are 'Hans', a friendly, patient German tutor. Reply concisely in German with corrections at end in format [Correction: ...]. User: ${message}`;
        const content = await proxyChat([{ role: 'system', content: prompt }]);
        return { text: content };
      }
    } as any;
  }

  const mod = await import('@google/genai');
  const { GoogleGenAI } = mod as any;
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY });
  return ai.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction: `You are 'Hans', a friendly German tutor.` } });
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
  if (isBrowser) {
    try {
      // Proxy to server TTS endpoint if available (reuse proxy chat may not return audio); fallback: no-op
      const base = import.meta.env.VITE_DICTIONARY_API_BASE || '';
      const resp = await fetch(`${base}/api/tts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      if (resp.ok) {
        const json = await resp.json();
        return json?.audioBase64;
      }
    } catch (e) {}
    return undefined;
  }

  const mod = await import('@google/genai');
  const { GoogleGenAI, Modality } = mod as any;
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-preview-tts', contents: [{ parts: [{ text }] }], config: { responseModalities: [Modality.AUDIO] } });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (err) {
    console.error('TTS Error', err);
    return undefined;
  }
};

export const translateOrExplain = async (query: string): Promise<string> => {
  if (isBrowser) {
    const prompt = `User Query: "${query}"

Act as a German Language Writing Assistant.
1. If the input is German: Correct any grammar/spelling errors. Provide the corrected version and a brief explanation.
2. If the input is English: Translate it to natural-sounding German and provide a usage example.
3. If it is a question about German: Answer it clearly and concisely.

Return your answer as plain text.`;
    const content = await proxyChat([{ role: 'system', content: prompt }]);
    return content;
  }

  const mod = await import('@google/genai');
  const { GoogleGenAI } = mod as any;
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY });
  const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: [{ parts: [{ text: `Act as a German Language Writing Assistant. Query: "${query}"` }] }] });
  const text = response.text; if (!text) throw new Error('No data');
  return text;
};

export const generateFromGemini = async (messages: any[]): Promise<string> => {
  if (isBrowser) {
    return await proxyChat(messages);
  }

  const mod = await import('@google/genai');
  const { GoogleGenAI } = mod as any;
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY });
  const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: messages.map(m => ({ parts: [{ text: m.content || m.text }] })) });
  const text = response.text; if (!text) throw new Error('No data');
  return text;
};
