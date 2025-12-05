/**
 * Grammar Engine - Detection-based approach using spaCy morphology
 * Orchestrates all grammar detectors and merges results
 */

// A1 Level Detectors
import { TenseDetector } from './detectors/A1/tenseDetector';

// A2 Level Detectors
import { CaseDetector } from './detectors/A2/caseDetector';
import { PrepositionDetector } from './detectors/A2/prepositionDetector';
import { ReflexiveVerbDetector } from './detectors/A2/reflexiveVerbDetector';
import { WordOrderDetector } from './detectors/A2/wordOrderDetector';

// B1 Level Detectors
import { AgreementDetector } from './detectors/B1/agreementDetector';
import { CollocationDetector } from './detectors/B1/collocationDetector';
import { ModalVerbDetector } from './detectors/B1/modalVerbDetector';
import { MorphologicalDetector } from './detectors/B1/morphologicalDetector';
import { PassiveVoiceDetector } from './detectors/B1/passiveVoiceDetector';
import { SeparableVerbDetector } from './detectors/B1/separableVerbDetector';
import { SubjunctiveDetector } from './detectors/B1/subjunctiveDetector';
import { SubordinateClauseDetector } from './detectors/B1/subordinateClauseDetector';

// B2 Level Detectors
import { AdvancedPassiveDetector } from './detectors/B2/advancedPassiveDetector';
import { CausativeDetector } from './detectors/B2/causativeDetector';
import { ConditionalDetector } from './detectors/B2/conditionalDetector';
import { FunctionalVerbDetector } from './detectors/B2/functionalVerbDetector';
import { InfinitiveClauseDetector } from './detectors/B2/infinitiveClauseDetector';
import { ParticipialAttributeDetector } from './detectors/B2/participialAttributeDetector';

// Shared
import { BaseGrammarDetector, DetectionResult, SentenceData } from './detectors/shared/baseDetector';
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
    new ParticipialAttributeDetector(),
    new ReflexiveVerbDetector(),
    new PrepositionDetector(),
    new CausativeDetector(),
    new FunctionalVerbDetector(),
  ];

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

    // Filter by confidence threshold (70%) - removes low-confidence detections
    const filtered = this.filterByConfidence(allResults, 0.70);

    // Deduplicate overlapping and identical results
    const deduplicated = this.deduplicate(filtered);

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
   * 
   * Note: Currently always returns rule-based results.
   * AI fallback logic removed as it was never executed.
   */
  async analyzeWithMinimalAIFallback(sentenceData: SentenceData): Promise<GrammarAnalysisResult> {
    // First run rule-based detectors
    const ruleBasedResult = this.analyze(sentenceData);

    return ruleBasedResult;
  }

  /**
   * Deduplicate results - handles both overlapping and exact position matches
   * Keeps high-value constructions and the best detection per position
   */
  private deduplicate(results: DetectionResult[]): DetectionResult[] {
    if (results.length === 0) return [];

    // Sort by position for grouping
    const sorted = [...results].sort((a, b) => a.position.start - b.position.start || a.position.end - b.position.end);

    // Special categories that always get preserved (important multi-token learning points)
    const specialCategories = ['functional-verb', 'separable-verb', 'participial-attribute'];
    
    // Specificity ranking for choosing between competing detections
    const specificity: Record<string, number> = {
      'functional-verb': 12,           // Highest - important B2 learning point
      'separable-verb': 12,            // Highest - important learning point
      'participial-attribute': 11,     // Very high - important B2 learning point
      'tense': 10, 'voice': 10, 'mood': 10,  // High value
      'case': 8, 'agreement': 8,       // Medium-high
      'article': 5,                    // Lower (generic)
    };

    // Group by overlapping positions
    const groups: DetectionResult[][] = [];
    let currentGroup: DetectionResult[] = [];

    for (const result of sorted) {
      if (currentGroup.length === 0) {
        currentGroup.push(result);
      } else {
        // Check if overlaps with any result in current group
        const overlapsWithGroup = currentGroup.some(r => this.overlaps(result, r));
        if (overlapsWithGroup) {
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

    // Process each group: keep special constructions + best of the rest
    return groups.flatMap((group) => {
      if (group.length === 1) return group;

      // Always keep special constructions (they provide unique learning value)
      const special = group.filter(r => specialCategories.includes(r.grammarPoint?.category || ''));
      
      // For regular detections, group by exact position and keep only the best per position
      const regularDetections = group.filter(r => !specialCategories.includes(r.grammarPoint?.category || ''));
      
      // Map: position key -> best result at that position
      const bestByPosition = new Map<string, DetectionResult>();
      
      for (const result of regularDetections) {
        const posKey = `${result.position.start}-${result.position.end}`;
        const existing = bestByPosition.get(posKey);
        
        if (!existing) {
          bestByPosition.set(posKey, result);
        } else {
          // Choose based on confidence first, then specificity
          const currentSpec = specificity[result.grammarPoint?.category as string] || 5;
          const existingSpec = specificity[existing.grammarPoint?.category as string] || 5;
          
          if (result.confidence > existing.confidence || 
              (result.confidence === existing.confidence && currentSpec > existingSpec)) {
            bestByPosition.set(posKey, result);
          }
        }
      }
      
      return [...special, ...Array.from(bestByPosition.values())];
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
      'functional-verb': [],
      'participial-attribute': [],
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
      'functional-verb': byCategory['functional-verb'].length,
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
      'participial-attribute': byCategory['participial-attribute'].length,
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
      const word = sentenceData.text.substring(result.position.start, result.position.end);
      let contextualExplanation = result.grammarPoint.explanation;

      // Add context-aware explanation based on grammar point category
      switch (result.grammarPoint.category) {
        case 'case':
          const caseValue = result.details?.case || 'unknown';
          contextualExplanation = this.generateCaseExplanation(word, caseValue, sentenceData, result.position);
          break;
        case 'tense':
          const tenseValue = result.details?.tense || 'unknown';
          contextualExplanation = this.generateTenseExplanation(word, tenseValue, sentenceData);
          break;
        case 'mood':
          const moodValue = result.details?.mood || 'unknown';
          contextualExplanation = this.generateMoodExplanation(word, moodValue);
          break;
        case 'voice':
          const voiceValue = result.details?.voice || 'unknown';
          contextualExplanation = this.generateVoiceExplanation(word, voiceValue, sentenceData);
          break;
      }

      // Check if this grammar point has context variants (fallback)
      if (result.grammarPoint.contextVariants && result.grammarPoint.id === 'a2-dative-case') {
        const dativeContext = result.details?.dativeContext;
        if (dativeContext && result.grammarPoint.contextVariants[dativeContext]) {
          contextualExplanation = result.grammarPoint.contextVariants[dativeContext];
        }
      }

      return {
        ...result,
        grammarPoint: {
          ...result.grammarPoint,
          explanation: contextualExplanation,
        },
      };
    });
  }

  /**
   * Generate context-aware explanation for case
   */
  private generateCaseExplanation(word: string, caseValue: string, sentenceData: SentenceData, position: any): string {
    const baseExplanation = this.getCaseBaseExplanation(caseValue);
    
    // Find surrounding context (verb, preposition, etc.)
    const contextInfo = this.findCaseContext(sentenceData, position);
    
    if (contextInfo.preposition) {
      return `${baseExplanation} Used with the preposition "${contextInfo.preposition}" which takes ${caseValue}.`;
    }
    
    if (contextInfo.verb) {
      return `${baseExplanation} "${word}" is the ${caseValue.toLowerCase()} object of the verb "${contextInfo.verb}".`;
    }

    return baseExplanation;
  }

  /**
   * Generate context-aware explanation for tense
   */
  private generateTenseExplanation(word: string, tenseValue: string, sentenceData: SentenceData): string {
    const descriptions: Record<string, string> = {
      'present': `"${word}" is in present tense, indicating an action happening now or a general fact.`,
      'past': `"${word}" is in simple past (Präteritum), used for narrating past events, especially in written German.`,
      'perfect': `"${word}" is in present perfect (Perfekt), used for completed actions, especially in spoken German.`,
      'pluperfect': `"${word}" is in pluperfect (Plusquamperfekt), indicating an action completed before another past event.`,
      'subjunctive': `"${word}" is in subjunctive mood, expressing hypothetical, conditional, or reported speech.`,
    };
    
    return descriptions[tenseValue] || `"${word}" uses ${tenseValue} tense.`;
  }

  /**
   * Generate context-aware explanation for mood
   */
  private generateMoodExplanation(word: string, moodValue: string): string {
    const descriptions: Record<string, string> = {
      'indicative': `"${word}" is in indicative mood, stating a fact or reality.`,
      'subjunctive': `"${word}" is in subjunctive mood (Konjunktiv), expressing wishes, hypotheticals, or reported speech.`,
      'conditional': `"${word}" is in conditional mood, expressing what would happen under certain conditions.`,
      'imperative': `"${word}" is an imperative command form.`,
    };
    
    return descriptions[moodValue] || `"${word}" uses ${moodValue} mood.`;
  }

  /**
   * Generate context-aware explanation for voice
   */
  private generateVoiceExplanation(word: string, voiceValue: string, sentenceData: SentenceData): string {
    if (voiceValue === 'passive') {
      return `"${word}" is in passive voice, focusing on the action rather than who performs it. The agent (who does the action) is either omitted or introduced with "von".`;
    }
    return `"${word}" is in active voice, with the subject performing the action.`;
  }

  /**
   * Get base explanation for case
   */
  private getCaseBaseExplanation(caseValue: string): string {
    const explanations: Record<string, string> = {
      'Nom': 'Nominative case - used for the subject (who/what performs the action).',
      'Acc': 'Accusative case - used for the direct object (who/what receives the action).',
      'Dat': 'Dative case - used for the indirect object (to/for whom the action is done).',
      'Gen': 'Genitive case - used to show possession or relationships (of/s).',
    };
    return explanations[caseValue] || 'Case marking in German.';
  }

  /**
   * Find context information for a case (preposition, verb, etc.)
   */
  private findCaseContext(sentenceData: SentenceData, position: any): { preposition?: string; verb?: string } {
    // Look for prepositions before this word
    for (let i = 0; i < sentenceData.tokens.length; i++) {
      const token = sentenceData.tokens[i];
      if (token.characterStart <= position.start && token.characterEnd >= position.start) {
        // Found token, look backwards for preposition
        for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
          const prevToken = sentenceData.tokens[j];
          if (prevToken.pos === 'ADP') {
            return { preposition: prevToken.text };
          }
          if (prevToken.pos === 'VERB' || prevToken.pos === 'AUX') {
            return { verb: prevToken.text };
          }
        }
        break;
      }
    }
    return {};
  }

  /**
   * Filter results by minimum confidence threshold
   * Removes low-confidence detections that are likely noise
   */
  private filterByConfidence(results: DetectionResult[], minConfidence: number): DetectionResult[] {
    return results.filter(result => result.confidence >= minConfidence);
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

