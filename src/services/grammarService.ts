import { ArticleAnalysis, GrammarType, CEFRLevel, SentenceAnalysis, GrammarPoint } from '../types/grammar';
import { translateOrExplain } from './apiAdapter';

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
  sentences: SentenceAnalysis[];
}> {
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

  // Convert backend format to frontend SentenceAnalysis format
  const sentences: SentenceAnalysis[] = await Promise.all(
    data.sentences.map(async (sentenceData: any) => {
      // Get translation for each sentence
      let translation = '';
      try {
        const translationResult = await translateOrExplain(`Translate this German sentence to English: "${sentenceData.sentence}"`);
        // Extract just the translation part (remove any explanation)
        const lines = translationResult.split('\n');
        translation = lines[0] || translationResult;
      } catch (error) {
        console.warn('Failed to get translation for sentence:', sentenceData.sentence, error);
        translation = 'Translation unavailable';
      }

      return {
        sentence: sentenceData.sentence,
        translation,
        grammarPoints: convertDetectionResultsToGrammarPoints(sentenceData.grammarPoints, sentenceData.sentence),
        vocabularyPoints: []
      };
    })
  );

  return { sentences };
}

/**
 * Convert backend DetectionResult[] to frontend GrammarPoint[] format
 */
function convertDetectionResultsToGrammarPoints(
  detectionResults: any[],
  originalText: string
): GrammarPoint[] {
  return detectionResults.map((result: any) => {
    // Extract the highlighted text from the original text using position
    const highlightedText = originalText.substring(result.position.start, result.position.end);

    return {
      type: result.grammarPoint.category as GrammarType, // Use backend category directly
      level: result.grammarPoint.level as CEFRLevel, // Include CEFR level
      text: highlightedText,
      explanation: result.grammarPoint.explanation,
      position: {
        start: result.position.start,
        end: result.position.end
      }
    };
  });
}

/**
 * Determine overall CEFR level based on detected grammar points
 */
function getOverallCEFRLevel(levels: Record<string, number>): string {
  const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const levelCounts = levelOrder.map(level => levels[level] || 0);

  // Find the highest level with grammar points
  for (let i = levelOrder.length - 1; i >= 0; i--) {
    if (levelCounts[i] > 0) {
      return levelOrder[i];
    }
  }

  return 'A1'; // Default fallback
}

/**
 * Map backend grammar categories to frontend grammar types
 */
function mapGrammarCategoryToType(category: string): GrammarType {
  // For backward compatibility, but we're now using backend categories directly
  const categoryMap: Record<string, GrammarType> = {
    'tense': 'tense',
    'case': 'case',
    'voice': 'voice',
    'mood': 'mood',
    'agreement': 'agreement',
    'article': 'article',
    'adjective': 'adjective',
    'pronoun': 'pronoun',
    'preposition': 'preposition',
    'conjunction': 'conjunction',
    'verb-form': 'verb-form',
    'word-order': 'word-order',
    'separable-verb': 'separable-verb',
    'modal-verb': 'modal-verb',
    'reflexive-verb': 'special-construction',
    'passive': 'passive',
    'noun': 'noun',
    'collocation': 'collocation',
    'special-construction': 'special-construction'
  };

  return categoryMap[category] || 'special-construction';
}
