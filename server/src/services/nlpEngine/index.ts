/**
 * NLP Engine - Main Class
 * 统一接口，集成所有NLP功能
 */

import Database from 'better-sqlite3';
import path from 'path';
import { GermanLemmatizer } from './lemmatizer';
import { POSTagger } from './posTagger';
import { MorphAnalyzer } from './morphAnalyzer';
import { Token, ParsedSentence, MorphFeature } from './types';

export class NLPEngine {
  private db: Database.Database;
  private lemmatizer: GermanLemmatizer;
  private posTagger: POSTagger;
  private morphAnalyzer: MorphAnalyzer;

  constructor(dbPath?: string) {
    // Use provided path or compute from __dirname (which is dist/services/nlpEngine in production)
    const defaultPath = dbPath || path.resolve(__dirname, '../../../data/dictionary.db');
    this.db = new Database(defaultPath);
    this.lemmatizer = new GermanLemmatizer(dbPath);
    this.posTagger = new POSTagger(dbPath);
    this.morphAnalyzer = new MorphAnalyzer(dbPath);
  }

  /**
   * 解析单个句子
   */
  parseSentence(text: string): ParsedSentence {
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
      const lemmaResult = this.lemmatizer.lemmatize(cleanWord);
      
      // 词性标注（带上下文）
      const context = {
        previous: i > 0 ? words[i - 1].toLowerCase() : undefined,
        next: i < words.length - 1 ? words[i + 1].toLowerCase() : undefined
      };
      const posResult = this.posTagger.tag(cleanWord, context);
      
      // 形态学分析
      let morph = this.analyzeMorphology(cleanWord, lemmaResult.lemma, posResult.pos);

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

    // 步骤3: 检查句子特征
    const hasPassive = this.checkPassive(tokens);
    const hasSubjunctive = this.checkSubjunctive(tokens);
    const hasSubordinateClause = this.checkSubordinateClause(tokens);

    // 步骤4: 估计难度级别
    const estimatedLevel = this.estimateLevel(tokens, hasPassive, hasSubjunctive, hasSubordinateClause);

    return {
      text,
      tokens,
      hasPassive,
      hasSubjunctive,
      hasSubordinateClause,
      estimatedLevel
    };
  }

  /**
   * 解析多个句子
   */
  parseText(text: string): ParsedSentence[] {
    // 简单的句子分割（可以改进）
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    return sentences.map(s => this.parseSentence(s.trim()));
  }

  /**
   * 形态学分析（简化版）
   */
  private analyzeMorphology(word: string, lemma: string, pos: string): MorphFeature {
    const morph: MorphFeature = {};

    try {
      // 根据词性调用相应的分析方法
      switch (pos) {
        case 'NOUN':
          const nounAnalysis = this.morphAnalyzer.analyzeNoun(word, lemma);
          Object.assign(morph, nounAnalysis);
          break;

        case 'VERB':
          const verbAnalysis = this.morphAnalyzer.analyzeVerb(word, lemma);
          Object.assign(morph, verbAnalysis);
          break;

        case 'ADJ':
        case 'ADJD':
        case 'ADJA':
          const adjAnalysis = this.morphAnalyzer.analyzeAdjective(word, lemma);
          Object.assign(morph, adjAnalysis);
          break;

        case 'PRON':
          const pronAnalysis = this.morphAnalyzer.analyzePronoun(word);
          Object.assign(morph, pronAnalysis);
          break;

        // 其他词性可能没有复杂的形态特征
        default:
          // 不需要分析
          break;
      }
    } catch (error) {
      // 如果分析失败，继续使用空的MorphFeature
      console.warn(`Warning: Failed to analyze morphology for "${word}":`, error);
    }

    return morph;
  }

  /**
   * 获取名词数据（性别）
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
   * 检查是否是被动语态
   */
  private checkPassive(tokens: Token[]): boolean {
    // 被动语态: 有 "werden/sein" + Partizip II
    let hasWerden = tokens.some(t => ['werden', 'sein'].includes(t.lemma));
    let hasParticiple = tokens.some(t => t.word.startsWith('ge') && t.word.endsWith('t'));
    return hasWerden && hasParticiple;
  }

  /**
   * 检查是否有虚拟语气
   */
  private checkSubjunctive(tokens: Token[]): boolean {
    // 虚拟语气通常有 ö, ü, ä 变音
    return tokens.some(t => /[öüä]/.test(t.word));
  }

  /**
   * 检查是否有从句
   */
  private checkSubordinateClause(tokens: Token[]): boolean {
    // 从句标记: wenn, weil, dass, ob, etc.
    const clauseMarkers = ['wenn', 'weil', 'dass', 'ob', 'während', 'bevor', 'nachdem', 'obwohl'];
    return tokens.some(t => clauseMarkers.includes(t.lemma));
  }

  /**
   * 估计句子难度等级
   */
  private estimateLevel(tokens: Token[], hasPassive: boolean, hasSubjunctive: boolean, hasSubordinateClause: boolean): 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' {
    let score = 0;

    // 基础: 长度
    if (tokens.length < 5) score += 1;
    else if (tokens.length < 10) score += 2;
    else if (tokens.length < 15) score += 3;
    else score += 4;

    // 从句 (B1+)
    if (hasSubordinateClause) score += 2;

    // 被动语态 (B1+)
    if (hasPassive) score += 2;

    // 虚拟语气 (B2+)
    if (hasSubjunctive) score += 3;

    // 基于词汇库中词的难度等级
    const levelCounts: Record<string, number> = {};
    for (const token of tokens) {
      const vocabLevel = this.getVocabLevel(token.lemma);
      levelCounts[vocabLevel] = (levelCounts[vocabLevel] || 0) + 1;
    }

    if (levelCounts['C1'] || levelCounts['C2']) score += 3;
    else if (levelCounts['B2']) score += 2;
    else if (levelCounts['B1']) score += 1;

    // 根据分数估计等级
    if (score <= 2) return 'A1';
    if (score <= 4) return 'A2';
    if (score <= 6) return 'B1';
    if (score <= 8) return 'B2';
    if (score <= 10) return 'C1';
    return 'C2';
  }

  /**
   * 获取词的CEFR难度等级
   */
  private getVocabLevel(lemma: string): string {
    try {
      const stmt = this.db.prepare('SELECT level FROM vocabulary WHERE LOWER(word) = ?');
      const result = stmt.get(lemma) as {level: string} | undefined;
      return result?.level || 'A1';
    } catch (error) {
      return 'A1';
    }
  }

  /**
   * 检测代词的人称
   */
  private detectPronounPerson(word: string): string {
    const personMap: Record<string, string> = {
      'ich': '1sg',
      'du': '2sg',
      'er': '3sg',
      'sie': '3sg',
      'es': '3sg',
      'wir': '1pl',
      'ihr': '2pl',
      'Sie': '2sg',  // formal
    };
    return personMap[word.toLowerCase()] || 'n/a';
  }

  /**
   * 检测格（简化版）
   */
  private detectCase(word: string, pos: string): string {
    // 这里是简化版，完整版会考虑上下文
    const nominativePronouns = ['ich', 'du', 'er', 'wir', 'ihr'];
    const accusativePronouns = ['mich', 'dich', 'ihn', 'uns', 'euch'];
    const dativePronouns = ['mir', 'dir', 'ihm', 'uns', 'euch'];
    const genitivePronouns = ['meiner', 'deiner', 'seiner'];

    const lowerWord = word.toLowerCase();
    if (nominativePronouns.includes(lowerWord)) return 'nominative';
    if (accusativePronouns.includes(lowerWord)) return 'accusative';
    if (dativePronouns.includes(lowerWord)) return 'dative';
    if (genitivePronouns.includes(lowerWord)) return 'genitive';

    return 'n/a';
  }

  /**
   * 检测时态（简化版）
   */
  private detectTense(word: string, lemma: string): string {
    // 完全分词: ge...t / ge...en
    if (word.startsWith('ge') && (word.endsWith('t') || word.endsWith('en'))) {
      return 'perfect';
    }
    // 简单过去式: ...te / ...ten
    if (word.endsWith('te') || word.endsWith('ten')) {
      return 'past';
    }
    // 默认: 现在时
    return 'present';
  }

  /**
   * 检测语态（简化版）
   */
  private detectMood(word: string): string {
    // 虚拟语气通常有变音
    if (/[öüä]/.test(word)) {
      return 'subjunctive';
    }
    return 'indicative';
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
