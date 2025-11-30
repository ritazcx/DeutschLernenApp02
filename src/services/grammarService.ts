import { ArticleAnalysis, GrammarType, SentenceAnalysis, GrammarPoint } from '../types/grammar';

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
 * Simple grammar detection for quick testing
 */
export async function analyzeTextWithDetection(text: string): Promise<{
  success: boolean;
  text: string;
  cefrLevel: string;
  sentences: Array<{
    sentence: string;
    analysis: {
      grammarPoints: Array<{
        id: string;
        category: string;
        level: string;
        text: string;
        startPos: number;
        endPos: number;
        explanation: string;
        details?: Record<string, any>;
        tokenIndices: number[];
      }>;
      hasErrors: boolean;
      summary: {
        totalPoints: number;
        byLevel: Record<string, number>;
        byCategory: Record<string, number>;
      };
    };
    error?: string;
  }>;
  summary: {
    totalSentences: number;
    totalGrammarPoints: number;
    errorSentences: number;
  };
}> {
  // For quick testing, return mock data
  const mockGrammarPoints = [
    {
      id: '1',
      category: 'tense',
      level: 'A1',
      text: 'bin',
      startPos: 4,
      endPos: 7,
      explanation: 'Present tense of "sein" (to be)',
      tokenIndices: [1],
    },
    {
      id: '2',
      category: 'article',
      level: 'A1',
      text: 'Student',
      startPos: 8,
      endPos: 15,
      explanation: 'Masculine noun with no article (nominative case)',
      tokenIndices: [2],
    }
  ];

  return {
    success: true,
    text,
    cefrLevel: 'A1',
    sentences: [{
      sentence: text,
      analysis: {
        grammarPoints: mockGrammarPoints,
        hasErrors: false,
        summary: {
          totalPoints: mockGrammarPoints.length,
          byLevel: { A1: mockGrammarPoints.length },
          byCategory: { tense: 1, article: 1 }
        }
      }
    }],
    summary: {
      totalSentences: 1,
      totalGrammarPoints: mockGrammarPoints.length,
      errorSentences: 0
    }
  };
}
    'agreement': 'special',
    'adjective': 'special',
    'preposition': 'special',
    'verb-form': 'verb',
    'reflexive-verb': 'special_construction',
  };

  return categoryMap[category] || 'special';
}

/**
 * Analyze text using rule-based grammar detection (new system)
 * Fast and comprehensive coverage of A1-C2 grammar points
 */
export async function analyzeTextWithDetection(text: string): Promise<ArticleAnalysis> {
  const base = SERVER_API_BASE || '';
  const res = await fetch(`${base}/api/grammar/analyze-detection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Grammar detection analysis error: ${res.status} ${err}`);
  }

  const data = await res.json();

  // Convert backend format to frontend format
  const sentences: SentenceAnalysis[] = [{
    sentence: data.sentence,
    translation: '', // Rule-based system doesn't provide translations
    grammarPoints: convertDetectionResultsToGrammarPoints(data.grammarPoints),
  }];

  return { sentences };
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
