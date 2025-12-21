import { DictionaryEntry, ChatMessage } from '@/types';
import { fetchWithErrorHandling, logError } from '../utils/errorHandler';
import { config } from '../config';

// --- Chat ---
export async function generateFromDeepSeek(messages: ChatMessage[]) {
  // Proxy the request to the server so the API key is never exposed to the browser.
  const base = config.serverApiBase || '';
  
  try {
    const data = await fetchWithErrorHandling<{ content?: string; result?: string }>(`${base}/api/proxy/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
    
    return data?.content ?? data?.result ?? JSON.stringify(data);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'generateFromDeepSeek',
      messageCount: messages.length,
    });
    throw error;
  }
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
        const parseError = new Error('Failed to parse DeepSeek response as JSON');
        logError(parseError, { context: 'fetchWordOfTheDay', responseText });
        throw parseError;
      }
    } else {
      const parseError = new Error('DeepSeek response is not JSON');
      logError(parseError, { context: 'fetchWordOfTheDay', responseText });
      throw parseError;
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
      try { 
        parsed = JSON.parse(m[0]); 
      } catch (e) { 
        logError(e instanceof Error ? e : new Error(String(e)), {
          context: 'searchDictionaryWord',
          term,
          responseText,
        });
        parsed = null; 
      }
    } else {
      logError(new Error('Failed to parse DeepSeek response'), {
        context: 'searchDictionaryWord',
        term,
        responseText,
      });
      parsed = null;
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

// --- German to English Translation ---
export async function translateGermanToEnglish(germanText: string): Promise<string> {
  const prompt = `Translate the following German text to natural, accurate English. Provide only the English translation without any additional explanation or notes:

German: "${germanText}"

English:`;

  const responseText = await generateFromDeepSeek([{ role: 'system', content: prompt }]);
  return responseText.trim();
}
