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
import { grammarDetectionEngine, GrammarAnalysisResult } from '../grammarEngine/detectionEngine';
import { SentenceData } from '../grammarEngine/detectors/baseDetector';

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
  async parseSentence(text: string): Promise<ParsedSentence> {
    // TEMPORARILY FORCE FALLBACK TO DEBUG
    console.log('⚠️ Forcing fallback parsing for debugging');
    return this.parseSentenceFallback(text);
  }

  /**
   * Analyze grammar points in a sentence using grammar detectors
   */
  async analyzeGrammar(text: string): Promise<GrammarAnalysisResult> {
    // First, parse the sentence to get tokens
    const parsed = await this.parseSentence(text);
    
    // TEMPORARILY ALLOW FALLBACK FOR DEBUGGING
    // if (!parsed.usedSpaCy) {
    //   console.warn('SpaCy analysis failed, skipping grammar detection to prevent fallback token contamination');
    //   return {
    //     sentence: text,
    //     grammarPoints: [],
    //     byLevel: { A1: [], A2: [], B1: [], B2: [], C1: [], C2: [] },
    //     byCategory: {
    //       tense: [], case: [], voice: [], mood: [], agreement: [], article: [],
    //       adjective: [], pronoun: [], preposition: [], conjunction: [], 'verb-form': [],
    //       'word-order': [], 'separable-verb': [], 'modal-verb': [], 'reflexive-verb': [],
    //       passive: []
    //     },
    //     summary: {
    //       totalPoints: 0,
    //       levels: { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 },
    //       categories: {
    //         tense: 0, case: 0, voice: 0, mood: 0, agreement: 0, article: 0,
    //         adjective: 0, pronoun: 0, preposition: 0, conjunction: 0, 'verb-form': 0,
    //         'word-order': 0, 'separable-verb': 0, 'modal-verb': 0, 'reflexive-verb': 0,
    //         passive: 0
    //       }
    //     }
    //   };
    // }
    
    // Convert ParsedSentence tokens to SentenceData tokens for grammar engine
    // Filter out "n/a" values from morph object
    const cleanMorph = (morph: Record<string, any>): Record<string, string> => {
      const cleaned: Record<string, string> = {};
      for (const [key, value] of Object.entries(morph)) {
        if (value && value !== 'n/a') {
          // Convert key to spaCy format (e.g., case -> Case, person -> Person)
          const spacyKey = key.charAt(0).toUpperCase() + key.slice(1);
          // Convert value to spaCy abbreviations (e.g., nominative -> Nom)
          const abbreviatedValue = this.abbreviateMorphValue(key, value as string);
          if (abbreviatedValue) {
            cleaned[spacyKey] = abbreviatedValue;
          }
        }
      }
      return cleaned;
    };

    const sentenceData: SentenceData = {
      text,
      tokens: parsed.tokens.map((token) => ({
        text: token.word,
        lemma: token.lemma,
        pos: token.pos,
        tag: token.pos, // Use POS as tag for now
        dep: 'ROOT', // TODO: Add dependency parsing
        morph: cleanMorph(token.morph),
        index: token.id,
        characterStart: token.position.start,
        characterEnd: token.position.end,
      })),
    };

    // DEBUG: Write tokens to file
    const fs = await import('fs');
    const debugInfo = {
      text: sentenceData.text,
      tokens: sentenceData.tokens.map((token, i) => ({
        index: i,
        text: token.text,
        pos: token.pos,
        lemma: token.lemma,
        morph: token.morph
      }))
    };
    fs.writeFileSync('/tmp/debug-tokens.json', JSON.stringify(debugInfo, null, 2));
    console.log('🔍 Debug tokens written to /tmp/debug-tokens.json');

    // Analyze grammar with detection engine (minimal AI fallback for edge cases)
    return grammarDetectionEngine.analyzeWithMinimalAIFallback(sentenceData);
  }

  /**
   * Abbreviate morphological values to spaCy format
   */
  private abbreviateMorphValue(key: string, value: string): string | null {
    const abbreviations: Record<string, Record<string, string>> = {
      case: {
        nominative: 'Nom',
        accusative: 'Acc',
        dative: 'Dat',
        genitive: 'Gen',
      },
      tense: {
        present: 'Pres',
        past: 'Past',
        future: 'Fut',
        perfect: 'Perf',
      },
      mood: {
        indicative: 'Ind',
        subjunctive: 'Subj',
        conditional: 'Cond',
        imperative: 'Imp',
      },
      gender: {
        masculine: 'Masc',
        feminine: 'Fem',
        neuter: 'Neut',
      },
      number: {
        singular: 'Sing',
        plural: 'Plur',
      },
      person: {
        '1sg': '1',
        '2sg': '2',
        '3sg': '3',
        '1pl': '1',
        '2pl': '2',
        '3pl': '3',
      },
      voice: {
        active: 'Act',
        passive: 'Pass',
      },
      verbForm: {
        finite: 'Fin',
        infinitive: 'Inf',
        participle: 'Part',
      },
    };
    const table = abbreviations[key];
    if (!table) return null;
    const normalized = value.toLowerCase();
    return table[normalized] || null;
  };

  

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
      estimatedLevel,
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
    // REPLACED: Using proper passive voice detection
    // Passive voice: werden/sein (AUX) + past participle (VERB)
    // Check morphology for VerbForm=Part (past participle)
    for (let i = 0; i < tokens.length - 1; i++) {
      const token = tokens[i];
      const nextToken = tokens[i + 1];
      
      if ((token.lemma === 'werden' || token.lemma === 'sein') && 
          nextToken.pos === 'VERB') {
        // Check if next token looks like a past participle (usually starts with 'ge' in German)
        if (nextToken.word.startsWith('ge') || nextToken.lemma.startsWith('ge')) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check if sentence contains subjunctive mood
   */
  private checkSubjunctive(tokens: Token[]): boolean {
    // REPLACED: Using proper subjunctive detection via morphology
    // Konjunktiv II verbs have Mood=subjunctive or specific umlaut forms
    const umlautVerbs = ['würde', 'könnte', 'möchte', 'sollte', 'hätte', 'wäre', 'müsste', 'dürfte'];
    
    return tokens.some(t => {
      // Check for explicit subjunctive mood marker
      if (t.morph?.['mood'] === 'subjunctive') return true;
      // Check for common umlaut forms
      if (umlautVerbs.includes(t.lemma.toLowerCase())) return true;
      return false;
    });
  }

  /**
   * Check if sentence contains subordinate clause
   */
  private checkSubordinateClause(tokens: Token[]): boolean {
    // REPLACED: Using proper subordinate clause detection
    // Subordinate conjunctions trigger subordinate clauses
    const subordinateConjunctions = new Set([
      'dass', 'weil', 'wenn', 'obwohl', 'während', 'bis', 'nachdem', 'bevor',
      'seit', 'sobald', 'sooft', 'sofern', 'indem', 'falls', 'insofern',
      'darin', 'dazu', 'dessen', 'ob', 'damit'
    ]);
    
    return tokens.some(t => subordinateConjunctions.has(t.lemma.toLowerCase()));
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
export type { GrammarAnalysisResult } from '../grammarEngine/detectionEngine';
