/**
 * Mock Data Helpers for Unit Tests
 * 
 * Provides utilities to generate mock SentenceData without requiring spaCy service.
 * All generated data follows the spaCy token format for accurate testing.
 */

import { SentenceData, TokenData } from '../../src/services/grammarEngine/detectors/baseDetector';

/**
 * Options for creating mock tokens
 */
export interface MockTokenOptions {
  lemma?: string;
  tag?: string;
  dep?: string;
  morph?: Record<string, string>;
  characterStart?: number;
  characterEnd?: number;
}

/**
 * Options for creating German-specific tokens
 */
export interface GermanTokenOptions {
  case?: 'Nom' | 'Acc' | 'Dat' | 'Gen';
  gender?: 'Masc' | 'Fem' | 'Neut';
  number?: 'Sing' | 'Plur';
  tense?: 'Pres' | 'Past';
  mood?: 'Ind' | 'Subj' | 'Cond';
  person?: '1' | '2' | '3';
  verbForm?: 'Fin' | 'Inf' | 'Part';
}

/**
 * Create a single mock token with spaCy format
 * 
 * @param text - The token text
 * @param pos - Part of speech (e.g., 'VERB', 'NOUN', 'DET')
 * @param options - Additional token properties
 * @returns A TokenData object
 * 
 * @example
 * const token = createMockToken('laufe', 'VERB', {
 *   lemma: 'laufen',
 *   dep: 'ROOT',
 *   morph: { Tense: 'Pres', VerbForm: 'Fin' }
 * });
 */
export function createMockToken(
  text: string,
  pos: string,
  options: MockTokenOptions = {}
): TokenData {
  const {
    lemma = text.toLowerCase(),
    tag = pos,
    dep = 'ROOT',
    morph = {},
    characterStart = 0,
    characterEnd = text.length,
  } = options;

  return {
    text,
    lemma,
    pos,
    tag,
    dep,
    morph,
    index: 0,
    characterStart,
    characterEnd,
  };
}

/**
 * Create a German noun token with proper case/gender/number
 * 
 * @param word - The German noun
 * @param options - German-specific morphological features
 * @returns A TokenData object for a noun
 * 
 * @example
 * const token = createGermanToken('Katze', 'NOUN', {
 *   gender: 'Fem',
 *   case: 'Nom',
 *   number: 'Sing'
 * });
 */
export function createGermanNoun(
  word: string,
  options: GermanTokenOptions = {}
): TokenData {
  const {
    case: grammarCase = 'Nom',
    gender = 'Fem',
    number = 'Sing',
  } = options;

  const morph: Record<string, string> = {
    Case: grammarCase,
    Gender: gender,
    Number: number,
  };

  return createMockToken(word, 'NOUN', {
    lemma: word.toLowerCase(),
    tag: 'NN',
    dep: 'nsubj',
    morph,
  });
}

/**
 * Create a German verb token with proper tense/mood/form
 * 
 * @param word - The German verb
 * @param lemma - The base form of the verb
 * @param options - German-specific morphological features
 * @returns A TokenData object for a verb
 * 
 * @example
 * const token = createGermanVerb('laufe', 'laufen', {
 *   tense: 'Pres',
 *   person: '1',
 *   number: 'Sing'
 * });
 */
export function createGermanVerb(
  word: string,
  lemma: string = word,
  options: GermanTokenOptions = {}
): TokenData {
  const {
    tense = 'Pres',
    mood = 'Ind',
    person = '1',
    number = 'Sing',
    verbForm = 'Fin',
  } = options;

  const morph: Record<string, string> = {
    Tense: tense,
    Mood: mood,
    Person: person,
    Number: number,
    VerbForm: verbForm,
  };

  return createMockToken(word, 'VERB', {
    lemma,
    tag: 'VB',
    dep: 'ROOT',
    morph,
  });
}

/**
 * Create a German adjective token with proper case/gender/number
 * 
 * @param word - The German adjective
 * @param options - German-specific morphological features
 * @returns A TokenData object for an adjective
 * 
 * @example
 * const token = createGermanAdjective('große', {
 *   gender: 'Fem',
 *   case: 'Nom',
 *   number: 'Sing'
 * });
 */
export function createGermanAdjective(
  word: string,
  options: GermanTokenOptions = {}
): TokenData {
  const {
    case: grammarCase = 'Nom',
    gender = 'Fem',
    number = 'Sing',
  } = options;

  const morph: Record<string, string> = {
    Case: grammarCase,
    Gender: gender,
    Number: number,
  };

  return createMockToken(word, 'ADJ', {
    lemma: word.toLowerCase(),
    tag: 'ADJ',
    dep: 'amod',
    morph,
  });
}

/**
 * Create a German determiner/article token
 * 
 * @param word - The article (der, die, das, den, dem, etc.)
 * @param options - German-specific morphological features
 * @returns A TokenData object for a determiner
 * 
 * @example
 * const token = createGermanDeterminer('die', {
 *   gender: 'Fem',
 *   case: 'Nom',
 *   number: 'Sing'
 * });
 */
export function createGermanDeterminer(
  word: string,
  options: GermanTokenOptions = {}
): TokenData {
  const {
    case: grammarCase = 'Nom',
    gender = 'Fem',
    number = 'Sing',
  } = options;

  const morph: Record<string, string> = {
    Case: grammarCase,
    Gender: gender,
    Number: number,
    PronType: 'Art',
  };

  return createMockToken(word, 'DET', {
    lemma: word.toLowerCase(),
    tag: 'ART',
    dep: 'det',
    morph,
  });
}

/**
 * Create a German pronoun token
 * 
 * @param word - The pronoun (ich, mich, mir, du, dich, dir, etc.)
 * @param options - German-specific morphological features
 * @returns A TokenData object for a pronoun
 * 
 * @example
 * const token = createGermanPronoun('mir', {
 *   person: '1',
 *   case: 'Dat',
 *   number: 'Sing'
 * });
 */
export function createGermanPronoun(
  word: string,
  options: GermanTokenOptions = {}
): TokenData {
  const {
    person = '1',
    case: grammarCase = 'Nom',
    number = 'Sing',
  } = options;

  const morph: Record<string, string> = {
    PronType: 'Prs',
    Person: person,
    Case: grammarCase,
    Number: number,
  };

  return createMockToken(word, 'PRON', {
    lemma: word.toLowerCase(),
    tag: 'PPER',
    dep: 'nsubj',
    morph,
  });
}

/**
 * Create a German auxiliary verb token (sein, haben, werden)
 * 
 * @param word - The auxiliary verb (bin, habe, werde, etc.)
 * @param lemma - The base form (sein, haben, werden)
 * @param options - German-specific morphological features
 * @returns A TokenData object for an auxiliary verb
 * 
 * @example
 * const token = createGermanAuxiliary('bin', 'sein', {
 *   tense: 'Pres',
 *   person: '1',
 *   number: 'Sing'
 * });
 */
export function createGermanAuxiliary(
  word: string,
  lemma: string = 'sein',
  options: GermanTokenOptions = {}
): TokenData {
  const {
    tense = 'Pres',
    mood = 'Ind',
    person = '1',
    number = 'Sing',
    verbForm = 'Fin',
  } = options;

  const morph: Record<string, string> = {
    Tense: tense,
    Mood: mood,
    Person: person,
    Number: number,
    VerbForm: verbForm,
  };

  return createMockToken(word, 'AUX', {
    lemma,
    tag: 'VAL',
    dep: 'aux',
    morph,
  });
}

/**
 * Create a German past participle token
 * 
 * @param word - The past participle
 * @param lemma - The base form
 * @returns A TokenData object for a past participle
 * 
 * @example
 * const token = createGermanParticiple('gelaufen', 'laufen');
 */
export function createGermanParticiple(
  word: string,
  lemma: string = word
): TokenData {
  const morph: Record<string, string> = {
    VerbForm: 'Part',
    Tense: 'Past',
  };

  return createMockToken(word, 'VERB', {
    lemma,
    tag: 'VBP',
    dep: 'acl',
    morph,
  });
}

/**
 * Create a German preposition token
 * 
 * @param word - The preposition (in, an, auf, etc.)
 * @param caseGoverns - Which case it governs ('Dat', 'Acc', or 'Both')
 * @returns A TokenData object for a preposition
 * 
 * @example
 * const token = createGermanPreposition('in', 'Both');
 */
export function createGermanPreposition(
  word: string,
  caseGoverns: string = 'Acc'
): TokenData {
  const morph: Record<string, string> = {
    AdpType: 'Prep',
    CaseGoverns: caseGoverns,
  };

  return createMockToken(word, 'ADP', {
    lemma: word.toLowerCase(),
    tag: 'PREP',
    dep: 'case',
    morph,
  });
}

/**
 * Create a complete SentenceData object from an array of tokens
 * 
 * @param text - The full sentence text
 * @param tokens - An array of TokenData objects
 * @returns A complete SentenceData object with positions calculated
 * 
 * @example
 * const tokens = [
 *   createGermanNoun('Ich'),
 *   createGermanVerb('laufe', 'laufen')
 * ];
 * const sentence = createMockSentenceData('Ich laufe.', tokens);
 */
export function createMockSentenceData(
  text: string,
  tokens: TokenData[]
): SentenceData {
  // Recalculate indices and character positions
  let currentCharPos = 0;
  const updatedTokens = tokens.map((token, index) => {
    const characterStart = text.indexOf(token.text, currentCharPos);
    const characterEnd = characterStart + token.text.length;
    currentCharPos = characterEnd;

    return {
      ...token,
      index,
      characterStart,
      characterEnd,
    };
  });

  return {
    text,
    tokens: updatedTokens,
  };
}

/**
 * Helper to quickly create a simple sentence from token specifications
 * 
 * @param text - The sentence text
 * @param tokenSpecs - Array of token specifications
 * @returns A complete SentenceData object
 * 
 * @example
 * const sentence = createSimpleSentence(
 *   'Die Katze schläft.',
 *   [
 *     { text: 'Die', pos: 'DET', lemma: 'die' },
 *     { text: 'Katze', pos: 'NOUN', lemma: 'Katze' },
 *     { text: 'schläft', pos: 'VERB', lemma: 'schlafen' },
 *   ]
 * );
 */
export function createSimpleSentence(
  text: string,
  tokenSpecs: Array<{
    text: string;
    pos: string;
    lemma?: string;
    dep?: string;
    morph?: Record<string, string>;
  }>
): SentenceData {
  const tokens = tokenSpecs.map((spec) =>
    createMockToken(spec.text, spec.pos, {
      lemma: spec.lemma,
      dep: spec.dep,
      morph: spec.morph,
    })
  );

  return createMockSentenceData(text, tokens);
}

/**
 * Common test sentence builders for frequently used patterns
 */

/**
 * Create "Ich bin ein Student" structure
 */
export function createNominativeSubjectSentence(): SentenceData {
  const tokens = [
    createGermanPronoun('Ich', { person: '1', case: 'Nom', number: 'Sing' }),
    createGermanAuxiliary('bin', 'sein', { person: '1', tense: 'Pres' }),
    createGermanDeterminer('ein', { case: 'Nom', gender: 'Masc', number: 'Sing' }),
    createGermanNoun('Student', { case: 'Nom', gender: 'Masc', number: 'Sing' }),
  ];

  // Set proper deps
  tokens[0].dep = 'nsubj';
  tokens[1].dep = 'ROOT';
  tokens[2].dep = 'det';
  tokens[3].dep = 'nsubj';

  return createMockSentenceData('Ich bin ein Student.', tokens);
}

/**
 * Create "Ich sehe den Mann" structure (accusative object)
 */
export function createAccusativeObjectSentence(): SentenceData {
  const tokens = [
    createGermanPronoun('Ich', { person: '1', case: 'Nom', number: 'Sing' }),
    createGermanVerb('sehe', 'sehen', { person: '1', tense: 'Pres' }),
    createGermanDeterminer('den', { case: 'Acc', gender: 'Masc', number: 'Sing' }),
    createGermanNoun('Mann', { case: 'Acc', gender: 'Masc', number: 'Sing' }),
  ];

  tokens[0].dep = 'nsubj';
  tokens[1].dep = 'ROOT';
  tokens[2].dep = 'det';
  tokens[3].dep = 'obj';

  return createMockSentenceData('Ich sehe den Mann.', tokens);
}

/**
 * Create "Ich gebe dem Kind ein Buch" structure (dative indirect object)
 */
export function createDativeIndirectObjectSentence(): SentenceData {
  const tokens = [
    createGermanPronoun('Ich', { person: '1', case: 'Nom', number: 'Sing' }),
    createGermanVerb('gebe', 'geben', { person: '1', tense: 'Pres' }),
    createGermanDeterminer('dem', { case: 'Dat', gender: 'Neut', number: 'Sing' }),
    createGermanNoun('Kind', { case: 'Dat', gender: 'Neut', number: 'Sing' }),
    createGermanDeterminer('ein', { case: 'Acc', gender: 'Neut', number: 'Sing' }),
    createGermanNoun('Buch', { case: 'Acc', gender: 'Neut', number: 'Sing' }),
  ];

  tokens[0].dep = 'nsubj';
  tokens[1].dep = 'ROOT';
  tokens[2].dep = 'det';
  tokens[3].dep = 'iobj';
  tokens[4].dep = 'det';
  tokens[5].dep = 'obj';

  return createMockSentenceData('Ich gebe dem Kind ein Buch.', tokens);
}

/**
 * Create "Ich bin gelaufen" structure (present perfect)
 */
export function createPresentPerfectSentence(): SentenceData {
  const tokens = [
    createGermanPronoun('Ich', { person: '1', case: 'Nom', number: 'Sing' }),
    createGermanAuxiliary('bin', 'sein', { person: '1', tense: 'Pres' }),
    createGermanParticiple('gelaufen', 'laufen'),
  ];

  tokens[0].dep = 'nsubj';
  tokens[1].dep = 'ROOT';
  tokens[2].dep = 'acl';

  return createMockSentenceData('Ich bin gelaufen.', tokens);
}

/**
 * Create "Ich laufe" structure (simple present tense)
 */
export function createSimplePresentSentence(): SentenceData {
  const tokens = [
    createGermanPronoun('Ich', { person: '1', case: 'Nom', number: 'Sing' }),
    createGermanVerb('laufe', 'laufen', { person: '1', tense: 'Pres' }),
  ];

  tokens[0].dep = 'nsubj';
  tokens[1].dep = 'ROOT';

  return createMockSentenceData('Ich laufe.', tokens);
}

/**
 * Create "Ich lief" structure (simple past tense)
 */
export function createSimplePastSentence(): SentenceData {
  const tokens = [
    createGermanPronoun('Ich', { person: '1', case: 'Nom', number: 'Sing' }),
    createGermanVerb('lief', 'laufen', { person: '1', tense: 'Past' }),
  ];

  tokens[0].dep = 'nsubj';
  tokens[1].dep = 'ROOT';

  return createMockSentenceData('Ich lief.', tokens);
}

/**
 * Create "Die Katze wird gefangen" structure (passive voice)
 */
export function createPassiveVoiceSentence(): SentenceData {
  const tokens = [
    createGermanDeterminer('Die', { case: 'Nom', gender: 'Fem', number: 'Sing' }),
    createGermanNoun('Katze', { case: 'Nom', gender: 'Fem', number: 'Sing' }),
    createGermanAuxiliary('wird', 'werden', { person: '3', tense: 'Pres' }),
    createGermanParticiple('gefangen', 'fangen'),
  ];

  tokens[0].dep = 'det';
  tokens[1].dep = 'nsubj';
  tokens[2].dep = 'aux';
  tokens[3].dep = 'acl';

  return createMockSentenceData('Die Katze wird gefangen.', tokens);
}

/**
 * Create "Ich interessiere mich für Musik" structure (reflexive)
 */
export function createReflexiveSentence(): SentenceData {
  const tokens = [
    createGermanPronoun('Ich', { person: '1', case: 'Nom', number: 'Sing' }),
    createGermanVerb('interessiere', 'interessieren', { person: '1', tense: 'Pres' }),
    createGermanPronoun('mich', { person: '1', case: 'Acc', number: 'Sing' }),
    createGermanPreposition('für', 'Acc'),
    createGermanNoun('Musik', { case: 'Acc', gender: 'Fem', number: 'Sing' }),
  ];

  tokens[0].dep = 'nsubj';
  tokens[1].dep = 'ROOT';
  tokens[2].dep = 'obj';
  tokens[3].dep = 'case';
  tokens[4].dep = 'obl';

  return createMockSentenceData('Ich interessiere mich für Musik.', tokens);
}
