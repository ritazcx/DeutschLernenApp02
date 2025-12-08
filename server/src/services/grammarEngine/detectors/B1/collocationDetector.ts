/**
 * Collocation Detector
 * Identifies important word collocations and fixed phrases at B1 level
 */

import { BaseGrammarDetector, DetectionResult, SentenceData, TokenData } from '../shared/baseDetector';
import { B1_GRAMMAR, GrammarCategory } from '../../cefr-taxonomy';

type CollocationPattern = {
  lemmas: string[];
  deps?: string[];
  type: string;
  collocation: string;
  flexibleOrder?: boolean;
  optional?: boolean[];
};

export class CollocationDetector extends BaseGrammarDetector {
  name = 'CollocationDetector';
  category: GrammarCategory = 'collocation';

  // 长期可维护的搭配库（可扩展、可配置）
  private patterns: CollocationPattern[] = [
    { lemmas: ['freuen', 'sich', 'auf'], type: 'reflexive-prep', collocation: 'sich freuen auf' },
    { lemmas: ['fürchten', 'sich', 'vor'], type: 'reflexive-prep', collocation: 'sich fürchten vor' },
    { lemmas: ['interessieren', 'sich', 'für'], type: 'reflexive-prep', collocation: 'sich interessieren für' },
    { lemmas: ['kümmern', 'sich', 'um'], type: 'reflexive-prep', collocation: 'sich kümmern um' },
    { lemmas: ['sorgen', 'sich', 'um'], type: 'reflexive-prep', collocation: 'sich sorgen um' },
    { lemmas: ['gewöhnen', 'sich', 'an'], type: 'reflexive-prep', collocation: 'sich gewöhnen an' },
    { lemmas: ['haben', 'Angst'], type: 'verb-noun', collocation: 'Angst haben' },
    { lemmas: ['haben', 'Hunger'], type: 'verb-noun', collocation: 'Hunger haben' },
    { lemmas: ['haben', 'Durst'], type: 'verb-noun', collocation: 'Durst haben' },
    { lemmas: ['haben', 'Recht'], type: 'verb-noun', collocation: 'Recht haben' },
    { lemmas: ['haben', 'Glück'], type: 'verb-noun', collocation: 'Glück haben' },
    { lemmas: ['machen', 'Urlaub'], type: 'verb-noun', collocation: 'Urlaub machen' },
    { lemmas: ['machen', 'Sport'], type: 'verb-noun', collocation: 'Sport machen' },
    { lemmas: ['machen', 'Fehler'], type: 'verb-noun', collocation: 'einen Fehler machen' },
    // 常见动介固定搭配
    { lemmas: ['warten', 'auf'], type: 'verb-prep', collocation: 'warten auf' },
    { lemmas: ['denken', 'an'], type: 'verb-prep', collocation: 'denken an' },
    { lemmas: ['glauben', 'an'], type: 'verb-prep', collocation: 'glauben an' },
    { lemmas: ['teilnehmen', 'an'], type: 'verb-prep', collocation: 'teilnehmen an' },
    { lemmas: ['halten', 'von'], type: 'verb-prep', collocation: 'halten von' },
    { lemmas: ['erinnern', 'sich', 'an'], type: 'reflexive-prep', collocation: 'sich erinnern an' },
    { lemmas: ['interessieren', 'sich', 'für'], type: 'reflexive-prep', collocation: 'sich interessieren für' },
    { lemmas: ['kümmern', 'sich', 'um'], type: 'reflexive-prep', collocation: 'sich kümmern um' },
    { lemmas: ['freuen', 'sich', 'auf'], type: 'reflexive-prep', collocation: 'sich freuen auf' },
    { lemmas: ['vorbereiten', 'sich', 'auf'], type: 'reflexive-prep', collocation: 'sich vorbereiten auf' },
    { lemmas: ['sprechen', 'über'], type: 'verb-prep', collocation: 'sprechen über' },
    { lemmas: ['unterhalten', 'sich', 'über'], type: 'reflexive-prep', collocation: 'sich unterhalten über' },
    { lemmas: ['beschweren', 'sich', 'über'], type: 'reflexive-prep', collocation: 'sich beschweren über' },
    { lemmas: ['bewerben', 'sich', 'um'], type: 'reflexive-prep', collocation: 'sich bewerben um' },
    { lemmas: ['achten', 'auf'], type: 'verb-prep', collocation: 'achten auf' },
    { lemmas: ['helfen', 'bei'], type: 'verb-prep', collocation: 'helfen bei' },
    { lemmas: ['anfangen', 'mit'], type: 'verb-prep', collocation: 'anfangen mit' },
    { lemmas: ['aufhören', 'mit'], type: 'verb-prep', collocation: 'aufhören mit' },
    { lemmas: ['fragen', 'nach'], type: 'verb-prep', collocation: 'fragen nach' },
    { lemmas: ['suchen', 'nach'], type: 'verb-prep', collocation: 'suchen nach' },
    { lemmas: ['gehören', 'zu'], type: 'verb-prep', collocation: 'gehören zu' },
    { lemmas: ['zählen', 'zu'], type: 'verb-prep', collocation: 'zählen zu' },
    { lemmas: ['gratulieren', 'zu'], type: 'verb-prep', collocation: 'gratulieren zu' },
    { lemmas: ['passen', 'zu'], type: 'verb-prep', collocation: 'passen zu' },
    { lemmas: ['bestehen', 'aus'], type: 'verb-prep', collocation: 'bestehen aus' },
    { lemmas: ['leiden', 'an'], type: 'verb-prep', collocation: 'leiden an' },
    { lemmas: ['leiden', 'unter'], type: 'verb-prep', collocation: 'leiden unter' },
    { lemmas: ['sterben', 'an'], type: 'verb-prep', collocation: 'sterben an' },
    { lemmas: ['träumen', 'von'], type: 'verb-prep', collocation: 'träumen von' },
    { lemmas: ['erzählen', 'von'], type: 'verb-prep', collocation: 'erzählen von' },
    { lemmas: ['abhängen', 'von'], type: 'verb-prep', collocation: 'abhängen von' },
    { lemmas: ['überzeugen', 'von'], type: 'verb-prep', collocation: 'überzeugen von' },
    { lemmas: ['schützen', 'vor'], type: 'verb-prep', collocation: 'schützen vor' },
    { lemmas: ['warnen', 'vor'], type: 'verb-prep', collocation: 'warnen vor' },
    { lemmas: ['einladen', 'zu'], type: 'verb-prep', collocation: 'einladen zu' },
  ];
  // ...existing code...

  /**
   * Detect collocations in a sentence
   */
  detect(sentence: SentenceData): DetectionResult[] {
    // Debug 输出 spaCy token 结构
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[CollocationDetector] tokens:', sentence.tokens.map(t => ({
        text: t.text, lemma: t.lemma, pos: t.pos, dep: t.dep, index: t.index
      })));
    }
    const results: DetectionResult[] = [];
    for (const pattern of this.patterns) {
      // Prefer dependency-aware matching for German collocations
      const depMatches = this.findCollocationsByDependency(sentence.tokens, pattern);
      const matches = depMatches.length ? depMatches : this.findCollocations(sentence.tokens, pattern);
      if (matches.length && process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log(`[CollocationDetector] matched pattern=${pattern.collocation}, matches=`, matches.map(m => m.map(t => t.text)));
      }
      for (const match of matches) {
        const tokenObjects = match; // TokenData[]
        const words = tokenObjects.map(t => t.text);
        results.push(
          this.createResult(
            {
              id: `collocation-${pattern.collocation.replace(/\s+/g, '-')}`,
              category: 'collocation',
              level: 'B1',
              name: 'Collocation',
              description: 'Fixed multi-word expressions',
              examples: [pattern.collocation],
              explanation: 'Native-like fixed expressions.',
            },
            this.calculatePosition(sentence.tokens, match[0].index, match[match.length - 1].index),
            0.85,
            {
              collocation: pattern.collocation,
              type: pattern.type,
              words,
              tokenObjects,
              lemmas: tokenObjects.map(t => t.lemma),
              pos: tokenObjects.map(t => t.pos),
              deps: tokenObjects.map(t => t.dep),
            }
          )
        );
      }
    }
    return results;
  }

  /**
   * Debug helper that returns detailed attempt information for each pattern.
   * This is intended for development and diagnostic use only.
   */
  debugAnalyze(sentence: SentenceData) {
    const report: any[] = [];
    for (const pattern of this.patterns) {
      const attempts: any[] = [];
      const lemmas = pattern.lemmas.map(l => l.toLowerCase());

      // collect verb candidates
      const verbLemma = lemmas[0];
      const verbCandidates = sentence.tokens.filter(t => t.lemma && this.lemmaMatches(t.lemma, verbLemma)).map(t => ({ text: t.text, lemma: t.lemma, pos: t.pos, index: t.index }));

      if (pattern.type === 'reflexive-prep') {
        const prepLemma = lemmas[2];
        for (const verb of sentence.tokens.filter(t => t.lemma && this.lemmaMatches(t.lemma, verbLemma))) {
          const verbInfo = { text: verb.text, lemma: verb.lemma, pos: verb.pos, index: verb.index };
          const reflexives = sentence.tokens.filter(t => (t.lemma === 'sich' || ['mich','dich','uns','euch','mir','dir','ihm','ihr','ihnen'].includes(t.text.toLowerCase())) && t.head === verb.text).map(t => ({ text: t.text, lemma: t.lemma, dep: t.dep, index: t.index }));
          const preps = sentence.tokens.filter(t => t.lemma && this.lemmaMatches(t.lemma, prepLemma) && (t.head === verb.text || t.dep === 'prep' || t.dep === 'op')).map(t => ({ text: t.text, lemma: t.lemma, dep: t.dep, index: t.index }));
          const matched = reflexives.length > 0 && preps.length > 0;
          attempts.push({ verb: verbInfo, reflexives, preps, matched });
        }
      } else if (pattern.type === 'verb-prep') {
        const prepLemma = lemmas[1];
        for (const verb of sentence.tokens.filter(t => t.lemma && this.lemmaMatches(t.lemma, verbLemma))) {
          const verbInfo = { text: verb.text, lemma: verb.lemma, pos: verb.pos, index: verb.index };
          const preps = sentence.tokens.filter(t => t.lemma && this.lemmaMatches(t.lemma, prepLemma) && (t.head === verb.text || t.dep === 'prep' || t.dep === 'op' || t.dep === 'mnr')).map(t => ({ text: t.text, lemma: t.lemma, dep: t.dep, index: t.index }));
          const matched = preps.length > 0;
          attempts.push({ verb: verbInfo, preps, matched });
        }
      } else if (pattern.type === 'verb-noun') {
        const nounLemma = lemmas[1];
        for (const verb of sentence.tokens.filter(t => t.lemma && this.lemmaMatches(t.lemma, verbLemma))) {
          const verbInfo = { text: verb.text, lemma: verb.lemma, pos: verb.pos, index: verb.index };
          const nouns = sentence.tokens.filter(t => ((t.lemma && this.lemmaMatches(t.lemma, nounLemma)) || (t.text && t.text.toLowerCase() === nounLemma)) && (t.head === verb.text || t.dep === 'dobj' || t.dep === 'pobj' || t.dep === 'nk')).map(t => ({ text: t.text, lemma: t.lemma, dep: t.dep, index: t.index }));
          const matched = nouns.length > 0;
          attempts.push({ verb: verbInfo, nouns, matched });
        }
      }

      report.push({ pattern: pattern.collocation, type: pattern.type, verbCandidates, attempts });
    }

    return report;
  }

  /**
   * Dependency-aware collocation matching. Uses token.head / token.dep to
   * find verb->reflexive/prep/noun relationships. Returns arrays of TokenData
   * corresponding to the matched elements (in order verb, pronoun/prep/noun).
   */
  private findCollocationsByDependency(tokens: TokenData[], pattern: CollocationPattern): TokenData[][] {
    const matches: TokenData[][] = [];

    const lemmas = pattern.lemmas.map(l => l.toLowerCase());

    // reflexive-prep: [verb, reflexive, prep]
    if (pattern.type === 'reflexive-prep' && lemmas.length >= 3) {
      const verbLemma = lemmas[0];
      const prepLemma = lemmas[2];
      for (const verb of tokens.filter(t => t.lemma && this.lemmaMatches(t.lemma, verbLemma) && (t.pos === 'VERB' || t.pos === 'AUX' || t.pos === 'NOUN' || t.pos === 'ADJ'))) {
        // reflexive: lemma 'sich' or surface pronouns referencing reflexive
        const reflexive = tokens.find(t => (t.lemma === 'sich' || ['mich','dich','uns','euch','mir','dir','ihm','ihr','ihnen'].includes(t.text.toLowerCase())) && t.head === verb.text);
        const prep = tokens.find(t => t.lemma && this.lemmaMatches(t.lemma, prepLemma) && (t.head === verb.text || t.dep === 'prep' || t.dep === 'op'));
        if (reflexive && prep) matches.push([verb, reflexive, prep]);
      }
    }

    // verb-prep: [verb, prep]
    if (pattern.type === 'verb-prep' && lemmas.length >= 2) {
      const verbLemma = lemmas[0];
      const prepLemma = lemmas[1];
      for (const verb of tokens.filter(t => t.lemma && this.lemmaMatches(t.lemma, verbLemma) && (t.pos === 'VERB' || t.pos === 'AUX' || t.pos === 'NOUN' || t.pos === 'ADJ'))) {
        const prep = tokens.find(t => t.lemma && this.lemmaMatches(t.lemma, prepLemma) && (t.head === verb.text || t.dep === 'prep' || t.dep === 'op' || t.dep === 'mnr'));
        if (prep) matches.push([verb, prep]);
      }
    }

    // verb-noun: [verb, noun] where noun depends on verb (dobj/pobj)
    if (pattern.type === 'verb-noun' && lemmas.length >= 2) {
      const verbLemma = lemmas[0];
      const nounLemma = lemmas[1];
      for (const verb of tokens.filter(t => t.lemma && this.lemmaMatches(t.lemma, verbLemma) && (t.pos === 'VERB' || t.pos === 'AUX' || t.pos === 'NOUN'))) {
        const noun = tokens.find(t => ((t.lemma && this.lemmaMatches(t.lemma, nounLemma)) || (t.text && t.text.toLowerCase() === nounLemma)) && (t.head === verb.text || t.dep === 'dobj' || t.dep === 'pobj' || t.dep === 'nk'));
        if (noun) matches.push([verb, noun]);
      }
    }

    return matches;
  }

  /**
   * Lenient lemma matcher: handles small lemma variations (trailing -en/-n), startsWith
   */
  private lemmaMatches(tokenLemma?: string, patternLemma?: string): boolean {
    if (!tokenLemma || !patternLemma) return false;
    const a = tokenLemma.toLowerCase();
    const b = patternLemma.toLowerCase();
    if (a === b) return true;
    if (a.startsWith(b) || b.startsWith(a)) return true;
    const strip = (s: string) => s.replace(/(en|ern|n)$/i, '');
    if (strip(a) === strip(b)) return true;
    return false;
  }

  /**
   * Find all collocation matches in tokens for a given pattern
   * 支持非连续匹配、lemma 变形、reflexive 代词、依赖关系辅助、最大窗口递归、pattern 元素类型扩展
   */
  private findCollocations(tokens: TokenData[], pattern: CollocationPattern): TokenData[][] {
    const matches: TokenData[][] = [];
    const reflexivePronouns = new Set(['mich', 'dich', 'sich', 'uns', 'euch', 'mir', 'dir', 'ihm', 'ihr', 'ihnen']);
    const maxWindow = 7; // 最大窗口长度，防止过度扩展
    // pattern 元素类型扩展：允许 pattern.lemmas 为对象数组
    type PatElem = string | { lemma?: string; text?: string; pos?: string; dep?: string; optional?: boolean; };
    const patElems: PatElem[] = pattern.lemmas as any;
    const self = this as any;
    function matchToken(token: TokenData, pat: PatElem): boolean {
      if (typeof pat === 'string') {
        if (pat === 'sich') {
          return token.lemma === 'sich' || reflexivePronouns.has(token.text.toLowerCase());
        }
        // Prefer lemma matching but fall back to surface form; use lenient lemmaMatches
        if (token.lemma && self.lemmaMatches(token.lemma, pat as string)) return true;
        if (token.text && token.text.toLowerCase() === (pat as string).toLowerCase()) return true;
        return false;
      } else {
        if (pat.lemma && token.lemma?.toLowerCase() !== pat.lemma.toLowerCase()) return false;
        if (pat.text && token.text?.toLowerCase() !== pat.text.toLowerCase()) return false;
        if (pat.pos && token.pos !== pat.pos) return false;
        if (pat.dep && token.dep !== pat.dep) return false;
        return true;
      }
    }
    function search(startIdx: number, patternIdx: number, current: TokenData[]): void {
      if (patternIdx === patElems.length) {
        matches.push([...current]);
        return;
      }
      for (let i = startIdx; i < Math.min(tokens.length, startIdx + maxWindow); i++) {
        const token = tokens[i];
        const pat = patElems[patternIdx];
        const optional = typeof pat === 'object' ? pat.optional : (pattern.optional && pattern.optional[patternIdx]);
        if (matchToken(token, pat)) {
          current.push(token);
          search(i + 1, patternIdx + 1, current);
          current.pop();
        } else if (optional) {
          // 跳过可选词
          search(i, patternIdx + 1, current);
        }
        // 跳过当前 token，继续尝试
      }
    }
    search(0, 0, []);
    return matches;
  }

  /**
   * Check if a collocation pattern matches at the given position
   */
  private matchesCollocation(tokens: TokenData[], startIndex: number, collocation: any): boolean {
    const pattern = collocation.pattern;

    // Check if we have enough tokens
    if (startIndex + pattern.length > tokens.length) {
      return false;
    }

    // Check each pattern element
    for (let i = 0; i < pattern.length; i++) {
      const token = tokens[startIndex + i];
      const patternWord = pattern[i];

      // For reflexive pronouns, always check lemma
      if (patternWord === 'sich') {
        if (token.lemma !== 'sich') {
          return false;
        }
      } else if (this.isVerbOrAux(token)) {
        // For verbs, use lenient lemma matching (handles inflection and small lemma differences)
        if (!this.lemmaMatches(token.lemma, patternWord)) {
          return false;
        }
      } else {
        // For other words, check text (case-insensitive)
        if (token.text.toLowerCase() !== patternWord.toLowerCase()) {
          return false;
        }
      }
    }

    return true;
  }
}