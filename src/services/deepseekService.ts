import { DictionaryEntry, ChatMessage } from '@/types';

const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = "https://api.deepseek.com/chat/completions";

// --- Chat ---
export async function generateFromDeepSeek(messages: ChatMessage[]) {
  const res = await fetch(DEEPSEEK_BASE_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      temperature: 0.7,
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  // defensive access
  if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Unexpected DeepSeek response shape');
  }
  return data.choices[0].message.content;
}

// --- Word of the Day ---
export async function fetchWordOfTheDay(level: string = "A2"): Promise<DictionaryEntry> {
  const prompt = `
You are a German dictionary assistant.
Generate a useful German word for a ${level} learner.
Return a JSON object with word, gender, translation, definition, exampleSentenceGerman, exampleSentenceEnglish, difficulty.
`;

  const responseText = await generateFromDeepSeek([{ role: "system", content: prompt }]);
  let parsed: any;
  try {
    parsed = typeof responseText === 'string' ? JSON.parse(responseText) : responseText;
  } catch (err) {
    // If parsing fails, try to extract JSON-like substring
    const m = String(responseText).match(/\{[\s\S]*\}/);
    if (m) {
      try {
        parsed = JSON.parse(m[0]);
      } catch (err2) {
        throw new Error('Failed to parse DeepSeek response as JSON');
      }
    } else {
      throw new Error('DeepSeek response is not JSON');
    }
  }

  // Normalize properties to ensure UI fields exist
  const entry: DictionaryEntry = {
    word: parsed.word || parsed.term || parsed.text || '',
    gender: parsed.gender || parsed.article || '',
    translation: parsed.translation || parsed.meaning || '',
    definition: parsed.definition || parsed.def || '',
    exampleSentenceGerman: parsed.exampleSentenceGerman || parsed.example || parsed.examples?.[0] || '',
    exampleSentenceEnglish: parsed.exampleSentenceEnglish || parsed.example_en || '',
    difficulty: parsed.difficulty || level || '',
    imageUrl: parsed.imageUrl || undefined,
  };

  return entry;
}

// --- Search Word ---
export async function searchDictionaryWord(term: string): Promise<DictionaryEntry> {
  const prompt = `
You are a German dictionary assistant.
Provide a dictionary entry for the word or phrase: "${term}".
Return JSON object with word, gender, translation, definition, exampleSentenceGerman, exampleSentenceEnglish, difficulty.
`;
  const responseText = await generateFromDeepSeek([{ role: "system", content: prompt }]);
  let parsed: any;
  try {
    parsed = typeof responseText === 'string' ? JSON.parse(responseText) : responseText;
  } catch (err) {
    const m = String(responseText).match(/\{[\s\S]*\}/);
    if (m) {
      try { parsed = JSON.parse(m[0]); } catch (e) { parsed = null; }
    }
  }

  const entry: DictionaryEntry = {
    word: parsed?.word || term,
    gender: parsed?.gender || parsed?.article || '',
    translation: parsed?.translation || '',
    definition: parsed?.definition || parsed?.def || '',
    exampleSentenceGerman: parsed?.exampleSentenceGerman || parsed?.example || parsed?.examples?.[0] || '',
    exampleSentenceEnglish: parsed?.exampleSentenceEnglish || parsed?.example_en || '',
    difficulty: parsed?.difficulty || '',
    imageUrl: parsed?.imageUrl || undefined,
  };

  return entry;
}

// --- Translator / Writing Assistant ---
export async function translateOrExplain(query: string): Promise<string> {
  const prompt = `User Query: "${query}"

Act as a German Language Writing Assistant.
1. If the input is German: Correct any grammar/spelling errors. Provide the corrected version and a brief explanation.
2. If the input is English: Translate it to natural-sounding German and provide a usage example.
3. If it is a question about German: Answer it clearly and concisely.

Return your answer as plain text.`;

  const responseText = await generateFromDeepSeek([{ role: 'system', content: prompt }]);
  return responseText;
}
