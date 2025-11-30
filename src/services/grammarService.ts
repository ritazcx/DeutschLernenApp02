import { ArticleAnalysis, GrammarType } from '../types/grammar';

const SERVER_API_BASE = import.meta.env.VITE_DICTIONARY_API_BASE || '';

export async function analyzeArticle(
  text: string, 
  grammarTypes?: GrammarType[],
  vocabularyLevels?: string[]
): Promise<ArticleAnalysis> {
  const base = SERVER_API_BASE || '';
  const res = await fetch(`${base}/api/grammar/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, grammarTypes, vocabularyLevels }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Grammar analysis error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data as ArticleAnalysis;
}

/**
 * Analyze article using NLP-based grammar rules (new approach)
 * More accurate and faster than AI-based analysis
 */
export async function analyzeArticleWithNLP(
  text: string,
  cefrLevel: string = 'B1'
): Promise<any> {
  const base = SERVER_API_BASE || '';
  const res = await fetch(`${base}/api/grammar/analyze-nlp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, cefrLevel }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`NLP grammar analysis error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data;
}

/**
 * Analyze single sentence using NLP-based grammar rules
 */
export async function analyzeSentenceWithNLP(
  sentence: string,
  cefrLevel: string = 'B1'
): Promise<any> {
  const base = SERVER_API_BASE || '';
  const res = await fetch(`${base}/api/grammar/analyze-sentence-nlp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sentence, cefrLevel }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`NLP sentence analysis error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data;
}
