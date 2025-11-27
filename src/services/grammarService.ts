import { ArticleAnalysis } from '../types/grammar';

const SERVER_API_BASE = import.meta.env.VITE_DICTIONARY_API_BASE || '';

export async function analyzeArticle(text: string): Promise<ArticleAnalysis> {
  const base = SERVER_API_BASE || '';
  const res = await fetch(`${base}/api/grammar/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Grammar analysis error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data as ArticleAnalysis;
}
