/**
 * B1 Grammar Rules Engine
 * Main class that orchestrates grammar rule detection
 */

import { Token, ParsedSentence } from '../nlpEngine/types';
import { GrammarRuleResult, CEFRLevel } from './types';
import {
  PresentTenseRule,
  SimplePastTenseRule,
  PerfectTenseRule,
  NominativeCaseRule,
  AccusativeCaseRule,
  DativeCaseRule,
  PrepositionWithCaseRule,
  SubordinatingConjunctionRule,
  ModalVerbRule,
  BaseRule,
} from './rules';
import {
  SeparableVerbRule,
  AdjectiveEndingRule,
  SubordinateClauseWordOrderRule,
  ArticleAgreementRule,
  PersonalPronounRule,
  NounGenderRule,
  QuestionWordRule,
} from './additionalRules';

export class GrammarRulesEngine {
  private rules: BaseRule[] = [];

  constructor(cefrLevel: CEFRLevel = 'B1') {
    this.initializeRules(cefrLevel);
  }

  private initializeRules(cefrLevel: CEFRLevel): void {
    // Initialize all rules for the given level
    // Currently implementing B1 rules
    if (cefrLevel === 'B1' || cefrLevel === 'B2' || cefrLevel === 'C1' || cefrLevel === 'C2') {
      this.rules.push(
        // Tense rules
        new PresentTenseRule(),
        new SimplePastTenseRule(),
        new PerfectTenseRule(),
        // Case rules
        new NominativeCaseRule(),
        new AccusativeCaseRule(),
        new DativeCaseRule(),
        // Preposition and conjunction rules
        new PrepositionWithCaseRule(),
        new SubordinatingConjunctionRule(),
        // Verb rules
        new ModalVerbRule(),
        new SeparableVerbRule(),
        // Article, adjective, pronoun rules
        new ArticleAgreementRule(),
        new AdjectiveEndingRule(),
        new PersonalPronounRule(),
        new NounGenderRule(),
        // Word order and special constructions
        new SubordinateClauseWordOrderRule(),
        new QuestionWordRule()
      );
    }

    // Add A1/A2 rules if applicable
    if (cefrLevel === 'A1' || cefrLevel === 'A2') {
      // TODO: Add A1/A2 specific rules
    }
  }

  /**
   * Analyze a parsed sentence and detect grammar points
   */
  analyze(sentence: ParsedSentence, cefrLevel: CEFRLevel = 'B1'): GrammarRuleResult {
    const tokens = sentence.tokens;
    const grammarPoints = [];

    // Apply each rule to each token
    for (let i = 0; i < tokens.length; i++) {
      for (const rule of this.rules) {
        // Filter by level
        if (rule.level !== cefrLevel && rule.level !== 'B1') continue;

        const grammarPoint = rule.detect(tokens, sentence, i);
        if (grammarPoint) {
          grammarPoints.push(grammarPoint);
        }
      }
    }

    // Remove duplicates (same position, same category)
    const uniquePoints = this.deduplicatePoints(grammarPoints);

    // Check for agreement errors
    const errors = this.checkAgreements(tokens, sentence);

    return {
      sentence,
      grammarPoints: uniquePoints,
      hasErrors: errors.length > 0,
      summary: {
        totalPoints: uniquePoints.length,
        byLevel: this.summarizeByLevel(uniquePoints),
        byCategory: this.summarizeByCategory(uniquePoints),
      },
    };
  }

  /**
   * Deduplicate grammar points with same position and category
   */
  private deduplicatePoints(points: any[]) {
    const seen = new Map<string, boolean>();
    return points.filter(point => {
      const key = `${point.startPos}-${point.endPos}-${point.category}`;
      if (seen.has(key)) return false;
      seen.set(key, true);
      return true;
    });
  }

  /**
   * Check for agreement errors between articles, nouns, and adjectives
   */
  private checkAgreements(tokens: Token[], sentence: ParsedSentence): any[] {
    const errors: any[] = [];

    // Simplified agreement checking
    // TODO: Implement comprehensive agreement validation
    // This would check:
    // - Article-noun gender-number-case agreement
    // - Adjective-noun agreement
    // - Subject-verb agreement

    return errors;
  }

  /**
   * Create summary of grammar levels detected
   */
  private summarizeByLevel(points: any[]): Record<CEFRLevel, number> {
    const levels: Record<CEFRLevel, number> = {
      'A1': 0, 'A2': 0, 'B1': 0, 'B2': 0, 'C1': 0, 'C2': 0
    };
    for (const point of points) {
      const level = point.level as CEFRLevel;
      if (level in levels) {
        levels[level]++;
      }
    }
    return levels;
  }

  /**
   * Create summary of grammar categories detected
   */
  private summarizeByCategory(points: any[]): Record<string, number> {
    const categories: Record<string, number> = {};
    for (const point of points) {
      categories[point.category] = (categories[point.category] || 0) + 1;
    }
    return categories;
  }
}

// Export all rule classes for testing
export {
  PresentTenseRule,
  SimplePastTenseRule,
  PerfectTenseRule,
  NominativeCaseRule,
  AccusativeCaseRule,
  DativeCaseRule,
  PrepositionWithCaseRule,
  SubordinatingConjunctionRule,
  ModalVerbRule,
  SeparableVerbRule,
  AdjectiveEndingRule,
  SubordinateClauseWordOrderRule,
  ArticleAgreementRule,
  PersonalPronounRule,
  NounGenderRule,
  QuestionWordRule,
};
