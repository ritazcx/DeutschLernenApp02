import { CollocationDetector } from '../../src/services/grammarEngine/detectors/B1/collocationDetector';
import { createMockSentence, createMockToken } from '../testUtils';
import { TokenData } from '../../src/services/grammarEngine/detectors/shared/baseDetector';

describe('CollocationDetector - Long sentence integration test', () => {
  let detector: CollocationDetector;

  beforeEach(() => {
    detector = new CollocationDetector();
  });

  function createTokenWithHead(
    text: string,
    lemma: string,
    pos: string,
    dep: string,
    head: string | undefined,
    index: number,
    options: Partial<TokenData> = {}
  ): TokenData {
    return createMockToken(text, lemma, pos, { dep, head, index, ...options });
  }

  it('detects sich-erinnern-an in a long sentence', () => {
    const tokens = [
      createTokenWithHead('Als', 'als', 'SCONJ', 'mark', 'ging', 0),
      createTokenWithHead('sie', 'sie', 'PRON', 'nsubj', 'ging', 1),
      createTokenWithHead('durch', 'durch', 'ADP', 'case', 'Viertel', 2),
      createTokenWithHead('das', 'das', 'DET', 'det', 'Viertel', 3),
      createTokenWithHead('alte', 'alt', 'ADJ', 'amod', 'Viertel', 4),
      createTokenWithHead('Viertel', 'Viertel', 'NOUN', 'obl', 'ging', 5),
      createTokenWithHead('ging', 'gehen', 'VERB', 'ccomp', 'konnte', 6),
      createTokenWithHead(',', ',', 'PUNCT', 'punct', 'konnte', 7),
      createTokenWithHead('konnte', 'können', 'AUX', 'ROOT', undefined, 8),
      createTokenWithHead('sie', 'sie', 'PRON', 'nsubj', 'konnte', 9),
      createTokenWithHead('sich', 'sich', 'PRON', 'dobj', 'erinnern', 10),
      createTokenWithHead('plötzlich', 'plötzlich', 'ADV', 'advmod', 'erinnern', 11),
      createTokenWithHead('an', 'an', 'ADP', 'case', 'Kindheit', 12),
      createTokenWithHead('ihre', 'ihr', 'DET', 'det', 'Kindheit', 13),
      createTokenWithHead('Kindheit', 'Kindheit', 'NOUN', 'dobj', 'erinnern', 14),
      createTokenWithHead('erinnern', 'erinnern', 'VERB', 'xcomp', 'konnte', 15),
      createTokenWithHead('und', 'und', 'CCONJ', 'cc', 'erinnern', 16),
      createTokenWithHead('begann', 'beginnen', 'VERB', 'conj', 'erinnern', 17),
      createTokenWithHead('zu', 'zu', 'PART', 'mark', 'lächeln', 18),
      createTokenWithHead('lächeln', 'lächeln', 'VERB', 'xcomp', 'begann', 19),
    ];

    const sentence = createMockSentence('Als sie durch das alte Viertel ging, konnte sie sich plötzlich an ihre Kindheit erinnern und begann zu lächeln.', tokens);
    const results = detector.detect(sentence);

    // Expect the human-readable collocation label to be present
    const match = results.find(r => r.details.collocation === 'sich erinnern an');
    expect(match).toBeDefined();
    if (match) {
      expect(match.details.type).toBe('reflexive-prep');
      // Ensure matched words include reflexive and preposition
      expect(match.details.words).toEqual(expect.arrayContaining(['erinnern', 'sich', 'an']));
      // If debug path was produced, it should show indices for reflexive/prep
      expect(match.details.tokens.length).toBeGreaterThanOrEqual(3);
    }
  });
});
