/**
 * Vocabulary Extractor - 生词本自动提取服务
 */

import Database from 'better-sqlite3';
import path from 'path';
import { NLPEngine } from './nlpEngine';
import { ExtractedVocabulary } from './nlpEngine/types';

export class VocabularyExtractor {
  private db: Database.Database;
  private nlpEngine: NLPEngine;

  constructor(dbPath?: string) {
    const defaultPath = dbPath || path.resolve(__dirname, '../../data/dictionary.db');
    this.db = new Database(defaultPath);
    this.nlpEngine = new NLPEngine(defaultPath);
  }

  /**
   * 从文章中提取生词本
   * @param text 输入文章
   * @param excludeLevels 要排除的难度等级 (如: ['A1', 'A2'])
   * @returns 去重的生词本
   */
  async extract(text: string, excludeLevels: string[] = []): Promise<ExtractedVocabulary[]> {
    // 解析文本
    const parsedSentences = await this.nlpEngine.parseText(text);

    // 收集所有词汇
    const vocabularyMap = new Map<string, {
      lemma: string;
      forms: Set<string>;
      frequency: number;
      pos: string;
      level?: string;
      meaning?: string;
    }>();

    for (const sentence of parsedSentences) {
      for (const token of sentence.tokens) {
        const lemma = token.lemma;

        // 排除排除列表中的等级
        if (excludeLevels.includes(token.morph as any)) {
          continue;
        }

        if (!vocabularyMap.has(lemma)) {
          const vocabData = this.getVocabularyData(lemma);
          vocabularyMap.set(lemma, {
            lemma,
            forms: new Set([token.word]),
            frequency: 1,
            pos: token.pos,
            level: vocabData?.level,
            meaning: vocabData?.meaning
          });
        } else {
          const entry = vocabularyMap.get(lemma)!;
          entry.forms.add(token.word);
          entry.frequency++;
        }
      }
    }

    // 转换为数组并排序
    const result: ExtractedVocabulary[] = Array.from(vocabularyMap.values())
      .map(entry => {
        const formArray = Array.from(entry.forms);
        return {
          lemma: entry.lemma,
          word: formArray.length > 0 ? formArray[0] : entry.lemma,
          pos: entry.pos,
          level: entry.level,
          meaning: entry.meaning,
          frequency: entry.frequency,
          allForms: formArray
        };
      })
      .sort((a, b) => {
        // 按频率排序（高→低），然后按难度
        if (b.frequency !== a.frequency) {
          return b.frequency - a.frequency;
        }
        const levelOrder = ['C2', 'C1', 'B2', 'B1', 'A2', 'A1'];
        return levelOrder.indexOf(b.level || 'A1') - levelOrder.indexOf(a.level || 'A1');
      });

    return result;
  }

  /**
   * 获取词汇数据（从数据库）
   */
  private getVocabularyData(lemma: string): {level?: string, meaning?: string} | null {
    try {
      const stmt = this.db.prepare('SELECT level, meaning_en FROM vocabulary WHERE LOWER(word) = ?');
      const result = stmt.get(lemma) as {level?: string, meaning_en?: string} | undefined;
      
      if (result) {
        return {
          level: result.level,
          meaning: result.meaning_en
        };
      }
    } catch (error) {
      console.error('Error getting vocabulary data:', error);
    }
    return null;
  }

  /**
   * 获取某个难度等级的生词本
   */
  async extractByLevel(text: string, level: string): Promise<ExtractedVocabulary[]> {
    const all = await this.extract(text);
    return all.filter((v: ExtractedVocabulary) => v.level === level);
  }

  /**
   * 获取某个词性的生词本
   */
  async extractByPOS(text: string, pos: string): Promise<ExtractedVocabulary[]> {
    const all = await this.extract(text);
    return all.filter((v: ExtractedVocabulary) => v.pos === pos);
  }

  /**
   * 导出为CSV格式
   */
  exportToCSV(vocabulary: ExtractedVocabulary[]): string {
    const headers = ['lemma', 'word', 'pos', 'level', 'meaning', 'frequency', 'forms'];
    const rows = vocabulary.map(v => [
      v.lemma,
      v.word,
      v.pos,
      v.level || 'unknown',
      `"${v.meaning || ''}"`,  // 用引号包围以处理逗号
      v.frequency,
      `"${(v.allForms || []).join(';')}"`
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }

  /**
   * 关闭资源
   */
  close(): void {
    this.db.close();
    this.nlpEngine.close();
  }
}
