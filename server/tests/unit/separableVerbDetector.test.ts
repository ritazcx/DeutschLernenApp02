import { SeparableVerbDetector } from '../../src/services/grammarEngine/detectors/B1/separableVerbDetector';
import { SentenceData, TokenData } from '../../src/services/grammarEngine/detectors/shared/baseDetector';

describe('SeparableVerbDetector', () => {
  let detector: SeparableVerbDetector;

  beforeEach(() => {
    detector = new SeparableVerbDetector();
  });

  const createToken = (text: string, lemma: string, pos: string, index: number, options: any = {}): TokenData => ({
    text,
    lemma,
    pos,
    tag: options.tag || pos,
    dep: options.dep || 'ROOT',
    head: options.head,
    morph: {},
    index,
    characterStart: 0,
    characterEnd: text.length,
  });

  const createSentence = (text: string, tokens: TokenData[]): SentenceData => ({
    text,
    tokens: tokens.map((t, i) => ({ ...t, index: i })),
  });

  it('should detect separated verb with PTKVZ tag', () => {
    const sentence = createSentence('Ich stehe früh auf', [
      createToken('Ich', 'ich', 'PRON', 0, {}),
      createToken('stehe', 'stehen', 'VERB', 1, { tag: 'VVFIN', dep: 'ROOT' }),
      createToken('früh', 'früh', 'ADV', 2, {}),
      createToken('auf', 'auf', 'ADP', 3, { tag: 'PTKVZ', dep: 'svp', head: 'stehe' }),
    ]);

    const results = detector.detect(sentence);

    expect(results).toHaveLength(1);
    expect(results[0].details.pattern).toBe('separated');
    expect(results[0].confidence).toBe(0.95);
  });

  it('should detect combined verb in infinitive form', () => {
    const sentence = createSentence('Ich muss aufstehen', [
      createToken('Ich', 'ich', 'PRON', 0, {}),
      createToken('muss', 'müssen', 'VERB', 1, {}),
      createToken('aufstehen', 'aufstehen', 'VERB', 2, { tag: 'VVINF' }),
    ]);

    const results = detector.detect(sentence);

    expect(results).toHaveLength(1);
    expect(results[0].details.pattern).toBe('combined');
    expect(results[0].details.prefix).toBe('auf');
  });

  it('should detect combined verb in subordinate clause', () => {
    const sentence = createSentence('Ich weiß, dass ich aufstehe', [
      createToken('Ich', 'ich', 'PRON', 0, {}),
      createToken('weiß', 'wissen', 'VERB', 1, {}),
      createToken(',', ',', 'PUNCT', 2, {}),
      createToken('dass', 'dass', 'SCONJ', 3, { tag: 'KOUS' }),
      createToken('ich', 'ich', 'PRON', 4, {}),
      createToken('aufstehe', 'aufstehen', 'VERB', 5, {}),
    ]);

    const results = detector.detect(sentence);

    expect(results).toHaveLength(1);
    expect(results[0].details.pattern).toBe('combined');
    expect(results[0].confidence).toBe(0.85);
  });

  it('should detect separated verb - Er ruft mich an', () => {
    const sentence = createSentence('Er ruft mich an', [
      createToken('Er', 'er', 'PRON', 0, {}),
      createToken('ruft', 'rufen', 'VERB', 1, { tag: 'VVFIN', dep: 'ROOT' }),
      createToken('mich', 'ich', 'PRON', 2, {}),
      createToken('an', 'an', 'ADP', 3, { tag: 'PTKVZ', dep: 'svp', head: 'ruft' }),
    ]);

    const results = detector.detect(sentence);

    expect(results).toHaveLength(1);
    expect(results[0].details.pattern).toBe('separated');
    expect(results[0].confidence).toBe(0.95);
  });

  it('should detect combined verb with subordinate - Er sagt, dass er mich anruft', () => {
    const sentence = createSentence('Er sagt, dass er mich anruft', [
      createToken('Er', 'er', 'PRON', 0, {}),
      createToken('sagt', 'sagen', 'VERB', 1, {}),
      createToken(',', ',', 'PUNCT', 2, {}),
      createToken('dass', 'dass', 'SCONJ', 3, { tag: 'KOUS' }),
      createToken('er', 'er', 'PRON', 4, {}),
      createToken('mich', 'ich', 'PRON', 5, {}),
      createToken('anruft', 'anrufen', 'VERB', 6, {}),
    ]);

    const results = detector.detect(sentence);

    expect(results).toHaveLength(1);
    expect(results[0].details.pattern).toBe('combined');
    expect(results[0].confidence).toBe(0.85);
  });

  it('should detect combined verb with modal - Ich muss früh aufstehen', () => {
    const sentence = createSentence('Ich muss früh aufstehen', [
      createToken('Ich', 'ich', 'PRON', 0, {}),
      createToken('muss', 'müssen', 'VERB', 1, {}),
      createToken('früh', 'früh', 'ADV', 2, {}),
      createToken('aufstehen', 'aufstehen', 'VERB', 3, { tag: 'VVINF' }),
    ]);

    const results = detector.detect(sentence);

    expect(results).toHaveLength(1);
    expect(results[0].details.pattern).toBe('combined');
    expect(results[0].confidence).toBe(0.90);
  });

  it('should detect combined verb with modal - Er will mich anrufen', () => {
    const sentence = createSentence('Er will mich anrufen', [
      createToken('Er', 'er', 'PRON', 0, {}),
      createToken('will', 'wollen', 'VERB', 1, {}),
      createToken('mich', 'ich', 'PRON', 2, {}),
      createToken('anrufen', 'anrufen', 'VERB', 3, { tag: 'VVINF' }),
    ]);

    const results = detector.detect(sentence);

    expect(results).toHaveLength(1);
    expect(results[0].details.pattern).toBe('combined');
    expect(results[0].confidence).toBe(0.90);
  });

  it('should detect combined verb - past participle - Ich bin früh aufgestanden', () => {
    const sentence = createSentence('Ich bin früh aufgestanden', [
      createToken('Ich', 'ich', 'PRON', 0, {}),
      createToken('bin', 'sein', 'AUX', 1, {}),
      createToken('früh', 'früh', 'ADV', 2, {}),
      createToken('aufgestanden', 'aufstehen', 'VERB', 3, { tag: 'VVPP' }),
    ]);

    const results = detector.detect(sentence);

    expect(results).toHaveLength(1);
    expect(results[0].details.pattern).toBe('combined');
    expect(results[0].confidence).toBe(0.90);
  });

  it('should detect combined verb - past participle - Er hat mich angerufen', () => {
    const sentence = createSentence('Er hat mich angerufen', [
      createToken('Er', 'er', 'PRON', 0, {}),
      createToken('hat', 'haben', 'AUX', 1, {}),
      createToken('mich', 'ich', 'PRON', 2, {}),
      createToken('angerufen', 'anrufen', 'VERB', 3, { tag: 'VVPP' }),
    ]);

    const results = detector.detect(sentence);

    expect(results).toHaveLength(1);
    expect(results[0].details.pattern).toBe('combined');
    expect(results[0].confidence).toBe(0.90);
  });

  it('should detect separated verb - Es fängt an', () => {
    const sentence = createSentence('Es fängt an', [
      createToken('Es', 'es', 'PRON', 0, {}),
      createToken('fängt', 'fangen', 'VERB', 1, { tag: 'VVFIN', dep: 'ROOT' }),
      createToken('an', 'an', 'ADP', 2, { tag: 'PTKVZ', dep: 'svp', head: 'fängt' }),
    ]);

    const results = detector.detect(sentence);

    expect(results).toHaveLength(1);
    expect(results[0].details.pattern).toBe('separated');
    expect(results[0].confidence).toBe(0.95);
  });

  it('should detect separated verb with long distance - Er ruft mich morgen um 7 Uhr an', () => {
    const sentence = createSentence('Er ruft mich morgen um 7 Uhr an', [
      createToken('Er', 'er', 'PRON', 0, {}),
      createToken('ruft', 'rufen', 'VERB', 1, { tag: 'VVFIN', dep: 'ROOT' }),
      createToken('mich', 'ich', 'PRON', 2, {}),
      createToken('morgen', 'morgen', 'ADV', 3, {}),
      createToken('um', 'um', 'ADP', 4, {}),
      createToken('7', '7', 'NUM', 5, {}),
      createToken('Uhr', 'Uhr', 'NOUN', 6, {}),
      createToken('an', 'an', 'ADP', 7, { tag: 'PTKVZ', dep: 'svp', head: 'ruft' }),
    ]);

    const results = detector.detect(sentence);

    expect(results).toHaveLength(1);
    expect(results[0].details.pattern).toBe('separated');
    expect(results[0].confidence).toBe(0.95);
  });

  it('should detect combined verb - Die Spiele werden stattfinden', () => {
    const sentence = createSentence('Die Spiele werden stattfinden', [
      createToken('Die', 'der', 'DET', 0, {}),
      createToken('Spiele', 'Spiel', 'NOUN', 1, {}),
      createToken('werden', 'werden', 'AUX', 2, {}),
      createToken('stattfinden', 'stattfinden', 'VERB', 3, { tag: 'VVINF' }),
    ]);

    const results = detector.detect(sentence);

    expect(results).toHaveLength(1);
    expect(results[0].details.pattern).toBe('combined');
    expect(results[0].details.prefix).toBe('statt');
  });

  it('should detect separated verb - Das IOC läutete die Bewerbungsphase ein', () => {
    const sentence = createSentence('Das IOC läutete die Bewerbungsphase ein', [
      createToken('Das', 'der', 'DET', 0, {}),
      createToken('IOC', 'IOC', 'PROPN', 1, {}),
      createToken('läutete', 'läuten', 'VERB', 2, { tag: 'VVFIN', dep: 'ROOT' }),
      createToken('die', 'der', 'DET', 3, {}),
      createToken('Bewerbungsphase', 'Bewerbungsphase', 'NOUN', 4, {}),
      createToken('ein', 'ein', 'ADP', 5, { tag: 'PTKVZ', dep: 'svp', head: 'läutete' }),
    ]);

    const results = detector.detect(sentence);

    expect(results).toHaveLength(1);
    expect(results[0].details.pattern).toBe('separated');
    expect(results[0].confidence).toBe(0.95);
  });
});
