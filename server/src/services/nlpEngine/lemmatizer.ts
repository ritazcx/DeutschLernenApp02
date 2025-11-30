/**
 * German Lemmatizer - 德语词形还原模块
 * 将任何词变回原始形式（lemma）
 */

import Database from 'better-sqlite3';
import path from 'path';

export interface LemmatizerResult {
  word: string;
  lemma: string;
  confidence: number;  // 0-1
  isSeparableVerb?: boolean;
  method: 'vocab' | 'rule' | 'heuristic';  // 使用的方法
}

export class GermanLemmatizer {
  private db: Database.Database;
  
  // 可分动词前缀列表
  private separablePrefixes = [
    'ab', 'an', 'auf', 'aus', 'bei', 'ein', 'ent', 'er', 'fort',
    'mit', 'nach', 'vor', 'weg', 'weiter', 'zu', 'zurück', 'zusammen',
    'durch', 'über', 'um', 'unter'
  ];

  // 常见动词变位规则
  private verbRules = {
    // 规则1: 去掉-e, -est, -en, -et 后缀（现在时变位）
    presentEndings: ['e', 'est', 'en', 'et'],
    // 规则2: -te, -test, -ten, -tet（过去式）
    pastEndings: ['te', 'test', 'ten', 'tet'],
    // 规则3: -et (第三人称单数, 你敬语复数)
    participleEndings: ['t', 'd'],
  };

  // 不规则动词表（部分）
  private irregularVerbs: Record<string, string[]> = {
    'sein': ['bin', 'bist', 'ist', 'sind', 'seid', 'war', 'warst', 'waren', 'wart', 'gewesen'],
    'haben': ['habe', 'hast', 'hat', 'haben', 'habt', 'hatte', 'hattest', 'hatten', 'hattet', 'gehabt'],
    'werden': ['werde', 'wirst', 'wird', 'werden', 'werdet', 'wurde', 'wurdest', 'würde', 'geworden'],
    'können': ['kann', 'kannst', 'könnte', 'gekonnt', 'konnten'],
    'müssen': ['muss', 'musst', 'müsse', 'musste', 'gemusst'],
    'dürfen': ['darf', 'darfst', 'dürfte', 'gedurft'],
    'sollen': ['soll', 'sollst', 'soll', 'sollten', 'gesollt'],
    'wollen': ['will', 'willst', 'wollte', 'gewollt'],
    'lassen': ['lasse', 'lässt', 'ließ', 'gelassen'],
    'gehen': ['gehe', 'gehst', 'geht', 'gehen', 'geht', 'ging', 'gingst', 'gingen', 'gingt', 'gegangen'],
    'kommen': ['komme', 'kommst', 'kommt', 'kommen', 'kommt', 'kam', 'kamst', 'kamen', 'kamt', 'gekommen'],
    'sehen': ['sehe', 'siehst', 'sieht', 'sehen', 'seht', 'sah', 'sahst', 'sahen', 'saht', 'gesehen'],
    'machen': ['mache', 'machst', 'macht', 'machen', 'macht', 'machte', 'machtest', 'machten', 'machtet', 'gemacht'],
    'geben': ['gebe', 'gibst', 'gibt', 'geben', 'gebt', 'gab', 'gabst', 'gaben', 'gabt', 'gegeben'],
  };

  // 名词复数规则（常见）
  private nounRules = {
    // -e 复数
    pluralE: ['Bett', 'Feld', 'Gast', 'Jahr', 'Jahr', 'Land', 'Lied', 'Nacht', 'Platz', 'Schritt', 'Sohn', 'Satz', 'Tag', 'Traum', 'Wort', 'Zug'],
    // -er 复数（带变音）
    pluralEr: ['Bild', 'Buch', 'Bruch', 'Dach', 'Dorf', 'Fach', 'Fall', 'Fest', 'Fuss', 'Geld', 'Gicht', 'Glas', 'Gott', 'Grab', 'Grat', 'Grund', 'Grus', 'Guss', 'Haar', 'Haft', 'Haft', 'Hand', 'Hass', 'Haupt', 'Haus', 'Haut', 'Heck', 'Heft', 'Held', 'Hell', 'Helm', 'Hemd', 'Herd', 'Herde', 'Herr', 'Herrn', 'Hers'],
    // -s 复数（外来词）
    pluralS: ['Auto', 'Bus', 'Café', 'Foto', 'Kino', 'Loft', 'Pizza', 'Radio', 'Sofa', 'Taxi', 'Test', 'Zoo'],
  };

  constructor(dbPath?: string) {
    const defaultPath = dbPath || path.resolve(__dirname, '../../data/dictionary.db');
    this.db = new Database(defaultPath);
  }

  /**
   * 词形还原主方法
   */
  lemmatize(word: string): LemmatizerResult {
    const lowerWord = word.toLowerCase();

    // 方法1: 直接从词汇库查询
    const vocabResult = this.lookupInVocab(lowerWord);
    if (vocabResult) {
      return {
        word,
        lemma: vocabResult,
        confidence: 0.99,
        method: 'vocab'
      };
    }

    // 方法2: 检查是否是可分动词
    const separableResult = this.checkSeparableVerb(lowerWord);
    if (separableResult) {
      return separableResult;
    }

    // 方法3: 应用规则
    const ruleResult = this.applyLemmatizationRules(lowerWord);
    if (ruleResult) {
      return ruleResult;
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
   * 应用词形还原规则
   */
  private applyLemmatizationRules(word: string): LemmatizerResult | null {
    // 规则1: 检查不规则动词
    for (const [lemma, forms] of Object.entries(this.irregularVerbs)) {
      if (forms.includes(word)) {
        return {
          word,
          lemma,
          confidence: 0.95,
          method: 'rule'
        };
      }
    }

    // 规则2: 尝试去掉规则动词后缀
    for (const ending of [...this.verbRules.presentEndings, ...this.verbRules.pastEndings]) {
      if (word.endsWith(ending) && word.length > ending.length + 2) {
        const root = word.substring(0, word.length - ending.length);
        
        // 检查root是否在词汇库
        const vocabLemma = this.lookupInVocab(root);
        if (vocabLemma) {
          return {
            word,
            lemma: vocabLemma,
            confidence: 0.8,
            method: 'rule'
          };
        }
      }
    }

    // 规则3: 分词去掉 ge- 前缀和 -t/-en/-et 后缀
    // 例如: "gegangen" → "gehen"
    if (word.startsWith('ge') && word.length > 4) {
      const withoutGe = word.substring(2);
      
      for (const ending of ['t', 'en', 'et', 'd']) {
        if (withoutGe.endsWith(ending)) {
          const root = withoutGe.substring(0, withoutGe.length - ending.length);
          const vocabLemma = this.lookupInVocab(root);
          if (vocabLemma) {
            return {
              word,
              lemma: vocabLemma,
              confidence: 0.85,
              method: 'rule'
            };
          }
        }
      }
    }

    // 规则4: 名词复数还原
    // -e 结尾通常是复数
    if (word.endsWith('e') && word.length > 3) {
      const singular = word.substring(0, word.length - 1);
      const vocabLemma = this.lookupInVocab(singular);
      if (vocabLemma) {
        return {
          word,
          lemma: vocabLemma,
          confidence: 0.7,
          method: 'rule'
        };
      }
    }

    // -er 结尾通常是复数
    if (word.endsWith('er') && word.length > 4) {
      const singular = word.substring(0, word.length - 2);
      const vocabLemma = this.lookupInVocab(singular);
      if (vocabLemma) {
        return {
          word,
          lemma: vocabLemma,
          confidence: 0.65,
          method: 'rule'
        };
      }
    }

    return null;
  }

  /**
   * 批量词形还原
   */
  lemmatizeMultiple(words: string[]): LemmatizerResult[] {
    return words.map(word => this.lemmatize(word));
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    this.db.close();
  }
}
