/**
 * German Lemmatizer - 德语词形还原模块
 * Uses spaCy Python service for accurate lemmatization
 */

import Database from 'better-sqlite3';
import path from 'path';
import { getSpacyService } from './spacyService';

export interface LemmatizerResult {
  word: string;
  lemma: string;
  confidence: number;  // 0-1
  isSeparableVerb?: boolean;
  method: 'spacy' | 'vocab' | 'rule' | 'heuristic';  // 使用的方法
}

export class GermanLemmatizer {
  private db: Database.Database;
  private spacyService = getSpacyService();
  
  // 可分动词前缀列表
  private separablePrefixes = [
    'ab', 'an', 'auf', 'aus', 'bei', 'ein', 'ent', 'er', 'fort',
    'mit', 'nach', 'vor', 'weg', 'weiter', 'zu', 'zurück', 'zusammen',
    'durch', 'über', 'um', 'unter'
  ];

  constructor(dbPath?: string) {
    const defaultPath = dbPath || path.resolve(__dirname, '../../../data/dictionary.db');
    this.db = new Database(defaultPath);
  }

  /**
   * 词形还原主方法 - 使用spaCy作为主要后端
   */
  async lemmatize(word: string): Promise<LemmatizerResult> {
    const lowerWord = word.toLowerCase();

    // 方法1: 使用spaCy（最可靠）
    const spacyResult = await this.spacyService.lemmatize(lowerWord);
    if (spacyResult.lemma && spacyResult.lemma !== lowerWord && spacyResult.confidence > 0.9) {
      return {
        word,
        lemma: spacyResult.lemma,
        confidence: spacyResult.confidence,
        method: 'spacy'
      };
    }

    // 方法2: 直接从词汇库查询
    const vocabResult = this.lookupInVocab(lowerWord);
    if (vocabResult) {
      return {
        word,
        lemma: vocabResult,
        confidence: 0.99,
        method: 'vocab'
      };
    }

    // 方法3: 检查是否是可分动词
    const separableResult = this.checkSeparableVerb(lowerWord);
    if (separableResult) {
      return separableResult;
    }

    // 如果spaCy给出了结果（即使不确定），使用它
    if (spacyResult.lemma) {
      return {
        word,
        lemma: spacyResult.lemma,
        confidence: spacyResult.confidence,
        method: 'spacy'
      };
    }

    // 方法4: 启发式（保持原词）
    return {
      word,
      lemma: lowerWord,
      confidence: 0.3,
      method: 'heuristic'
    };
  }

  /**
   * 从词汇库查询
   */
  private lookupInVocab(word: string): string | null {
    try {
      const stmt = this.db.prepare('SELECT word FROM vocabulary WHERE LOWER(word) = ?');
      const result = stmt.get(word) as {word: string} | undefined;
      return result ? result.word : null;
    } catch (error) {
      console.error('Database lookup error:', error);
      return null;
    }
  }

  /**
   * 检查可分动词（例如: abgehen → gehen）
   */
  private checkSeparableVerb(word: string): LemmatizerResult | null {
    for (const prefix of this.separablePrefixes) {
      if (word.startsWith(prefix)) {
        const root = word.substring(prefix.length);
        
        // 检查root是否在词汇库中
        const vocabLemma = this.lookupInVocab(root);
        if (vocabLemma) {
          return {
            word,
            lemma: vocabLemma,
            confidence: 0.85,
            isSeparableVerb: true,
            method: 'rule'
          };
        }
      }
    }
    return null;
  }

  /**
   * 批量词形还原
   */
  async lemmatizeMultiple(words: string[]): Promise<LemmatizerResult[]> {
    return Promise.all(words.map(word => this.lemmatize(word)));
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    this.db.close();
  }
}
