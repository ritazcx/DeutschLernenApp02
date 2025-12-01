/**
 * POS Tagger - 词性标注模块
 * Uses spaCy for reliable, grammar-aware POS tagging
 * No hardcoded lists - all based on neural models and linguistic knowledge
 */

import Database from 'better-sqlite3';
import path from 'path';
import { getSpacyService } from './spacyService';

export interface POSResult {
  word: string;
  pos: string;           // Universal POS (NOUN, VERB, ADJ, ADP, PRON, etc.)
  tag?: string;          // Language-specific tag (detailed)
  confidence: number;
  method: 'spacy' | 'vocab' | 'heuristic';
  morph?: Record<string, string>;  // Morphological features
}

export class POSTagger {
  private db: Database.Database;
  private spacyService = getSpacyService();

  constructor(dbPath?: string) {
    const defaultPath = dbPath || path.resolve(__dirname, '../../../data/dictionary.db');
    this.db = new Database(defaultPath);
  }

  /**
   * Tag a single word with its POS
   * Uses spaCy as primary source of truth
   */
  async tag(word: string, context?: {previous?: string, next?: string}): Promise<POSResult> {
    if (!word) {
      return {
        word,
        pos: 'NOUN',
        confidence: 0.0,
        method: 'heuristic'
      };
    }

    const lowerWord = word.toLowerCase();

    // Method 1: Use spaCy (most reliable)
    const spacyResult = await this.spacyService.lemmatize(lowerWord);
    if (spacyResult.pos && spacyResult.confidence >= 0.5) {
      // Map spaCy's universal POS tags to our format
      const normalizedPOS = this.normalizeSpacyPOS(spacyResult.pos);
      return {
        word,
        pos: normalizedPOS,
        tag: spacyResult.tag,
        confidence: spacyResult.confidence,
        method: 'spacy',
        morph: spacyResult.morph
      };
    }

    // Method 2: Fallback to vocabulary database
    const vocabPOS = this.lookupInVocab(lowerWord);
    if (vocabPOS) {
      return {
        word,
        pos: vocabPOS,
        confidence: 0.85,
        method: 'vocab'
      };
    }

    // Method 3: Context heuristics (fallback for edge cases)
    // If after "zu", likely infinitive verb
    if (context?.previous === 'zu') {
      return {
        word,
        pos: 'VERB',
        confidence: 0.7,
        method: 'heuristic'
      };
    }

    // If after modal verb, likely infinitive
    const modalVerbs = ['können', 'müssen', 'wollen', 'sollen', 'dürfen', 'mögen'];
    if (context?.previous && modalVerbs.includes(context.previous)) {
      return {
        word,
        pos: 'VERB',
        confidence: 0.8,
        method: 'heuristic'
      };
    }

    // German capitalization heuristic (nouns are capitalized)
    if (word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase()) {
      return {
        word,
        pos: 'NOUN',
        confidence: 0.6,
        method: 'heuristic'
      };
    }

    // Default guess: assume noun (most common in German)
    return {
      word,
      pos: 'NOUN',
      confidence: 0.3,
      method: 'heuristic'
    };
  }

  /**
   * Normalize spaCy's universal POS tags to our standard format
   */
  private normalizeSpacyPOS(spacyPOS: string): string {
    const mapping: Record<string, string> = {
      'NOUN': 'NOUN',
      'VERB': 'VERB',
      'ADJ': 'ADJ',
      'ADP': 'PREP',      // Adposition (German prepositions)
      'ADV': 'ADV',
      'DET': 'ART',       // Determiner (German articles)
      'PRON': 'PRON',
      'CCONJ': 'CONJ',    // Coordinating conjunction
      'SCONJ': 'CONJ',    // Subordinating conjunction
      'PROPN': 'NOUN',    // Proper noun
      'NUM': 'NUM',
      'INTJ': 'INTJ',
      'PUNCT': 'PUNCT',
      'SYM': 'SYM',
      'X': 'X'            // Unknown/other
    };
    return mapping[spacyPOS] || 'NOUN';
  }

  /**
   * Lookup word in vocabulary database for fallback POS
   */
  private lookupInVocab(word: string): string | null {
    try {
      const stmt = this.db.prepare('SELECT pos FROM vocabulary WHERE LOWER(word) = ?');
      const result = stmt.get(word) as {pos: string} | undefined;
      return result?.pos || null;
    } catch (error) {
      console.error('Database lookup error:', error);
      return null;
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}
