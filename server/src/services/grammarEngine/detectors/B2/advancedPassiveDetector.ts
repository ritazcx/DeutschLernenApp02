/**
 * Advanced Passive Detector
 * Identifies B2-level passive constructions with agents and statal passives
 */

import { BaseGrammarDetector, DetectionResult, SentenceData } from '../shared/baseDetector';
import { B2_GRAMMAR, GrammarCategory } from '../../cefr-taxonomy';
import * as MorphAnalyzer from '../../morphologyAnalyzer';

export class AdvancedPassiveDetector extends BaseGrammarDetector {
  name = 'AdvancedPassiveDetector';
  category: GrammarCategory = 'passive';

  detect(sentence: SentenceData): DetectionResult[] {
    const results: DetectionResult[] = [];

    // Detect passive with agent (von/durch)
    this.detectPassiveWithAgent(sentence, results);

    // Detect statal passive (sein + past participle)
    this.detectStatalPassive(sentence, results);

    return results;
  }

  /**
   * Detect passive constructions with agent phrases (von/durch)
   */
  private detectPassiveWithAgent(sentence: SentenceData, results: DetectionResult[]): void {
    sentence.tokens.forEach((token, index) => {
      // Look for "werden" (passive auxiliary)
      if (!this.isPassiveAuxiliary(token, 'werden')) {
        return;
      }

      const tense = MorphAnalyzer.extractTense(token.morph);

      // Look for past participle after werden (strict: must be immediate next token)
      const participleIndex = this.findNextParticiple(sentence.tokens, index, 1, false);
      if (participleIndex === -1) {
        return;
      }

      const nextToken = sentence.tokens[participleIndex];

      // Look for agent phrase after the participle (von/durch + noun)
      const agentPhrase = this.findAgentPhrase(sentence.tokens, index + 2);
      if (agentPhrase) {
        results.push(
          this.createResult(
            B2_GRAMMAR['passive-with-by-phrase'],
            this.calculatePosition(sentence.tokens, index, agentPhrase.end),
            0.95,
            {
              passiveType: 'passive-with-agent',
              auxiliary: token.text,
              participle: nextToken.text,
              agent: agentPhrase.agent,
              preposition: agentPhrase.preposition,
              lemma: nextToken.lemma,
            },
          ),
        );
      }
    });
  }

  /**
   * Detect statal passive (sein + past participle)
   */
  private detectStatalPassive(sentence: SentenceData, results: DetectionResult[]): void {
    sentence.tokens.forEach((token, index) => {
      // Look for "sein" as auxiliary
      if (!this.isPassiveAuxiliary(token, 'sein')) {
        return;
      }

      const tense = MorphAnalyzer.extractTense(token.morph);

      // Look for past participle after sein (strict: must be immediate next token)
      const participleIndex = this.findNextParticiple(sentence.tokens, index, 1, false);
      if (participleIndex === -1) {
        return;
      }

      const nextToken = sentence.tokens[participleIndex];

      // Statal passive: sein + past participle (describes state, not action)
      results.push(
        this.createResult(
          B2_GRAMMAR['statal-passive'],
          this.calculatePosition(sentence.tokens, index, index + 1),
          0.9,
          {
            passiveType: 'statal-passive',
            auxiliary: token.text,
            participle: nextToken.text,
            tense: tense,
            lemma: nextToken.lemma,
          },
        ),
      );
    });
  }

  /**
   * Find agent phrase after passive construction (von/durch + [article] + noun)
   */
  private findAgentPhrase(tokens: SentenceData['tokens'], startIndex: number): { agent: string; preposition: string; end: number } | null {
    // Look for von/durch preposition within next few tokens
    for (let i = startIndex; i < Math.min(tokens.length, startIndex + 6); i++) {
      const token = tokens[i];
      if (token.pos === 'ADP' && (token.lemma === 'von' || token.lemma === 'durch')) {
        // Look for noun after preposition (may have article in between)
        for (let j = i + 1; j < Math.min(tokens.length, i + 4); j++) {
          const nextToken = tokens[j];
          if (nextToken.pos === 'NOUN') {
            return {
              agent: nextToken.text,
              preposition: token.text,
              end: j,
            };
          }
        }
      }
    }
    return null;
  }
}