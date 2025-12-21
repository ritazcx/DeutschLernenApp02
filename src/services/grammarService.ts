import { ArticleAnalysis, GrammarType, CEFRLevel, SentenceAnalysis, GrammarPoint } from '../types/grammar';
import { translateOrExplain, translateGermanToEnglish } from './apiAdapter';
import { fetchWithErrorHandling, logError, getUserFriendlyMessage } from '../utils/errorHandler';
import { config } from '../config';

/**
 * Analyze text using rule-based grammar detection
 */
export async function analyzeTextWithDetection(text: string): Promise<{
  sentences: SentenceAnalysis[];
}> {
  const base = config.serverApiBase || '';
  
  try {
    const data = await fetchWithErrorHandling<{
      success: boolean;
      sentences: any[];
      summary: any;
    }>(`${base}/api/grammar/analyze-detection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    // Convert backend format to frontend SentenceAnalysis format
    const sentences: SentenceAnalysis[] = await Promise.all(
      data.sentences.map(async (sentenceData: any) => {
        // Get translation for each sentence
        let translation = '';
        try {
          translation = await translateGermanToEnglish(sentenceData.sentence);
        } catch (error) {
          // Log error but continue with translation unavailable
          logError(error instanceof Error ? error : new Error(String(error)), {
            context: 'translateGermanToEnglish',
            sentence: sentenceData.sentence,
          });
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
  } catch (error) {
    // Log error with context
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'analyzeTextWithDetection',
      textLength: text.length,
    });
    // Re-throw to let caller handle
    throw error;
  }
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

