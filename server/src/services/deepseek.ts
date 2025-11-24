import axios from 'axios';
import { DictionaryEntry } from '../types';

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const API_KEY = process.env.DEEPSEEK_API_KEY;

export async function fetchDictionaryEntry(word: string): Promise<DictionaryEntry> {
  if (!API_KEY) throw new Error('DEEPSEEK_API_KEY not set');

  const prompt = `You are a concise German dictionary generator. Provide a JSON object for the term: "${word}" with the following fields: word, gender, translation, definition, example_german, example_english, difficulty, image_url. Keep responses compact and valid JSON.`;

  const res = await axios.post(
    DEEPSEEK_URL,
    {
      model: 'deepseek-chat',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.2,
      stream: false,
    },
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    }
  );

  const body = res.data;
  // defensive parsing
  let text = '';
  try {
    text = body.choices?.[0]?.message?.content ?? JSON.stringify(body);
  } catch (e) {
    text = JSON.stringify(body);
  }

  let parsed: any = null;
  try { parsed = JSON.parse(text); } catch (e) {
    const m = String(text).match(/\{[\s\S]*\}/);
    if (m) {
      try { parsed = JSON.parse(m[0]); } catch (e2) { parsed = null; }
    }
  }

  if (!parsed) throw new Error('Failed to parse DeepSeek response');

  const entry: DictionaryEntry = {
    word: parsed.word || word,
    gender: parsed.gender || parsed.article || '',
    translation: parsed.translation || parsed.meaning || '',
    definition: parsed.definition || parsed.def || '',
    example_german: parsed.example_german || parsed.example || parsed.examples?.[0] || '',
    example_english: parsed.example_english || parsed.example_en || '',
    difficulty: parsed.difficulty || '',
    image_url: parsed.image_url || parsed.imageUrl || undefined,
  };

  return entry;
}
