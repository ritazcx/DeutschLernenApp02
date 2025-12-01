/**
 * Morphological Analyzer - 形态学分析模块
 * 分析词的性、数、格、时态、语态等形态特征
 */

import Database from 'better-sqlite3';
import path from 'path';
import { MorphFeature } from './types';

export class MorphAnalyzer {
  private db: Database.Database;

  // 强变名词（以-e, -en, -er, -el, -el结尾）
  private strongNounEndings = {
    // 阴性 -ung, -heit, -keit
    feminine: ['ung', 'heit', 'keit', 'tion', 'sion', 'schaft'],
    // 中性 -chen, -lein
    neuter: ['chen', 'lein'],
    // 阳性 最常见
    masculine: []
  };

  // 虚拟语气标志
  private subjunctiveMarkers = ['ä', 'ö', 'ü'];

  constructor(dbPath?: string) {
    const defaultPath = dbPath || path.resolve(__dirname, '../../../data/dictionary.db');
    this.db = new Database(defaultPath);
  }

  /**
   * 分析名词的形态特征
   */
  analyzeNoun(word: string, lemma: string, article?: string): MorphFeature {
    const morph: MorphFeature = {
      case: 'nominative',
      number: 'singular',
      gender: this.detectGender(lemma, article) as any,
      tense: 'n/a',
      mood: 'n/a',
      person: 'n/a',
      voice: 'n/a'
    };

    // 检测复数（-e, -en, -er, -s结尾通常是复数）
    if (word.endsWith('e') || word.endsWith('en') || word.endsWith('er') || word.endsWith('s')) {
      const singular = this.getSingularForm(word);
      if (singular !== word) {
        morph.number = 'plural';
      }
    }

    // 检测格（通过词的变化）
    morph.case = this.detectNounCase(word, lemma, article) as any;

    return morph;
  }

  /**
   * 分析动词的形态特征
   */
  analyzeVerb(word: string, lemma: string): MorphFeature {
    const morph: MorphFeature = {
      case: 'n/a',
      number: 'n/a',
      gender: 'n/a',
      tense: this.detectVerbTense(word, lemma) as any,
      mood: this.detectVerbMood(word) as any,
      person: this.detectVerbPerson(word) as any,
      voice: 'active'  // 简化：只检测被动语态在句子级别
    };

    return morph;
  }

  /**
   * 分析形容词的形态特征
   */
  analyzeAdjective(
    word: string,
    lemma: string,
    context?: {article?: string, noun?: {gender: string, number: string, case: string}}
  ): MorphFeature {
    const morph: MorphFeature = {
      case: (context?.noun?.case || 'n/a') as any,
      number: (context?.noun?.number || 'n/a') as any,
      gender: (context?.noun?.gender || 'n/a') as any,
      tense: 'n/a',
      mood: 'n/a',
      person: 'n/a',
      voice: 'n/a'
    };

    return morph;
  }

  /**
   * 分析代词的形态特征
   */
  analyzePronoun(word: string): MorphFeature {
    const lowerWord = word.toLowerCase();
    const morph: MorphFeature = {
      case: 'n/a',
      number: 'n/a',
      gender: 'n/a',
      tense: 'n/a',
      mood: 'n/a',
      person: 'n/a',
      voice: 'n/a'
    };

    // 人称代词
    const personalPronouns: Record<string, {case: string, number: string, person: string}> = {
      'ich': {case: 'nominative', number: 'singular', person: '1sg'},
      'du': {case: 'nominative', number: 'singular', person: '2sg'},
      'er': {case: 'nominative', number: 'singular', person: '3sg'},
      'sie': {case: 'nominative', number: 'singular', person: '3sg'},
      'es': {case: 'nominative', number: 'singular', person: '3sg'},
      'wir': {case: 'nominative', number: 'plural', person: '1pl'},
      'ihr': {case: 'nominative', number: 'plural', person: '2pl'},
      'Sie': {case: 'nominative', number: 'plural', person: '2sg'}, // formal
      'mich': {case: 'accusative', number: 'singular', person: '1sg'},
      'dich': {case: 'accusative', number: 'singular', person: '2sg'},
      'ihn': {case: 'accusative', number: 'singular', person: '3sg'},
      'uns': {case: 'accusative', number: 'plural', person: '1pl'},
      'euch': {case: 'accusative', number: 'plural', person: '2pl'},
      'mir': {case: 'dative', number: 'singular', person: '1sg'},
      'dir': {case: 'dative', number: 'singular', person: '2sg'},
      'ihm': {case: 'dative', number: 'singular', person: '3sg'},
      'ihnen': {case: 'dative', number: 'plural', person: '3pl'},
    };

    if (personalPronouns[lowerWord]) {
      const info = personalPronouns[lowerWord];
      morph.case = info.case as any;
      morph.number = info.number as any;
      morph.person = info.person as any;
    }

    return morph;
  }

  /**
   * 检测名词性别（通过冠词和词尾）
   */
  private detectGender(lemma: string, article?: string): string {
    // 通过冠词
    if (article) {
      const genderMap: Record<string, string> = {
        'der': 'masculine',
        'die': 'feminine',
        'das': 'neuter',
      };
      if (genderMap[article]) return genderMap[article];
    }

    // 通过词汇库查询
    try {
      const stmt = this.db.prepare('SELECT article FROM vocabulary WHERE LOWER(word) = ?');
      const result = stmt.get(lemma) as {article: string} | undefined;
      
      if (result && result.article) {
        const genderMap: Record<string, string> = {
          'der': 'masculine',
          'die': 'feminine',
          'das': 'neuter',
        };
        return genderMap[result.article] || 'n/a';
      }
    } catch (error) {
      // 忽略错误
    }

    // 通过词尾启发式
    if (lemma.endsWith('ung') || lemma.endsWith('heit') || lemma.endsWith('keit')) {
      return 'feminine';
    }
    if (lemma.endsWith('chen') || lemma.endsWith('lein')) {
      return 'neuter';
    }

    return 'n/a';
  }

  /**
   * 检测名词的格（简化版）
   */
  private detectNounCase(word: string, lemma: string, article?: string): string {
    // 在完整系统中，这需要上下文和更复杂的规则
    // 这里只是简化版本
    if (article) {
      const caseMap: Record<string, string> = {
        'der': 'nominative',     // der Mann
        'die': 'nominative',     // die Frau
        'das': 'nominative',     // das Kind
        'den': 'accusative',     // den Mann
        'dem': 'dative',         // dem Mann
        'des': 'genitive',       // des Mannes
      };
      if (caseMap[article]) return caseMap[article];
    }

    return 'n/a';
  }

  /**
   * 检测名词的单数形式
   */
  private getSingularForm(pluralWord: string): string {
    // 简单规则：去掉常见复数后缀
    if (pluralWord.endsWith('en')) return pluralWord.slice(0, -2);
    if (pluralWord.endsWith('er')) return pluralWord.slice(0, -2);
    if (pluralWord.endsWith('e')) return pluralWord.slice(0, -1);
    if (pluralWord.endsWith('s')) return pluralWord.slice(0, -1);
    return pluralWord;
  }

  /**
   * 检测动词时态
   */
  private detectVerbTense(word: string, lemma: string): string {
    // 完全分词: ge...t / ge...en / ge...et
    if (word.startsWith('ge') && (word.endsWith('t') || word.endsWith('en') || word.endsWith('et'))) {
      // 需要进一步确定是完成时还是过去分词
      return 'perfect';
    }

    // 简单过去式: ...te / ...ten / ...test / ...tet
    if (word.endsWith('te') || word.endsWith('ten') || word.endsWith('test') || word.endsWith('tet')) {
      return 'past';
    }

    // 未来时: werden + infinitive
    if (word === 'werden') {
      return 'future';
    }

    // 默认: 现在时
    return 'present';
  }

  /**
   * 检测动词语态
   */
  private detectVerbMood(word: string): string {
    const lowerWord = word.toLowerCase();

    // 虚拟语气通常有变音 ä, ö, ü
    if (/[äöü]/.test(word)) {
      // könnte, würde, möchte 等
      if (word.endsWith('te')) {
        return 'subjunctive';  // Konjunktiv II (would/could)
      }
    }

    // 命令式：通常是2sg/2pl的特殊形式
    if (lowerWord === 'geh' || lowerWord === 'geht' || lowerWord === 'geben') {
      // 这些可能是命令式，但需要更多上下文
      return 'imperative';
    }

    // 默认：陈述式
    return 'indicative';
  }

  /**
   * 检测动词人称
   */
  private detectVerbPerson(word: string): string {
    const lowerWord = word.toLowerCase();

    // 第三人称单数通常以-t结尾（例如：geht, trinkt）
    if (word.endsWith('t') && word.length > 2) {
      return '3sg';
    }

    // 第一人称单数以-e结尾（例如：gehe, trinke）
    if (word.endsWith('e') && word.length > 2 && !word.endsWith('ie')) {
      return '1sg';
    }

    // 复数形式以-en结尾（例如：gehen, trinken）
    if (word.endsWith('en') && word.length > 3) {
      return '1pl';  // 或 3pl，在这里简化为1pl
    }

    return 'n/a';
  }

  /**
   * 检测形容词变化
   */
  private detectAdjectiveDeclension(
    word: string,
    article?: string,
    noun?: {gender: string, number: string, case: string}
  ): string {
    // 强变化（无冠词）：大多数形容词含有性/数/格标志
    // 弱变化（有定冠词）：形容词相对简单，只在特定位置有标志
    // 混合变化（有不定冠词）：介于两者之间

    if (!article) {
      return 'strong';  // 强变化
    }

    if (['der', 'die', 'das', 'den', 'dem', 'des'].includes(article)) {
      return 'weak';    // 弱变化（定冠词）
    }

    if (['ein', 'eine', 'einem', 'einen', 'einer'].includes(article)) {
      return 'mixed';   // 混合变化（不定冠词）
    }

    return 'n/a';
  }

  /**
   * 关闭数据库
   */
  close(): void {
    this.db.close();
  }
}
