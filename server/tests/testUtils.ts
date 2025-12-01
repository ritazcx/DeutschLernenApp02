/**
 * Test Utilities and Helpers
 */

import { SentenceData, TokenData } from '../src/services/grammarEngine/detectors/baseDetector';

/**
 * Create realistic morphological features based on POS and other parameters
 */
export function createRealisticMorph(
  pos: string = 'NOUN',
  gender?: string,
  caseVal?: string,
  number: string = 'Sing'
): Record<string, string> {
  const morph: Record<string, string> = {};

  // Add number
  morph['Number'] = number === 'Plur' ? 'Plur' : 'Sing';

  // Add case
  if (caseVal) {
    morph['Case'] = caseVal;
  } else if (pos === 'NOUN' || pos === 'DET' || pos === 'ADJ') {
    morph['Case'] = 'Nom'; // Default to nominative
  }

  // Add gender (relevant for DET, ADJ, NOUN in German)
  if (gender) {
    morph['Gender'] = gender;
  } else if (pos === 'NOUN' || pos === 'DET' || pos === 'ADJ') {
    morph['Gender'] = 'Masc'; // Default to masculine
  }

  // Add tense and mood for verbs
  if (pos === 'VERB' || pos === 'AUX') {
    morph['Tense'] = 'Pres';
    morph['VerbForm'] = 'Fin';
    morph['Mood'] = 'Ind';
    morph['Voice'] = 'Act';
    morph['Person'] = '3';
  }

  // Add degree for adjectives
  if (pos === 'ADJ') {
    morph['Degree'] = 'Pos';
  }

  return morph;
}

/**
 * Create mock token data for testing
 */
export function createMockToken(
  text: string,
  lemma: string = text.toLowerCase(),
  pos: string = 'NOUN',
  options: Partial<TokenData> = {}
): TokenData {
  return {
    text,
    lemma,
    pos,
    tag: pos,
    dep: 'dep',
    index: 0,
    characterStart: 0,
    characterEnd: text.length,
    morph: createRealisticMorph(pos),
    ...options,
  };
}

/**
 * Create mock sentence data for testing
 */
export function createMockSentence(text: string, tokens: TokenData[]): SentenceData {
  // Update character positions
  let currentPos = 0;
  const positionedTokens = tokens.map((token, index) => {
    const positionedToken = {
      ...token,
      index,
      characterStart: currentPos,
      characterEnd: currentPos + token.text.length,
      // Ensure morph has realistic values
      morph: token.morph && Object.keys(token.morph).length > 0 
        ? token.morph 
        : createRealisticMorph(token.pos),
    };
    currentPos += token.text.length + 1; // +1 for space
    return positionedToken;
  });

  return {
    text,
    tokens: positionedTokens,
  };
}

/**
 * Create a simple sentence with basic tokenization
 */
export function createSimpleSentence(text: string): SentenceData {
  const words = text.split(' ');
  const tokens: TokenData[] = [];
  let currentPos = 0;

  words.forEach((word, index) => {
    tokens.push({
      text: word,
      lemma: word.toLowerCase(),
      pos: 'NOUN', // Default POS
      tag: 'NOUN',
      dep: 'dep',
      index,
      characterStart: currentPos,
      characterEnd: currentPos + word.length,
      morph: createRealisticMorph('NOUN'),
    });
    currentPos += word.length + 1; // +1 for space
  });

  return {
    text,
    tokens,
  };
}

/**
 * Test data for German grammar patterns
 */
export const testSentences = {
  passive: {
    present: "Das Haus wird von meinem Vater gebaut.",
    past: "Das Haus wurde von meinem Vater gebaut.",
    future: "Das Haus wird von meinem Vater gebaut werden.",
  },
  modal: {
    present: "Ich muss arbeiten.",
    past: "Ich musste arbeiten.",
    future: "Ich werde arbeiten müssen.",
  },
  separable: {
    present: "Ich stehe auf.",
    past: "Ich stand auf.",
  },
  subordinate: {
    weil: "Ich bleibe zu Hause, weil es regnet.",
    dass: "Ich weiß, dass du kommst.",
    wenn: "Ruf mich an, wenn du da bist.",
  },
  subjunctive: {
    present: "Ich würde gerne kommen.",
    past: "Ich hätte gerne geholfen.",
  },
  case: {
    accusative: "Ich sehe den Mann.",
    dative: "Ich helfe dem Mann.",
    genitive: "Das Auto des Mannes.",
  },
};