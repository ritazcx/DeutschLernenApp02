import axios from 'axios';
import { DictionaryEntry } from '../types';
import { config } from '../config';

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

export async function fetchDictionaryEntry(word: string): Promise<DictionaryEntry> {

  const prompt = `You are a German dictionary expert. For the German word or phrase "${word}", provide a JSON object with these fields:
- word: the German word
- level: CEFR level (A1, A2, B1, B2, C1, or C2 only)
- pos: part of speech (noun, verb, adjective, adverb, preposition, pronoun, conjunction, interjection, or particle)
- article: for nouns only (der, die, das, or null)
- plural: plural form for nouns (or null)
- gender: article/gender (der=m, die=f, das=n)
- translation: brief English translation
- definition: concise German definition
- example_german: example sentence in German
- example_english: English translation of example
- difficulty: same as level field

Be accurate with CEFR levels. Return valid JSON only.`;

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
        Authorization: `Bearer ${config.deepseekApiKey}`,
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
    // Additional fields for database insertion
    level: parsed.level || 'B1',
    pos: parsed.pos || null,
    article: parsed.article || null,
    plural: parsed.plural || null,
    meaning_de: parsed.definition || '',
  } as any;

  return entry;
}
