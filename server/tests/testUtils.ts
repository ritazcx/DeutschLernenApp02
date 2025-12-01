/**
 * Test Utilities and Helpers
 */

import { SentenceData, TokenData } from '../src/services/grammarEngine/detectors/baseDetector';

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
    morph: {},
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
      morph: {},
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