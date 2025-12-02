/**
 * NLP Engine - Main Class
 * 统一接口，集成所有NLP功能
 */

import Database from 'better-sqlite3';
import path from 'path';
import { GermanLemmatizer } from './lemmatizer';
import { POSTagger } from './posTagger';
import { SpacyService, getSpacyService } from './spacyService';
import { Token, ParsedSentence } from './types';
import { grammarDetectionEngine, GrammarAnalysisResult } from '../grammarEngine/detectionEngine';
import { SentenceData } from '../grammarEngine/detectors/baseDetector';

export class NLPEngine {
  private db: Database.Database;
  private lemmatizer: GermanLemmatizer;
  private posTagger: POSTagger;
  private spacyService: SpacyService;

  constructor(dbPath?: string) {
    // Use provided path or compute from __dirname (which is dist/services/nlpEngine in production)
    const defaultPath = dbPath || path.resolve(__dirname, '../../../data/dictionary.db');
    this.db = new Database(defaultPath);
    this.lemmatizer = new GermanLemmatizer(dbPath);
    this.posTagger = new POSTagger(dbPath);
    this.spacyService = getSpacyService();
  }

  /**
   * Parse sentence using spaCy service
   */
  private async parseSentenceSpaCy(text: string): Promise<ParsedSentence & { spacyTokens?: any[] }> {
    console.log(`[Grammar Engine] Attempting spaCy parsing for: "${text.substring(0, 50)}..."`);
    const result = await this.spacyService.analyzeSentence(text);

    if (!result.success || !result.tokens) {
      console.error(`[Grammar Engine] ✗ spaCy parsing FAILED: ${result.error || 'No tokens returned'}`);
      throw new Error(result.error || 'spaCy analysis failed');
    }

    console.log(`[Grammar Engine] ✓ spaCy parsing succeeded, got ${result.tokens.length} tokens`);

    // Store spaCy tokens for access to dep field
    const spacyTokens = result.tokens;

    const tokens: Token[] = result.tokens.map((spacyToken, i) => {
      // Normalize spaCy POS to our format
      const normalizedPos = this.normalizeSpacyPOS(spacyToken.pos);

      // Use spaCy's morphological features directly
      // spaCy provides complete morphological analysis
      const morph = spacyToken.morph || {};

      return {
        id: i,
        word: spacyToken.text,
        lemma: spacyToken.lemma,
        pos: normalizedPos,
        morph,
        position: {
          start: 0, // Will be calculated below
          end: 0
        }
      };
    });

    // Calculate character positions more accurately
    let currentPos = 0;
    for (const token of tokens) {
      const start = text.indexOf(token.word, currentPos);
      if (start !== -1) {
        token.position.start = start;
        token.position.end = start + token.word.length;
        currentPos = token.position.end;
      }
    }

    return {
      text,
      tokens,
      usedSpaCy: true,
      spacyTokens
    };
  }

  /**
   * Parse sentence
   */
  async parseSentence(text: string): Promise<ParsedSentence> {
    try {
      // Try spaCy first
      return await this.parseSentenceSpaCy(text);
    } catch (error) {
      console.warn(`[Grammar Engine] ⚠️ spaCy parsing failed, falling back to rule-based parsing`);
      console.warn(`[Grammar Engine] ⚠️ Error was:`, (error as Error).message);
      console.warn(`[Grammar Engine] ⚠️ This will result in fewer grammar points detected!`);
      return this.parseSentenceFallback(text);
    }
  }

  /**
   * Analyze grammar points in a sentence using grammar detectors
   */
  async analyzeGrammar(text: string): Promise<GrammarAnalysisResult> {
    try {
      // First, parse the sentence to get tokens
      const parsed = await this.parseSentence(text);

      // If spaCy failed and we have fallback tokens, still try grammar detection
      // but with reduced confidence
      const hasGoodTokens = parsed.tokens.length > 0 && parsed.tokens.some(t => t.pos !== 'X');

      if (!hasGoodTokens) {
        console.warn('No reliable tokens available for grammar analysis, returning empty result');
        return this.createEmptyResult(text);
      }

      // Convert ParsedSentence tokens to SentenceData tokens for grammar engine
      // spaCy morph is already in the correct format, pass it through directly
      const sentenceData: SentenceData = {
        text,
        tokens: parsed.tokens.map((token, idx) => {
          // Extract dep from spaCy tokens if available
          const spacyToken = (parsed as any).spacyTokens?.[idx];
          const dep = spacyToken?.dep || 'ROOT';
          
          return {
            text: token.word,
            lemma: token.lemma,
            pos: token.pos,
            tag: token.pos, // Use POS as tag for now
            dep,
            morph: token.morph,
            index: token.id,
            characterStart: token.position.start,
            characterEnd: token.position.end,
          };
        }),
      };

      // Analyze grammar with detection engine (minimal AI fallback for edge cases)
      return grammarDetectionEngine.analyzeWithMinimalAIFallback(sentenceData);
    } catch (error) {
      console.error('Grammar analysis failed:', error);
      // Return empty result instead of throwing to keep API stable
      return this.createEmptyResult(text);
    }
  }

  /**
   * Create empty grammar analysis result for fallback cases
   */
  private createEmptyResult(text: string): GrammarAnalysisResult {
    return {
      sentence: text,
      grammarPoints: [],
      byLevel: { A1: [], A2: [], B1: [], B2: [], C1: [], C2: [] },
      byCategory: {
        tense: [], case: [], voice: [], mood: [], agreement: [], article: [],
        adjective: [], pronoun: [], preposition: [], conjunction: [], 'verb-form': [],
        'word-order': [], 'separable-verb': [], 'modal-verb': [], 'reflexive-verb': [],
        passive: []
      },
      summary: {
        totalPoints: 0,
        levels: { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 },
        categories: {
          tense: 0, case: 0, voice: 0, mood: 0, agreement: 0, article: 0,
          adjective: 0, pronoun: 0, preposition: 0, conjunction: 0, 'verb-form': 0,
          'word-order': 0, 'separable-verb': 0, 'modal-verb': 0, 'reflexive-verb': 0,
          passive: 0
        }
      }
    };
  }

  /**
   * Fallback word-by-word parsing if sentence analysis fails
   */
  private async parseSentenceFallback(text: string): Promise<ParsedSentence> {
    // 步骤1: 分词（简单空格分割，之后可以改进）
    const words = text.trim().split(/\s+/);
    const tokens: Token[] = [];
    let charPosition = 0;

    // 步骤2: 对每个词进行标注
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      // 清除标点符号以获得实际词
      const cleanWord = word.replace(/[.,!?;:—\-()""「」]/g, '');
      
      // 词形还原
      const lemmaResult = await this.lemmatizer.lemmatize(cleanWord);
      
      // 词性标注（带上下文）
      const context = {
        previous: i > 0 ? words[i - 1].toLowerCase() : undefined,
        next: i < words.length - 1 ? words[i + 1].toLowerCase() : undefined
      };
      // 尝试用词根标注，如果词根与原词不同
      let posResult = await this.posTagger.tag(cleanWord, context);
      if (lemmaResult.lemma !== cleanWord.toLowerCase()) {
        const lemmaPos = await this.posTagger.tag(lemmaResult.lemma, context);
        // 如果词根有更高的置信度，使用词根的POS
        if (lemmaPos.confidence > posResult.confidence) {
          posResult = lemmaPos;
        }
      }
      
      // 形态学分析 - removed, use empty morph as fallback
      const morph = {};

      tokens.push({
        id: i,
        word: cleanWord,
        lemma: lemmaResult.lemma,
        pos: posResult.pos,
        morph,
        position: {start: charPosition, end: charPosition + cleanWord.length}
      });

      charPosition += cleanWord.length + 1;  // +1 for space
    }

    return {
      text,
      tokens,
      usedSpaCy: false
    };
  }

  /**
   * Normalize spaCy's universal POS tags to our format
   */
  private normalizeSpacyPOS(spacyPOS: string): string {
    const mapping: Record<string, string> = {
      'NOUN': 'NOUN',
      'VERB': 'VERB',
      'AUX': 'VERB',  // Auxiliary verbs (sein, haben, werden) -> VERB
      'ADJ': 'ADJ',
      'ADP': 'PREP',
      'ADV': 'ADV',
      'DET': 'ART',
      'PRON': 'PRON',
      'CCONJ': 'CONJ',
      'SCONJ': 'CONJ',
      'PROPN': 'NOUN',
      'NUM': 'NUM',
      'INTJ': 'INTJ',
      'PUNCT': 'PUNCT',
      'SYM': 'SYM',
      'X': 'X'
    };
    return mapping[spacyPOS] || 'NOUN';
  }

  /**
   * 解析多个句子
   */
  async parseText(text: string): Promise<ParsedSentence[]> {
    // 简单的句子分割（可以改进）
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    return Promise.all(sentences.map(s => this.parseSentence(s.trim())));
  }

  /**
   * 检测代词的人称
   */
  private getNounData(lemma: string): {gender: string} | null {
    try {
      const stmt = this.db.prepare('SELECT article FROM vocabulary WHERE LOWER(word) = ?');
      const result = stmt.get(lemma) as {article: string} | undefined;
      
      if (result && result.article) {
        const genderMap: Record<string, string> = {
          'der': 'masculine',
          'die': 'feminine',
          'das': 'neuter'
        };
        return {gender: genderMap[result.article] || 'n/a'};
      }
    } catch (error) {
      console.error('Error getting noun data:', error);
    }
    return null;
  }

  /**
   * 关闭所有资源
   */
  close(): void {
    this.db.close();
    this.lemmatizer.close();
    this.posTagger.close();
  }
}

// 导出供外部使用
export type { Token, ParsedSentence } from './types';
export type { GrammarAnalysisResult } from '../grammarEngine/detectionEngine';
