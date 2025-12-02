/**
 * Grammar Engine - Detection-based approach using spaCy morphology
 * Orchestrates all grammar detectors and merges results
 */

import { TenseDetector } from './detectors/tenseDetector';
import { CaseDetector } from './detectors/caseDetector';
import { PassiveVoiceDetector } from './detectors/passiveVoiceDetector';
import { SubordinateClauseDetector } from './detectors/subordinateClauseDetector';
import { SubjunctiveDetector } from './detectors/subjunctiveDetector';
import { SeparableVerbDetector } from './detectors/separableVerbDetector';
import { ModalVerbDetector } from './detectors/modalVerbDetector';
import { AgreementDetector } from './detectors/agreementDetector';
import { WordOrderDetector } from './detectors/wordOrderDetector';
import { CollocationDetector } from './detectors/collocationDetector';
import { MorphologicalDetector } from './detectors/morphologicalDetector';
import { AdvancedPassiveDetector } from './detectors/advancedPassiveDetector';
import { ConditionalDetector } from './detectors/conditionalDetector';
import { InfinitiveClauseDetector } from './detectors/infinitiveClauseDetector';
import { ExtendedAdjectiveDetector } from './detectors/extendedAdjectiveDetector';
import { RelativeClauseDetector } from './detectors/relativeClauseDetector';
import { ReflexiveVerbDetector } from './detectors/reflexiveVerbDetector';
import { PrepositionDetector } from './detectors/prepositionDetector';
import { CausativeDetector } from './detectors/causativeDetector';
import { AIGrammarDetector } from './detectors/aiGrammarDetector';
import { BaseGrammarDetector, DetectionResult, SentenceData } from './detectors/baseDetector';
import { GrammarCategory, CEFRLevel } from './cefr-taxonomy';

export interface GrammarAnalysisResult {
  sentence: string;
  grammarPoints: DetectionResult[];
  byLevel: Record<CEFRLevel, DetectionResult[]>;
  byCategory: Record<GrammarCategory, DetectionResult[]>;
  summary: {
    totalPoints: number;
    levels: Record<CEFRLevel, number>;
    categories: Record<GrammarCategory, number>;
  };
}

export class GrammarDetectionEngine {
  private detectors: BaseGrammarDetector[] = [
    new TenseDetector(),
    new CaseDetector(),
    new PassiveVoiceDetector(),
    new SubordinateClauseDetector(),
    new SubjunctiveDetector(),
    new SeparableVerbDetector(),
    new ModalVerbDetector(),
    new AgreementDetector(),
    new WordOrderDetector(),
    new CollocationDetector(),
    new MorphologicalDetector(),
    new AdvancedPassiveDetector(),
    new ConditionalDetector(),
    new InfinitiveClauseDetector(),
    new ExtendedAdjectiveDetector(),
    new RelativeClauseDetector(),
    new ReflexiveVerbDetector(),
    new PrepositionDetector(),
    new CausativeDetector(),
  ];

  private aiDetector = new AIGrammarDetector();

  /**
   * Analyze a sentence for grammar points
   */
  analyze(sentenceData: SentenceData): GrammarAnalysisResult {
    // Run all detectors
    const allResults: DetectionResult[] = [];
    for (const detector of this.detectors) {
      const results = detector.detect(sentenceData);
      allResults.push(...results);
    }

    // Deduplicate overlapping results (keep highest confidence)
    const deduplicated = this.deduplicateResults(allResults);

    // Sort by position in text
    deduplicated.sort((a, b) => a.position.start - b.position.start);

    // Merge adjacent results with same grammar point (e.g., dates, passive constructions)
    const merged = this.mergeAdjacentResults(deduplicated, sentenceData);

    // Enhance explanations with context-aware variants
    const enhanced = this.enhanceExplanations(merged, sentenceData);

    // Organize by level and category
    const byLevel = this.organizeByLevel(enhanced);
    const byCategory = this.organizeByCategory(enhanced);

    // Create summary
    const summary = this.createSummary(enhanced, byLevel, byCategory);

    return {
      sentence: sentenceData.text,
      grammarPoints: enhanced,
      byLevel,
      byCategory,
      summary,
    };
  }

  /**
   * Analyze a sentence for grammar points with minimal AI fallback
   * AI only used when rule-based detection finds very few results
   */
  async analyzeWithMinimalAIFallback(sentenceData: SentenceData): Promise<GrammarAnalysisResult> {
    // First run rule-based detectors
    const ruleBasedResult = this.analyze(sentenceData);

    return ruleBasedResult;

    // Only use AI fallback if we have very few grammar points (less than 2)
    // This ensures AI is used sparingly and only for edge cases
    if (ruleBasedResult.summary.totalPoints >= 2) {
      return ruleBasedResult;
    }

    // Run AI detector for additional insights only when rule-based is sparse
    try {
      const aiResults = await this.aiDetector.detectAsync(sentenceData);

      if (aiResults.length > 0) {
        // Combine rule-based and AI results
        const combinedResults = [...ruleBasedResult.grammarPoints, ...aiResults];

        // Deduplicate again
        const deduplicated = this.deduplicateResults(combinedResults);

        // Sort by position in text
        deduplicated.sort((a, b) => a.position.start - b.position.start);

        // Re-organize by level and category
        const byLevel = this.organizeByLevel(deduplicated);
        const byCategory = this.organizeByCategory(deduplicated);
        const summary = this.createSummary(deduplicated, byLevel, byCategory);

        return {
          sentence: sentenceData.text,
          grammarPoints: deduplicated,
          byLevel,
          byCategory,
          summary,
        };
      }
    } catch (error) {
      console.warn('AI fallback failed, using rule-based results only:', error);
    }

    return ruleBasedResult;
  }

  /**
   * Deduplicate results that overlap (keep highest confidence)
   */
  private deduplicateResults(results: DetectionResult[]): DetectionResult[] {
    if (results.length === 0) return [];

    // Group by overlapping positions
    const groups: DetectionResult[][] = [];
    let currentGroup: DetectionResult[] = [];

    for (const result of results) {
      if (currentGroup.length === 0) {
        currentGroup.push(result);
      } else {
        const lastResult = currentGroup[currentGroup.length - 1];
        // Check if overlaps with any in current group
        if (this.overlaps(result, lastResult)) {
          currentGroup.push(result);
        } else {
          groups.push(currentGroup);
          currentGroup = [result];
        }
      }
    }
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    // From each group, keep the one with highest confidence
    return groups.map((group) => {
      return group.reduce((best, current) => (current.confidence > best.confidence ? current : best));
    });
  }

  /**
   * Check if two results overlap
   */
  private overlaps(r1: DetectionResult, r2: DetectionResult): boolean {
    return !(r1.position.end < r2.position.start || r2.position.end < r1.position.start);
  }

  /**
   * Organize results by CEFR level
   */
  private organizeByLevel(
    results: DetectionResult[],
  ): Record<CEFRLevel, DetectionResult[]> {
    const organized: Record<CEFRLevel, DetectionResult[]> = {
      A1: [],
      A2: [],
      B1: [],
      B2: [],
      C1: [],
      C2: [],
    };

    for (const result of results) {
      organized[result.grammarPoint.level].push(result);
    }

    return organized;
  }

  /**
   * Organize results by grammar category
   */
  private organizeByCategory(
    results: DetectionResult[],
  ): Record<GrammarCategory, DetectionResult[]> {
    const organized: Record<GrammarCategory, DetectionResult[]> = {
      tense: [],
      case: [],
      voice: [],
      mood: [],
      agreement: [],
      article: [],
      adjective: [],
      pronoun: [],
      preposition: [],
      conjunction: [],
      'verb-form': [],
      'word-order': [],
      'separable-verb': [],
      'modal-verb': [],
      'reflexive-verb': [],
      passive: [],
    };

    for (const result of results) {
      if (result.grammarPoint.category in organized) {
        organized[result.grammarPoint.category].push(result);
      }
    }

    return organized;
  }

  /**
   * Create summary statistics
   */
  private createSummary(
    results: DetectionResult[],
    byLevel: Record<CEFRLevel, DetectionResult[]>,
    byCategory: Record<GrammarCategory, DetectionResult[]>,
  ) {
    const levels: Record<CEFRLevel, number> = {
      A1: byLevel.A1.length,
      A2: byLevel.A2.length,
      B1: byLevel.B1.length,
      B2: byLevel.B2.length,
      C1: byLevel.C1.length,
      C2: byLevel.C2.length,
    };

    const categories: Record<GrammarCategory, number> = {
      tense: byCategory.tense.length,
      case: byCategory.case.length,
      voice: byCategory.voice.length,
      mood: byCategory.mood.length,
      agreement: byCategory.agreement.length,
      article: byCategory.article.length,
      adjective: byCategory.adjective.length,
      pronoun: byCategory.pronoun.length,
      preposition: byCategory.preposition.length,
      conjunction: byCategory.conjunction.length,
      'verb-form': byCategory['verb-form'].length,
      'word-order': byCategory['word-order'].length,
      'separable-verb': byCategory['separable-verb'].length,
      'modal-verb': byCategory['modal-verb'].length,
      'reflexive-verb': byCategory['reflexive-verb'].length,
      passive: byCategory.passive.length,
    };

    return {
      totalPoints: results.length,
      levels,
      categories,
    };
  }

  /**
   * Merge adjacent results with same grammar point ID
   * Useful for temporal dates (4. Juni 2008) and passive constructions (wurden eingeladen)
   * that are detected as separate tokens but should be one highlighted region
   */
  private mergeAdjacentResults(results: DetectionResult[], sentenceData: SentenceData): DetectionResult[] {
    if (results.length <= 1) return results;

    const merged: DetectionResult[] = [];
    let i = 0;

    while (i < results.length) {
      let current = results[i];
      let j = i + 1;

      // Look for adjacent results with same grammar point ID
      while (j < results.length) {
        const next = results[j];

        // Check if they're the same grammar point and adjacent/overlapping
        if (
          current.grammarPointId === next.grammarPointId &&
          current.position.end >= next.position.start - 1 // Adjacent or overlapping (allow 1 char gap for spaces)
        ) {
          // Merge: expand current position to include next
          current = {
            ...current,
            position: {
              start: Math.min(current.position.start, next.position.start),
              end: Math.max(current.position.end, next.position.end),
            },
            confidence: Math.max(current.confidence, next.confidence),
            details: {
              ...current.details,
              ...next.details,
              mergedTokens: (current.details?.mergedTokens || 1) + 1,
            },
          };
          j++;
        } else {
          break;
        }
      }

      merged.push(current);
      i = j;
    }

    return merged;
  }

  /**
   * Enhance explanations with context-aware variants
   * For grammar points with contextVariants, select the appropriate explanation
   * based on details detected during analysis
   */
  private enhanceExplanations(results: DetectionResult[], sentenceData: SentenceData): DetectionResult[] {
    return results.map(result => {
      // Check if this grammar point has context variants
      if (result.grammarPoint.contextVariants) {
        let selectedContext: string | null = null;

        // Determine which context applies
        if (result.grammarPoint.id === 'a2-dative-case') {
          // Dative case - check for dative context in details
          const dativeContext = result.details?.dativeContext;
          if (dativeContext && result.grammarPoint.contextVariants[dativeContext]) {
            selectedContext = dativeContext;
          }
        }

        // If we found a matching context, update the explanation
        if (selectedContext && result.grammarPoint.contextVariants[selectedContext]) {
          return {
            ...result,
            grammarPoint: {
              ...result.grammarPoint,
              explanation: result.grammarPoint.contextVariants[selectedContext],
            },
          };
        }
      }

      return result;
    });
  }

  /**
   * Get all registered detectors
   */
  getDetectors(): BaseGrammarDetector[] {
    return this.detectors;
  }

  /**
   * Register a custom detector
   */
  registerDetector(detector: BaseGrammarDetector): void {
    this.detectors.push(detector);
  }
}

// Export singleton instance
export const grammarDetectionEngine = new GrammarDetectionEngine();

