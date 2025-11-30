/**
 * B1 Level Grammar Rules
 * Detects and explains B1-level German grammar patterns
 */

import { Token, ParsedSentence } from '../nlpEngine/types';
import { GrammarPoint, GrammarRule, CEFRLevel, GrammarCategory } from './types';

/**
 * Base Rule Class
 */
export abstract class BaseRule implements GrammarRule {
  abstract name: string;
  abstract category: GrammarCategory;
  abstract level: CEFRLevel;

  protected generateId(): string {
    return `${this.category}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  abstract detect(tokens: Token[], sentence: ParsedSentence, index: number): GrammarPoint | null;
  abstract getExplanation(point: GrammarPoint | null, tokens: Token[]): string;
}

/**
 * B1 Rule: Present Tense Verb
 */
export class PresentTenseRule extends BaseRule {
  name = 'Present Tense';
  category: GrammarCategory = 'tense';
  level: CEFRLevel = 'B1';

  detect(tokens: Token[], sentence: ParsedSentence, index: number): GrammarPoint | null {
    const token = tokens[index];

    if (token.pos !== 'VERB') return null;
    if (!token.morph?.tense || token.morph.tense !== 'present') return null;

    // Exclude modal verbs, auxiliaries in compound forms
    if (['sein', 'haben', 'werden', 'können', 'müssen', 'wollen', 'sollen', 'dürfen', 'mögen'].includes(
      token.lemma.toLowerCase()
    )) {
      return null; // These get their own rules
    }

    return {
      id: this.generateId(),
      category: 'tense',
      level: 'B1',
      text: token.word,
      startPos: token.position.start,
      endPos: token.position.end,
      explanation: this.getExplanation(null, tokens),
      details: {
        tense: 'present',
        person: token.morph.person,
        number: token.morph.number,
      },
      tokenIndices: [index],
    };
  }

  getExplanation(point: GrammarPoint | null, tokens: Token[]): string {
    if (!point) return 'Present tense: Describes ongoing or habitual actions';
    const token = tokens[point.tokenIndices[0]];
    return `Present tense of "${token.lemma}" (${point.details?.person || '?'}) - describes current or habitual action`;
  }
}

/**
 * B1 Rule: Simple Past Tense
 */
export class SimplePastTenseRule extends BaseRule {
  name = 'Simple Past Tense';
  category: GrammarCategory = 'tense';
  level: CEFRLevel = 'B1';

  detect(tokens: Token[], sentence: ParsedSentence, index: number): GrammarPoint | null {
    const token = tokens[index];

    if (token.pos !== 'VERB') return null;
    if (!token.morph?.tense || token.morph.tense !== 'past') return null;

    return {
      id: this.generateId(),
      category: 'tense',
      level: 'B1',
      text: token.word,
      startPos: token.position.start,
      endPos: token.position.end,
      explanation: this.getExplanation(null, tokens),
      details: {
        tense: 'simple_past',
        person: token.morph.person,
      },
      tokenIndices: [index],
    };
  }

  getExplanation(point: GrammarPoint | null, tokens: Token[]): string {
    return 'Simple past tense: Describes completed past actions, common in storytelling and written German';
  }
}

/**
 * B1 Rule: Perfect Tense (sein/haben + Partizip II)
 */
export class PerfectTenseRule extends BaseRule {
  name = 'Perfect Tense';
  category: GrammarCategory = 'tense';
  level: CEFRLevel = 'B1';

  detect(tokens: Token[], sentence: ParsedSentence, index: number): GrammarPoint | null {
    const token = tokens[index];

    // Look for haben/sein + participle pattern
    if (token.pos === 'VERB' && (token.lemma === 'haben' || token.lemma === 'sein')) {
      // Check if next verb is participle
      const nextVerb = tokens.slice(index + 1).find(t => t.pos === 'VERB');
      if (nextVerb && nextVerb.morph?.tense === 'perfect') {
        return {
          id: this.generateId(),
          category: 'tense',
          level: 'B1',
          text: `${token.word}...${nextVerb.word}`,
          startPos: token.position.start,
          endPos: nextVerb.position.end,
          explanation: this.getExplanation(null, tokens),
          details: {
            tense: 'perfect',
          },
          tokenIndices: [index, tokens.indexOf(nextVerb)],
        };
      }
    }

    return null;
  }

  getExplanation(point: GrammarPoint | null, tokens: Token[]): string {
    return 'Perfect tense: haben/sein + past participle - describes completed actions with present relevance';
  }
}

/**
 * B1 Rule: Nominative Case
 */
export class NominativeCaseRule extends BaseRule {
  name = 'Nominative Case (Subject)';
  category: GrammarCategory = 'case';
  level: CEFRLevel = 'B1';

  detect(tokens: Token[], sentence: ParsedSentence, index: number): GrammarPoint | null {
    const token = tokens[index];

    if (!token.morph?.case || token.morph.case !== 'nominative') return null;

    // Skip if it's in a subordinate clause (unless it's the subject of that clause)
    if (token.pos === 'NOUN' || token.pos === 'ART' || token.pos === 'PRON') {
      return {
        id: this.generateId(),
        category: 'case',
        level: 'B1',
        text: token.word,
        startPos: token.position.start,
        endPos: token.position.end,
        explanation: this.getExplanation(null, tokens),
        details: {
          case: 'nominative',
          number: token.morph.number,
          gender: token.morph.gender,
        },
        tokenIndices: [index],
      };
    }

    return null;
  }

  getExplanation(point: GrammarPoint | null, tokens: Token[]): string {
    return 'Nominative case: Subject of the sentence - the person or thing performing the action';
  }
}

/**
 * B1 Rule: Accusative Case
 */
export class AccusativeCaseRule extends BaseRule {
  name = 'Accusative Case (Direct Object)';
  category: GrammarCategory = 'case';
  level: CEFRLevel = 'B1';

  detect(tokens: Token[], sentence: ParsedSentence, index: number): GrammarPoint | null {
    const token = tokens[index];

    if (!token.morph?.case || token.morph.case !== 'accusative') return null;

    if (token.pos === 'NOUN' || token.pos === 'ART' || token.pos === 'PRON') {
      return {
        id: this.generateId(),
        category: 'case',
        level: 'B1',
        text: token.word,
        startPos: token.position.start,
        endPos: token.position.end,
        explanation: this.getExplanation(null, tokens),
        details: {
          case: 'accusative',
          number: token.morph.number,
          gender: token.morph.gender,
        },
        tokenIndices: [index],
      };
    }

    return null;
  }

  getExplanation(point: GrammarPoint | null, tokens: Token[]): string {
    return 'Accusative case: Direct object - the person or thing receiving the action';
  }
}

/**
 * B1 Rule: Dative Case
 */
export class DativeCaseRule extends BaseRule {
  name = 'Dative Case (Indirect Object)';
  category: GrammarCategory = 'case';
  level: CEFRLevel = 'B1';

  detect(tokens: Token[], sentence: ParsedSentence, index: number): GrammarPoint | null {
    const token = tokens[index];

    if (!token.morph?.case || token.morph.case !== 'dative') return null;

    if (token.pos === 'NOUN' || token.pos === 'ART' || token.pos === 'PRON') {
      return {
        id: this.generateId(),
        category: 'case',
        level: 'B1',
        text: token.word,
        startPos: token.position.start,
        endPos: token.position.end,
        explanation: this.getExplanation(null, tokens),
        details: {
          case: 'dative',
          number: token.morph.number,
          gender: token.morph.gender,
        },
        tokenIndices: [index],
      };
    }

    return null;
  }

  getExplanation(point: GrammarPoint | null, tokens: Token[]): string {
    return 'Dative case: Indirect object - the person/thing for whom or with whom the action is performed';
  }
}

/**
 * B1 Rule: Basic Prepositions with Cases
 */
export class PrepositionWithCaseRule extends BaseRule {
  name = 'Preposition with Case';
  category: GrammarCategory = 'preposition';
  level: CEFRLevel = 'B1';

  // Prepositions and their required cases
  private readonly prepositions: Record<string, string[]> = {
    // Accusative only
    'für': ['accusative'],
    'durch': ['accusative'],
    'ohne': ['accusative'],
    'um': ['accusative'],
    'gegen': ['accusative'],
    // Dative only
    'bei': ['dative'],
    'mit': ['dative'],
    'von': ['dative'],
    'zu': ['dative'],
    'seit': ['dative'],
    'nach': ['dative'],
    'aus': ['dative'],
    'außer': ['dative'],
    // Two-way (Wechselpräpositionen)
    'in': ['accusative', 'dative'],
    'an': ['accusative', 'dative'],
    'auf': ['accusative', 'dative'],
    'über': ['accusative', 'dative'],
    'unter': ['accusative', 'dative'],
    'vor': ['accusative', 'dative'],
    'hinter': ['accusative', 'dative'],
    'zwischen': ['accusative', 'dative'],
    'neben': ['accusative', 'dative'],
  };

  detect(tokens: Token[], sentence: ParsedSentence, index: number): GrammarPoint | null {
    const token = tokens[index];

    if (token.pos !== 'ADP') return null;
    const prep = token.word.toLowerCase();

    if (!this.prepositions[prep]) return null;

    // Find the following noun/article to check its case
    const nextNoun = tokens.slice(index + 1).find(t => t.pos === 'NOUN' || t.pos === 'ART');
    if (!nextNoun || !nextNoun.morph?.case) return null;

    const requiredCases = this.prepositions[prep];
    if (!requiredCases.includes(nextNoun.morph.case)) {
      return null; // Grammar error - but we'll detect that separately
    }

    return {
      id: this.generateId(),
      category: 'preposition',
      level: 'B1',
      text: `${token.word} ${nextNoun.word}`,
      startPos: token.position.start,
      endPos: nextNoun.position.end,
      explanation: this.getExplanation(null, tokens),
      details: {
        case: nextNoun.morph.case,
      },
      tokenIndices: [index, tokens.indexOf(nextNoun)],
    };
  }

  getExplanation(point: GrammarPoint | null, tokens: Token[]): string {
    const caseStr = point?.details?.case || 'unknown';
    return `Preposition with ${caseStr} case: Prepositions determine the case of following nouns`;
  }
}

/**
 * B1 Rule: Subordinating Conjunctions (weil, dass, wenn, etc.)
 */
export class SubordinatingConjunctionRule extends BaseRule {
  name = 'Subordinating Conjunction';
  category: GrammarCategory = 'conjunction';
  level: CEFRLevel = 'B1';

  private readonly conjunctions = [
    'weil', 'dass', 'wenn', 'ob', 'während', 'bevor', 'nachdem',
    'obwohl', 'obgleich', 'indem', 'sodass', 'so dass', 'damit'
  ];

  detect(tokens: Token[], sentence: ParsedSentence, index: number): GrammarPoint | null {
    const token = tokens[index];

    if (token.pos !== 'CCONJ' && token.pos !== 'SCONJ') return null;

    const conj = token.word.toLowerCase();
    if (!this.conjunctions.includes(conj)) return null;

    return {
      id: this.generateId(),
      category: 'conjunction',
      level: 'B1',
      text: token.word,
      startPos: token.position.start,
      endPos: token.position.end,
      explanation: this.getExplanation(null, tokens),
      tokenIndices: [index],
    };
  }

  getExplanation(point: GrammarPoint | null, tokens: Token[]): string {
    if (!point) return 'Subordinating conjunction: Introduces subordinate clauses with verb-final word order';
    const token = tokens[point.tokenIndices[0]];
    const explanations: Record<string, string> = {
      'weil': 'Introduces reason clause - "because"',
      'dass': 'Introduces noun/content clause - "that"',
      'wenn': 'Introduces conditional clause - "if/when"',
      'ob': 'Introduces yes/no question clause - "whether"',
      'während': 'Introduces temporal clause - "while/whereas"',
      'bevor': 'Introduces temporal clause - "before"',
      'nachdem': 'Introduces temporal clause - "after"',
      'obwohl': 'Introduces concessive clause - "although"',
    };
    return explanations[token.word.toLowerCase()] || 'Subordinating conjunction';
  }
}

/**
 * B1 Rule: Modal Verbs (können, müssen, wollen, sollen, dürfen, mögen)
 */
export class ModalVerbRule extends BaseRule {
  name = 'Modal Verb';
  category: GrammarCategory = 'modal_verb';
  level: CEFRLevel = 'B1';

  private readonly modalVerbs = ['können', 'müssen', 'wollen', 'sollen', 'dürfen', 'mögen', 'möchten'];

  detect(tokens: Token[], sentence: ParsedSentence, index: number): GrammarPoint | null {
    const token = tokens[index];

    if (token.pos !== 'VERB') return null;
    if (!this.modalVerbs.includes(token.lemma.toLowerCase())) return null;

    // Find the infinitive that follows (no tense = infinitive)
    const infinitive = tokens.slice(index + 1).find(t => 
      t.pos === 'VERB' && 
      (!t.morph?.tense || t.morph.tense === 'n/a' || !['present', 'past', 'perfect', 'pluperfect', 'future'].includes(t.morph?.tense || ''))
    );

    return {
      id: this.generateId(),
      category: 'modal_verb',
      level: 'B1',
      text: infinitive ? `${token.word}...${infinitive.word}` : token.word,
      startPos: token.position.start,
      endPos: infinitive ? infinitive.position.end : token.position.end,
      explanation: this.getExplanation(null, tokens),
      details: {
        mood: 'indicative',
      },
      tokenIndices: infinitive ? [index, tokens.indexOf(infinitive)] : [index],
    };
  }

  getExplanation(point: GrammarPoint | null, tokens: Token[]): string {
    if (!point) return 'Modal verb: Expresses ability, necessity, permission, or desire';
    const token = tokens[point.tokenIndices[0]];
    const explanations: Record<string, string> = {
      'können': 'Can/be able to - expresses ability or permission',
      'müssen': 'Must/have to - expresses necessity',
      'wollen': 'Want to - expresses desire or intention',
      'sollen': 'Should/is supposed to - expresses obligation or advice',
      'dürfen': 'May/be allowed to - expresses permission',
      'mögen': 'Like to/may - expresses preference or possibility',
      'möchten': 'Would like to - expresses polite desire',
    };
    return explanations[token.lemma.toLowerCase()] || 'Modal verb';
  }
}
