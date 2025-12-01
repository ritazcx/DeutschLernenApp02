/**
 * Real Morphological Data Tests
 *
 * Tests that use actual SpaCy morphological analysis results
 * instead of mock data. This exposes morphological analysis failures.
 */

import { realMorphologicalData } from '../testUtils/realMorphologicalData';
import { analyzeMorphologicalCompleteness, printMorphologicalReport } from '../testUtils/morphologicalValidator';
import { TenseDetector } from '../../src/services/grammarEngine/detectors/tenseDetector';
import { CaseDetector } from '../../src/services/grammarEngine/detectors/caseDetector';
import { PrepositionDetector } from '../../src/services/grammarEngine/detectors/prepositionDetector';
import { AgreementDetector } from '../../src/services/grammarEngine/detectors/agreementDetector';
import { ModalVerbDetector } from '../../src/services/grammarEngine/detectors/modalVerbDetector';
import { PassiveVoiceDetector } from '../../src/services/grammarEngine/detectors/passiveVoiceDetector';
import { SubjunctiveDetector } from '../../src/services/grammarEngine/detectors/subjunctiveDetector';
import { WordOrderDetector } from '../../src/services/grammarEngine/detectors/wordOrderDetector';
import { SentenceData, TokenData, DetectionResult } from '../../src/services/grammarEngine/detectors/baseDetector';
import { Token, MorphFeature } from '../../src/services/nlpEngine/types';

/**
 * Convert MorphFeature enum values to spaCy string format
 */
function convertMorphFeatureToSpacyFormat(morph: MorphFeature): Record<string, string> {
  const result: Record<string, string> = {};

  // Convert enum values to spaCy format
  if (morph.case && morph.case !== 'n/a') {
    const caseMap: Record<string, string> = {
      'nominative': 'Nom',
      'genitive': 'Gen', 
      'dative': 'Dat',
      'accusative': 'Acc'
    };
    result.Case = caseMap[morph.case] || morph.case;
  }

  if (morph.number && morph.number !== 'n/a') {
    const numberMap: Record<string, string> = {
      'singular': 'Sing',
      'plural': 'Plur'
    };
    result.Number = numberMap[morph.number] || morph.number;
  }

  if (morph.gender && morph.gender !== 'n/a') {
    const genderMap: Record<string, string> = {
      'masculine': 'Masc',
      'feminine': 'Fem',
      'neuter': 'Neut'
    };
    result.Gender = genderMap[morph.gender] || morph.gender;
  }

  if (morph.tense && morph.tense !== 'n/a') {
    const tenseMap: Record<string, string> = {
      'present': 'Pres',
      'past': 'Past',
      'perfect': 'Perf',
      'pluperfect': 'Pqp',
      'future': 'Fut'
    };
    result.Tense = tenseMap[morph.tense] || morph.tense;
  }

  if (morph.mood && morph.mood !== 'n/a') {
    const moodMap: Record<string, string> = {
      'indicative': 'Ind',
      'subjunctive': 'Sub',
      'conditional': 'Cond',
      'imperative': 'Imp'
    };
    result.Mood = moodMap[morph.mood] || morph.mood;
  }

  if (morph.person && morph.person !== 'n/a') {
    const personMap: Record<string, string> = {
      '1sg': '1',
      '2sg': '2', 
      '3sg': '3',
      '1pl': '1',
      '2pl': '2',
      '3pl': '3'
    };
    result.Person = personMap[morph.person] || morph.person.replace(/sg|pl/, '');
  }

  if (morph.verbForm && morph.verbForm !== 'n/a') {
    const verbFormMap: Record<string, string> = {
      'fin': 'Fin',
      'inf': 'Inf',
      'part': 'Part',
      'ger': 'Ger'
    };
    result.VerbForm = verbFormMap[morph.verbForm] || morph.verbForm;
  }

  if (morph.voice && morph.voice !== 'n/a') {
    result.Voice = morph.voice === 'passive' ? 'Pass' : 'Act';
  }

  return result;
}

/**
 * Convert Token[] to SentenceData format expected by detectors
 */
function convertTokensToSentenceData(sentence: string, tokens: Token[]): SentenceData {
  const tokenData: TokenData[] = tokens.map((token, index) => ({
    text: token.word,
    lemma: token.lemma,
    pos: token.pos,
    tag: token.pos, // Using pos as tag for simplicity
    dep: '', // Not needed for these tests
    morph: Object.keys(token.morph).length > 0 ? convertMorphFeatureToSpacyFormat(token.morph) : undefined,
    index,
    characterStart: token.position.start,
    characterEnd: token.position.end
  }));

  return {
    text: sentence,
    tokens: tokenData
  };
}

describe('Real Morphological Data Tests', () => {
  const tenseDetector = new TenseDetector();
  const caseDetector = new CaseDetector();
  const prepositionDetector = new PrepositionDetector();
  const agreementDetector = new AgreementDetector();
  const modalVerbDetector = new ModalVerbDetector();
  const passiveVoiceDetector = new PassiveVoiceDetector();
  const subjunctiveDetector = new SubjunctiveDetector();
  const wordOrderDetector = new WordOrderDetector();
  describe('Morphological Completeness Analysis', () => {
    test('should analyze morphological completeness of real SpaCy data', () => {
      const tokens = realMorphologicalData.complex.tokens;
      const analysis = analyzeMorphologicalCompleteness(tokens);

      console.log('\n=== MORPHOLOGICAL COMPLETENESS ANALYSIS ===');
      console.log(`Total tokens: ${analysis.totalTokens}`);
      console.log(`Tokens with morph features: ${analysis.tokensWithMorph} (${analysis.completenessPercentage.toFixed(1)}%)`);
      console.log(`Missing features: ${analysis.missingFeatures.join(', ') || 'none'}`);

      // With real SpaCy data, we expect high completeness
      expect(analysis.completenessPercentage).toBeGreaterThan(80);
    });

    test('should detect morphological failures when features are missing', () => {
      const tokens = realMorphologicalData.broken.tokens;
      const analysis = analyzeMorphologicalCompleteness(tokens);

      console.log('\n=== BROKEN MORPHOLOGICAL ANALYSIS ===');
      console.log(`Total tokens: ${analysis.totalTokens}`);
      console.log(`Tokens with morph features: ${analysis.tokensWithMorph} (${analysis.completenessPercentage.toFixed(1)}%)`);
      console.log(`Missing features: ${analysis.missingFeatures.join(', ') || 'none'}`);

      // With broken data, completeness should be very low
      expect(analysis.completenessPercentage).toBeLessThan(20);
      expect(analysis.missingFeatures).toContain('Case');
      expect(analysis.missingFeatures).toContain('Tense');
    });
  });

  describe('Grammar Detection with Real Morphological Data', () => {
    test('should detect tenses with complete morphological data', () => {
      const tokens = realMorphologicalData.complex.tokens;
      const sentenceData = convertTokensToSentenceData(realMorphologicalData.complex.sentence, tokens);

      // Debug: Log what the detector receives
      console.log('=== DEBUG: SentenceData for TenseDetector ===');
      sentenceData.tokens.forEach((token, i) => {
        console.log(`${i}: "${token.text}" (${token.pos}) morph=${JSON.stringify(token.morph)}`);
      });

      const grammarPoints: DetectionResult[] = tenseDetector.detect(sentenceData);

      console.log('\n=== TENSE DETECTION WITH REAL DATA ===');
      console.log(`Sentence: "${realMorphologicalData.complex.sentence}"`);
      console.log(`Grammar points found: ${grammarPoints.length}`);

      // Should detect past tense in "erklärten"
      const pastTensePoints = grammarPoints.filter((gp: DetectionResult) => gp.grammarPoint?.category === 'tense');
      expect(pastTensePoints.length).toBeGreaterThan(0);

      printMorphologicalReport(realMorphologicalData.complex.sentence, tokens, grammarPoints);
    });

    test('should fail to detect tenses with broken morphological data', () => {
      const tokens = realMorphologicalData.broken.tokens;
      const sentenceData = convertTokensToSentenceData(realMorphologicalData.broken.sentence, tokens);
      const grammarPoints: DetectionResult[] = tenseDetector.detect(sentenceData);

      console.log('\n=== TENSE DETECTION WITH BROKEN DATA ===');
      console.log(`Sentence: "${realMorphologicalData.broken.sentence}"`);
      console.log(`Grammar points found: ${grammarPoints.length}`);

      // Should detect no tense points due to missing morphological features
      const tensePoints = grammarPoints.filter((gp: DetectionResult) => gp.grammarPoint?.category === 'tense');
      expect(tensePoints.length).toBe(0); // This test should FAIL if morphological analysis is broken

      printMorphologicalReport(realMorphologicalData.broken.sentence, tokens, grammarPoints);
    });

    test('should detect cases with complete morphological data', () => {
      const tokens = realMorphologicalData.complex.tokens;
      const sentenceData = convertTokensToSentenceData(realMorphologicalData.complex.sentence, tokens);
      const grammarPoints: DetectionResult[] = caseDetector.detect(sentenceData);

      console.log('\n=== CASE DETECTION WITH REAL DATA ===');
      console.log(`Sentence: "${realMorphologicalData.complex.sentence}"`);
      console.log(`Grammar points found: ${grammarPoints.length}`);

      // Should detect various cases
      const casePoints = grammarPoints.filter((gp: DetectionResult) => gp.grammarPoint?.category === 'case');
      expect(casePoints.length).toBeGreaterThan(0);

      printMorphologicalReport(realMorphologicalData.complex.sentence, tokens, grammarPoints);
    });

    test('should fail to detect cases with broken morphological data', () => {
      const tokens = realMorphologicalData.broken.tokens;
      const sentenceData = convertTokensToSentenceData(realMorphologicalData.broken.sentence, tokens);
      const grammarPoints: DetectionResult[] = caseDetector.detect(sentenceData);

      console.log('\n=== CASE DETECTION WITH BROKEN DATA ===');
      console.log(`Sentence: "${realMorphologicalData.broken.sentence}"`);
      console.log(`Grammar points found: ${grammarPoints.length}`);

      // Should detect no case points due to missing morphological features
      const casePoints = grammarPoints.filter((gp: DetectionResult) => gp.grammarPoint?.category === 'case');
      expect(casePoints.length).toBe(0); // This test should FAIL if morphological analysis is broken

      printMorphologicalReport(realMorphologicalData.broken.sentence, tokens, grammarPoints);
    });

    test('should detect agreement with complete morphological data', () => {
      const tokens = realMorphologicalData.complex.tokens;
      const sentenceData = convertTokensToSentenceData(realMorphologicalData.complex.sentence, tokens);
      const grammarPoints: DetectionResult[] = agreementDetector.detect(sentenceData);

      console.log('\n=== AGREEMENT DETECTION WITH REAL DATA ===');
      console.log(`Sentence: "${realMorphologicalData.complex.sentence}"`);
      console.log(`Grammar points found: ${grammarPoints.length}`);

      // Should detect agreement patterns
      const agreementPoints = grammarPoints.filter((gp: DetectionResult) => gp.grammarPoint?.category === 'agreement');
      expect(agreementPoints.length).toBeGreaterThan(0);

      printMorphologicalReport(realMorphologicalData.complex.sentence, tokens, grammarPoints);
    });

    test('should fail to detect agreement with broken morphological data', () => {
      const tokens = realMorphologicalData.broken.tokens;
      const sentenceData = convertTokensToSentenceData(realMorphologicalData.broken.sentence, tokens);
      const grammarPoints: DetectionResult[] = agreementDetector.detect(sentenceData);

      console.log('\n=== AGREEMENT DETECTION WITH BROKEN DATA ===');
      console.log(`Sentence: "${realMorphologicalData.broken.sentence}"`);
      console.log(`Grammar points found: ${grammarPoints.length}`);

      // Should detect no agreement points due to missing morphological features
      const agreementPoints = grammarPoints.filter((gp: DetectionResult) => gp.grammarPoint?.category === 'agreement');
      expect(agreementPoints.length).toBe(0); // This test should FAIL if morphological analysis is broken

      printMorphologicalReport(realMorphologicalData.broken.sentence, tokens, grammarPoints);
    });

    test('should detect modal verbs with complete morphological data', () => {
      const tokens = realMorphologicalData.modalVerb.tokens;
      const sentenceData = convertTokensToSentenceData(realMorphologicalData.modalVerb.sentence, tokens);
      const grammarPoints: DetectionResult[] = modalVerbDetector.detect(sentenceData);

      console.log('\n=== MODAL VERB DETECTION WITH REAL DATA ===');
      console.log(`Sentence: "${realMorphologicalData.modalVerb.sentence}"`);
      console.log(`Grammar points found: ${grammarPoints.length}`);

      // Should detect modal verb construction
      const modalVerbPoints = grammarPoints.filter((gp: DetectionResult) => gp.grammarPoint?.category === 'modal-verb');
      expect(modalVerbPoints.length).toBeGreaterThan(0);

      printMorphologicalReport(realMorphologicalData.modalVerb.sentence, tokens, grammarPoints);
    });

    test('should detect passive voice with complete morphological data', () => {
      const tokens = realMorphologicalData.passiveVoice.tokens;
      const sentenceData = convertTokensToSentenceData(realMorphologicalData.passiveVoice.sentence, tokens);
      const grammarPoints: DetectionResult[] = passiveVoiceDetector.detect(sentenceData);

      console.log('\n=== PASSIVE VOICE DETECTION WITH REAL DATA ===');
      console.log(`Sentence: "${realMorphologicalData.passiveVoice.sentence}"`);
      console.log(`Grammar points found: ${grammarPoints.length}`);

      // Should detect passive voice construction
      const passivePoints = grammarPoints.filter((gp: DetectionResult) => gp.grammarPoint?.category === 'passive');
      expect(passivePoints.length).toBeGreaterThan(0);

      printMorphologicalReport(realMorphologicalData.passiveVoice.sentence, tokens, grammarPoints);
    });

    test('should detect subjunctive mood with complete morphological data', () => {
      const tokens = realMorphologicalData.subjunctive.tokens;
      const sentenceData = convertTokensToSentenceData(realMorphologicalData.subjunctive.sentence, tokens);
      const grammarPoints: DetectionResult[] = subjunctiveDetector.detect(sentenceData);

      console.log('\n=== SUBJUNCTIVE DETECTION WITH REAL DATA ===');
      console.log(`Sentence: "${realMorphologicalData.subjunctive.sentence}"`);
      console.log(`Grammar points found: ${grammarPoints.length}`);

      // Should detect subjunctive mood (Konjunktiv II)
      const subjunctivePoints = grammarPoints.filter((gp: DetectionResult) => gp.grammarPoint?.category === 'mood');
      expect(subjunctivePoints.length).toBeGreaterThan(0);

      printMorphologicalReport(realMorphologicalData.subjunctive.sentence, tokens, grammarPoints);
    });

    test('should detect prepositions with complete morphological data', () => {
      const tokens = realMorphologicalData.preposition.tokens;
      const sentenceData = convertTokensToSentenceData(realMorphologicalData.preposition.sentence, tokens);
      const grammarPoints: DetectionResult[] = prepositionDetector.detect(sentenceData);

      console.log('\n=== PREPOSITION DETECTION WITH REAL DATA ===');
      console.log(`Sentence: "${realMorphologicalData.preposition.sentence}"`);
      console.log(`Grammar points found: ${grammarPoints.length}`);

      // Should detect preposition patterns (dative and accusative)
      const prepositionPoints = grammarPoints.filter((gp: DetectionResult) => gp.grammarPoint?.category === 'preposition');
      expect(prepositionPoints.length).toBeGreaterThan(0);

      printMorphologicalReport(realMorphologicalData.preposition.sentence, tokens, grammarPoints);
    });

    test('should detect word order with complete morphological data', () => {
      const tokens = realMorphologicalData.wordOrder.tokens;
      const sentenceData = convertTokensToSentenceData(realMorphologicalData.wordOrder.sentence, tokens);
      const grammarPoints: DetectionResult[] = wordOrderDetector.detect(sentenceData);

      console.log('\n=== WORD ORDER DETECTION WITH REAL DATA ===');
      console.log(`Sentence: "${realMorphologicalData.wordOrder.sentence}"`);
      console.log(`Grammar points found: ${grammarPoints.length}`);

      // Should detect word order patterns
      const wordOrderPoints = grammarPoints.filter((gp: DetectionResult) => gp.grammarPoint?.category === 'word-order');
      expect(wordOrderPoints.length).toBeGreaterThan(0);

      printMorphologicalReport(realMorphologicalData.wordOrder.sentence, tokens, grammarPoints);
    });
  });
});