/**
 * Additional B1 Grammar Rules
 * Covers separable verbs, adjectives, word order, and agreement
 */

import { Token, ParsedSentence } from '../nlpEngine/types';
import { GrammarPoint, CEFRLevel, GrammarCategory } from './types';
import { BaseRule } from './rules';

/**
 * B1 Rule: Separable Verbs (anrufen, aufmachen, einsteigen, etc.)
 */
export class SeparableVerbRule extends BaseRule {
  name = 'Separable Verb';
  category: GrammarCategory = 'separable_verb';
  level: CEFRLevel = 'B1';

  // Common separable verb prefixes
  private readonly separablePrefixes = [
    'an', 'auf', 'aus', 'bei', 'ein', 'mit', 'zu', 'zurück',
    'über', 'um', 'unter', 'vor', 'weg', 'weiter', 'wider', 'zer'
  ];

  detect(tokens: Token[], sentence: ParsedSentence, index: number): GrammarPoint | null {
    const token = tokens[index];

    if (token.pos !== 'VERB') return null;

    // Check if verb has separable prefix
    const word = token.word.toLowerCase();
    for (const prefix of this.separablePrefixes) {
      if (word.startsWith(prefix)) {
        // Common separable verbs
        const stem = word.substring(prefix.length);
        if (['rufen', 'machen', 'steigen', 'fangen', 'nehmen', 'schauen', 'gehen', 'stehen'].includes(stem)) {
          // Look for separated particle later in sentence
          const particle = tokens.slice(index + 1).find(t => 
            t.word.toLowerCase() === prefix && t.pos !== 'VERB'
          );

          return {
            id: this.generateId(),
            category: 'separable_verb',
            level: 'B1',
            text: particle ? `${word}...${particle.word}` : word,
            startPos: token.position.start,
            endPos: particle ? particle.position.end : token.position.end,
            explanation: this.getExplanation(null, tokens),
            tokenIndices: particle ? [index, tokens.indexOf(particle)] : [index],
          };
        }
      }
    }

    return null;
  }

  getExplanation(point: GrammarPoint | null, tokens: Token[]): string {
    return 'Separable verb: Verb prefix separates from stem in main clauses (e.g., "Ich rufe dich an" = "I call you up")';
  }
}

/**
 * B1 Rule: Adjective Endings (Attributive adjectives with case/gender/number agreement)
 */
export class AdjectiveEndingRule extends BaseRule {
  name = 'Adjective Ending';
  category: GrammarCategory = 'adjective';
  level: CEFRLevel = 'B1';

  detect(tokens: Token[], sentence: ParsedSentence, index: number): GrammarPoint | null {
    const token = tokens[index];

    if (token.pos !== 'ADJ') return null;

    // Look for article + adjective + noun pattern to validate agreement
    const prevArticle = index > 0 ? tokens[index - 1] : null;
    const nextNoun = tokens.slice(index + 1).find(t => t.pos === 'NOUN');

    if (!prevArticle || !nextNoun) return null;
    if (prevArticle.pos !== 'ART') return null;

    // Check if adjective agrees with article and noun
    const adjCase = token.morph?.case;
    const adjGender = token.morph?.gender;
    const adjNumber = token.morph?.number;

    const nounGender = nextNoun.morph?.gender;
    const nounNumber = nextNoun.morph?.number;

    // Basic agreement check
    if (adjGender === nounGender && adjNumber === nounNumber) {
      return {
        id: this.generateId(),
        category: 'adjective',
        level: 'B1',
        text: token.word,
        startPos: token.position.start,
        endPos: token.position.end,
        explanation: this.getExplanation(null, tokens),
        details: {
          case: adjCase,
          gender: adjGender,
          number: adjNumber,
        },
        tokenIndices: [index],
      };
    }

    return null;
  }

  getExplanation(point: GrammarPoint | null, tokens: Token[]): string {
    return 'Adjective agreement: Attributive adjectives must agree in case, gender, and number with the noun they modify';
  }
}

/**
 * B1 Rule: Word Order - Subordinate Clause (Verb-final position)
 */
export class SubordinateClauseWordOrderRule extends BaseRule {
  name = 'Subordinate Clause Word Order';
  category: GrammarCategory = 'word_order';
  level: CEFRLevel = 'B1';

  private readonly subordinatingConjunctions = [
    'weil', 'dass', 'wenn', 'ob', 'während', 'bevor', 'nachdem',
    'obwohl', 'obgleich', 'indem', 'sodass', 'damit'
  ];

  detect(tokens: Token[], sentence: ParsedSentence, index: number): GrammarPoint | null {
    const token = tokens[index];

    if (token.pos !== 'SCONJ' && token.pos !== 'CCONJ') return null;

    const conj = token.word.toLowerCase();
    if (!this.subordinatingConjunctions.includes(conj)) return null;

    // Find the verb in this subordinate clause (should be at end)
    const clauseVerbs = tokens.slice(index + 1).filter(t => t.pos === 'VERB');
    if (clauseVerbs.length === 0) return null;

    const lastVerb = clauseVerbs[clauseVerbs.length - 1];

    return {
      id: this.generateId(),
      category: 'word_order',
      level: 'B1',
      text: `${token.word}...${lastVerb.word}`,
      startPos: token.position.start,
      endPos: lastVerb.position.end,
      explanation: this.getExplanation(null, tokens),
      tokenIndices: [index, tokens.indexOf(lastVerb)],
    };
  }

  getExplanation(point: GrammarPoint | null, tokens: Token[]): string {
    return 'Subordinate clause word order: Conjugated verb moves to final position in subordinate clauses (e.g., "weil ich Deutsch spreche")';
  }
}

/**
 * B1 Rule: Article (Definite/Indefinite articles with correct case/gender/number)
 */
export class ArticleAgreementRule extends BaseRule {
  name = 'Article Agreement';
  category: GrammarCategory = 'article';
  level: CEFRLevel = 'B1';

  private readonly articles = ['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einem', 'einen', 'eines', 'einer'];

  detect(tokens: Token[], sentence: ParsedSentence, index: number): GrammarPoint | null {
    const token = tokens[index];

    if (token.pos !== 'ART') return null;

    const article = token.word.toLowerCase();
    if (!this.articles.includes(article)) return null;

    // Look for following noun
    const nextNoun = tokens.slice(index + 1).find(t => t.pos === 'NOUN');
    if (!nextNoun) return null;

    // Check article-noun agreement
    const artCase = token.morph?.case;
    const artGender = token.morph?.gender;
    const artNumber = token.morph?.number;

    const nounGender = nextNoun.morph?.gender;
    const nounNumber = nextNoun.morph?.number;

    if (artGender === nounGender && artNumber === nounNumber) {
      return {
        id: this.generateId(),
        category: 'article',
        level: 'B1',
        text: `${token.word} ${nextNoun.word}`,
        startPos: token.position.start,
        endPos: nextNoun.position.end,
        explanation: this.getExplanation(null, tokens),
        details: {
          case: artCase,
          gender: artGender,
          number: artNumber,
        },
        tokenIndices: [index, tokens.indexOf(nextNoun)],
      };
    }

    return null;
  }

  getExplanation(point: GrammarPoint | null, tokens: Token[]): string {
    const caseStr = point?.details?.case || 'unknown';
    const genderStr = point?.details?.gender || '?';
    return `Article agreement: Article agrees with noun in case (${caseStr}), gender (${genderStr}), and number`;
  }
}

/**
 * B1 Rule: Personal Pronouns (Correct case usage: ich, mich, mir, etc.)
 */
export class PersonalPronounRule extends BaseRule {
  name = 'Personal Pronoun';
  category: GrammarCategory = 'pronoun';
  level: CEFRLevel = 'B1';

  private readonly pronouns: Record<string, { case: string; person: string }> = {
    'ich': { case: 'nominative', person: '1st singular' },
    'mich': { case: 'accusative', person: '1st singular' },
    'mir': { case: 'dative', person: '1st singular' },
    'du': { case: 'nominative', person: '2nd singular' },
    'dich': { case: 'accusative', person: '2nd singular' },
    'dir': { case: 'dative', person: '2nd singular' },
    'er': { case: 'nominative', person: '3rd singular male' },
    'ihn': { case: 'accusative', person: '3rd singular male' },
    'ihm': { case: 'dative', person: '3rd singular male' },
    'sie_singular': { case: 'nominative', person: '3rd singular female' },
    'es': { case: 'nominative', person: '3rd singular neuter' },
    'wir': { case: 'nominative', person: '1st plural' },
    'uns': { case: 'accusative/dative', person: '1st plural' },
    'ihr': { case: 'nominative', person: '2nd plural' },
    'euch': { case: 'accusative/dative', person: '2nd plural' },
    'sie_plural': { case: 'nominative', person: '3rd plural' },
  };

  detect(tokens: Token[], sentence: ParsedSentence, index: number): GrammarPoint | null {
    const token = tokens[index];

    if (token.pos !== 'PRON') return null;

    const pronoun = token.word.toLowerCase();
    const info = this.pronouns[pronoun];

    if (!info) return null;

    return {
      id: this.generateId(),
      category: 'pronoun',
      level: 'B1',
      text: token.word,
      startPos: token.position.start,
      endPos: token.position.end,
      explanation: this.getExplanation(null, tokens),
      details: {
        case: info.case,
        person: info.person,
      },
      tokenIndices: [index],
    };
  }

  getExplanation(point: GrammarPoint | null, tokens: Token[]): string {
    if (!point) return 'Personal pronoun: Pronouns change form based on case and person';
    return `Personal pronoun: ${point.details?.person || '?'} in ${point.details?.case || 'unknown'} case`;
  }
}

/**
 * B1 Rule: Noun Gender and Articles
 */
export class NounGenderRule extends BaseRule {
  name = 'Noun Gender';
  category: GrammarCategory = 'noun';
  level: CEFRLevel = 'B1';

  detect(tokens: Token[], sentence: ParsedSentence, index: number): GrammarPoint | null {
    const token = tokens[index];

    if (token.pos !== 'NOUN') return null;

    const gender = token.morph?.gender;
    if (!gender || gender === 'n/a') return null;

    // Check if preceded by article
    const prevToken = index > 0 ? tokens[index - 1] : null;
    const hasArticle = prevToken && prevToken.pos === 'ART';

    return {
      id: this.generateId(),
      category: 'noun',
      level: 'B1',
      text: token.word,
      startPos: token.position.start,
      endPos: token.position.end,
      explanation: this.getExplanation(null, tokens),
      details: {
        gender,
        number: token.morph?.number,
      },
      tokenIndices: [index],
    };
  }

  getExplanation(point: GrammarPoint | null, tokens: Token[]): string {
    const gender = point?.details?.gender || '?';
    const article = gender === 'masculine' ? 'der' : gender === 'feminine' ? 'die' : 'das';
    return `Noun gender: German nouns have gender (${gender}). Article: ${article}`;
  }
}

/**
 * B1 Rule: Question Word Formation
 */
export class QuestionWordRule extends BaseRule {
  name = 'Question Word';
  category: GrammarCategory = 'special_construction';
  level: CEFRLevel = 'B1';

  private readonly questionWords = ['was', 'wer', 'wen', 'wem', 'wessen', 'wo', 'wohin', 'woher', 'wann', 'warum', 'wie', 'welch'];

  detect(tokens: Token[], sentence: ParsedSentence, index: number): GrammarPoint | null {
    const token = tokens[index];

    if (token.pos !== 'PRON' && token.pos !== 'DET' && token.pos !== 'ADV') return null;

    const word = token.word.toLowerCase();
    if (!this.questionWords.some(qw => word.startsWith(qw))) return null;

    return {
      id: this.generateId(),
      category: 'special_construction',
      level: 'B1',
      text: token.word,
      startPos: token.position.start,
      endPos: token.position.end,
      explanation: this.getExplanation(null, tokens),
      tokenIndices: [index],
    };
  }

  getExplanation(point: GrammarPoint | null, tokens: Token[]): string {
    if (!point) return 'Question word: Introduces question and determines case';
    const word = tokens[point.tokenIndices[0]].word.toLowerCase();
    const explanations: Record<string, string> = {
      'was': 'What - nominative/accusative (neuter)',
      'wer': 'Who - nominative',
      'wen': 'Whom - accusative',
      'wem': 'To whom - dative',
      'wessen': 'Whose - genitive',
      'wo': 'Where - location',
      'wohin': 'Where to - direction',
      'woher': 'From where - origin',
      'wann': 'When - time',
      'warum': 'Why - reason',
      'wie': 'How - manner',
      'welch': 'Which/what - specific choice',
    };
    return explanations[word] || 'Question word';
  }
}
