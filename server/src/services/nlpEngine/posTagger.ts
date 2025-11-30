/**
 * POS Tagger - 词性标注模块
 * 识别词的词性（名词、动词、形容词等）
 */

import Database from 'better-sqlite3';
import path from 'path';

export interface POSResult {
  word: string;
  pos: string;
  confidence: number;
  method: 'vocab' | 'rule' | 'heuristic';
}

export class POSTagger {
  private db: Database.Database;

  // 词尾规则 → 词性（按优先级排序，更具体的规则在前）
  private suffixRules: Record<string, string> = {
    // 动词特征（最高优先级）
    'ieren': 'VERB',  // realisieren, organisieren
    'eln': 'VERB',    // sammeln, ändern
    'ern': 'VERB',    // wandern, ändern
    
    // 过去分词特征 - CRITICAL ADD
    // Pattern: ge...t (regular past participle: ge-root-t)
    // Pattern: ge...en (irregular past participle: ge-root-en)
    // These need high priority because they often match noun endings too
    
    // 名词特征
    'ung': 'NOUN',    // Lösung, Prüfung
    'heit': 'NOUN',   // Krankheit, Freiheit
    'keit': 'NOUN',   // Möglichkeit, Wirklichkeit
    'nis': 'NOUN',    // Kenntnis, Ergebnis
    'ism': 'NOUN',    // Realismus
    'ismus': 'NOUN',  // Kapitalismus
    'ium': 'NOUN',    // Museum
    'tion': 'NOUN',   // (Latin loans)
    'sion': 'NOUN',   // (Latin loans)
    'schaft': 'NOUN', // Wissenschaft, Freundschaft
    'tum': 'NOUN',    // Eigentum, Reichtum
    'ment': 'NOUN',   // Argument, Moment

    // 形容词特征
    'lich': 'ADJ',    // natürlich, möglich
    'bar': 'ADJ',     // wunderbar, lesenswert
    'sam': 'ADJ',     // aufmerksam
    'voll': 'ADJ',    // freudvoll, sorgenvoll
    'los': 'ADJ',     // hoffnungslos, arbeitslos
    'haft': 'ADJ',    // wirklichkeitshaft
    'ig': 'ADJ',      // traurig, mutig
    'el': 'ADJ',      // ähnlich, heiklig
    'er': 'ADJ',      // dunkel, dunkelblau (color adj)

    // 副词特征
    'weise': 'ADV',   // normalweise, glücklicherweise
    'wärts': 'ADV',   // vorwärts, rückwärts
  };

  // 首字母大写 → likely 名词（德语特征）
  // 某些单词的词性需要hardcode
  private hardcodePOS: Record<string, string> = {
    'der': 'ART',
    'die': 'ART',
    'das': 'ART',
    'den': 'ART',
    'dem': 'ART',
    'des': 'ART',
    'ein': 'ART',
    'eine': 'ART',
    'einem': 'ART',
    'einen': 'ART',
    'einer': 'ART',
    'eines': 'ART',

    'und': 'CONJ',
    'oder': 'CONJ',
    'aber': 'CONJ',
    'wenn': 'CONJ',
    'weil': 'CONJ',
    'dass': 'CONJ',
    'denn': 'CONJ',
    'ob': 'CONJ',

    'ich': 'PRON',
    'du': 'PRON',
    'er': 'PRON',
    'sie': 'PRON',
    'es': 'PRON',
    'wir': 'PRON',
    'ihr': 'PRON',
    'Sie': 'PRON',

    'in': 'PREP',
    'auf': 'PREP',
    'an': 'PREP',
    'von': 'PREP',
    'zu': 'PREP',
    'mit': 'PREP',
    'für': 'PREP',
    'über': 'PREP',
    'unter': 'PREP',
    'bei': 'PREP',
    'nach': 'PREP',
    'vor': 'PREP',
    'durch': 'PREP',
    'gegen': 'PREP',
    'ohne': 'PREP',
    'bis': 'PREP',
    'seit': 'PREP',
    'während': 'PREP',
    'außer': 'PREP',

    'sehr': 'ADV',
    'nicht': 'ADV',
    'auch': 'ADV',
    'nur': 'ADV',
    'noch': 'ADV',
    'bereits': 'ADV',
    'schon': 'ADV',
    'immer': 'ADV',
    'nie': 'ADV',
    'hier': 'ADV',
    'dort': 'ADV',
    'oben': 'ADV',
    'unten': 'ADV',
    'heute': 'ADV',
    'morgen': 'ADV',
    'gestern': 'ADV',

    // 常见德语动词（无穷式形式）
    'sein': 'VERB',
    'haben': 'VERB',
    'werden': 'VERB',
    'können': 'VERB',
    'müssen': 'VERB',
    'wollen': 'VERB',
    'sollen': 'VERB',
    'dürfen': 'VERB',
    'mögen': 'VERB',
    'möchte': 'VERB',
    'lassen': 'VERB',
    'gehen': 'VERB',
    'kommen': 'VERB',
    'geben': 'VERB',
    'nehmen': 'VERB',
    'machen': 'VERB',
    'sehen': 'VERB',
    'sprechen': 'VERB',
    'schreiben': 'VERB',
    'lesen': 'VERB',
    'hören': 'VERB',
    'denken': 'VERB',
    'wissen': 'VERB',
    'glauben': 'VERB',
    'zeigen': 'VERB',
    'fragen': 'VERB',
    'antworten': 'VERB',
    'sagen': 'VERB',
    'finden': 'VERB',
    'stehen': 'VERB',
    'sitzen': 'VERB',
    'fallen': 'VERB',
    'tragen': 'VERB',
    'halten': 'VERB',
    'fahren': 'VERB',
    'fliegen': 'VERB',
    'rennen': 'VERB',
    'laufen': 'VERB',
    'bleiben': 'VERB',
    'erscheinen': 'VERB',
    'verstehen': 'VERB',
    'beginnen': 'VERB',
    'anfangen': 'VERB',
    'enden': 'VERB',
    'schließen': 'VERB',
    'öffnen': 'VERB',
    'bringen': 'VERB',
    'setzen': 'VERB',
    'legen': 'VERB',
    'stellen': 'VERB',
    'hängen': 'VERB',
    'kochen': 'VERB',
    'essen': 'VERB',
    'trinken': 'VERB',
    'kaufen': 'VERB',
    'verkaufen': 'VERB',
    'arbeiten': 'VERB',
    'spielen': 'VERB',
    'tanzen': 'VERB',
    'singen': 'VERB',
    'lachen': 'VERB',
    'weinen': 'VERB',
    'lieben': 'VERB',
    'hassen': 'VERB',
    'brauchen': 'VERB',
    'vergessen': 'VERB',
    'erinnern': 'VERB',
    'freuen': 'VERB',
    'fürchten': 'VERB',
    'hoffen': 'VERB',
    'wünschen': 'VERB',
    'rufen': 'VERB',
    'anrufen': 'VERB',
    'aufwachen': 'VERB',
    'schlafen': 'VERB',
    'erwachen': 'VERB',
    'wachsen': 'VERB',
    'sterben': 'VERB',
    'gebären': 'VERB',
    'bewegen': 'VERB',
    'ändern': 'VERB',
    'verbessern': 'VERB',
    'zerstören': 'VERB',
    'bauen': 'VERB',
    'zeichnen': 'VERB',
    'malen': 'VERB',
    'einladen': 'VERB',
    'einzureichen': 'VERB',
    'stattfinden': 'VERB',
    'reichen': 'VERB',

    // German contractions (Kontraktionen) - NEW
    'zum': 'PREP',      // zu + dem
    'zur': 'PREP',      // zu + der
    'am': 'PREP',       // an + dem
    'im': 'PREP',       // in + dem
    'beim': 'PREP',     // bei + dem
    'vom': 'PREP',      // von + dem
    'ans': 'PREP',      // an + das
    'ins': 'PREP',      // in + das
    'aufs': 'PREP',     // auf + das
    'ums': 'PREP',      // um + das
    'übers': 'PREP',    // über + das
  };

  constructor(dbPath?: string) {
    const defaultPath = dbPath || path.resolve(__dirname, '../../../data/dictionary.db');
    this.db = new Database(defaultPath);
  }

  /**
   * 标注单个词
   */
  tag(word: string, context?: {previous?: string, next?: string}): POSResult {
    const lowerWord = word.toLowerCase();

    // 方法1: hardcode规则
    if (this.hardcodePOS[lowerWord]) {
      return {
        word,
        pos: this.hardcodePOS[lowerWord],
        confidence: 1.0,
        method: 'rule'
      };
    }

    // 方法2: 从词汇库查询
    const vocabPOS = this.lookupInVocab(lowerWord);
    if (vocabPOS) {
      return {
        word,
        pos: vocabPOS,
        confidence: 0.95,
        method: 'vocab'
      };
    }

    // 方法3: 上下文启发式（重要！）
    // 如果前面是 "zu"，很可能是不定式动词
    if (context?.previous === 'zu' && !lowerWord.endsWith('t') && !lowerWord.endsWith('s')) {
      return {
        word,
        pos: 'VERB',
        confidence: 0.95,
        method: 'rule'
      };
    }

    // 如果前面是 modal verb，很可能是不定式动词
    const modalVerbs = ['können', 'müssen', 'wollen', 'sollen', 'dürfen', 'mögen', 'möchte'];
    if (context?.previous && modalVerbs.includes(context.previous)) {
      return {
        word,
        pos: 'VERB',
        confidence: 0.9,
        method: 'rule'
      };
    }

    // 方法4: 词尾规则
    const suffixPOS = this.applySuffixRules(lowerWord);
    if (suffixPOS) {
      return {
        word,
        pos: suffixPOS,
        confidence: 0.7,
        method: 'rule'
      };
    }

    // 方法5: 大写启发式（德语名词大写）
    if (word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase()) {
      return {
        word,
        pos: 'NOUN',
        confidence: 0.6,
        method: 'heuristic'
      };
    }

    // 默认: 启发式猜测（倾向于名词）
    return {
      word,
      pos: 'NOUN',
      confidence: 0.3,
      method: 'heuristic'
    };
  }

  /**
   * 标注句子中的所有词（带上下文）
   */
  tagSentence(tokens: string[]): POSResult[] {
    return tokens.map((token, idx) => {
      const context = {
        previous: idx > 0 ? tokens[idx - 1].toLowerCase() : undefined,
        next: idx < tokens.length - 1 ? tokens[idx + 1].toLowerCase() : undefined
      };
      return this.tag(token, context);
    });
  }

  /**
   * 从词汇库查询词性
   */
  private lookupInVocab(word: string): string | null {
    try {
      const stmt = this.db.prepare('SELECT pos FROM vocabulary WHERE LOWER(word) = ?');
      const result = stmt.get(word) as {pos: string} | undefined;
      return result && result.pos ? result.pos : null;
    } catch (error) {
      console.error('Database lookup error:', error);
      return null;
    }
  }

  /**
   * 应用词尾规则
   */
  private applySuffixRules(word: string): string | null {
    for (const [suffix, pos] of Object.entries(this.suffixRules)) {
      if (word.endsWith(suffix)) {
        return pos;
      }
    }
    return null;
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    this.db.close();
  }
}
