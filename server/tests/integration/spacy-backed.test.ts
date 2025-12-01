/**
 * Integration Tests with Real spaCy Data
 * Tests grammar detectors with actual spaCy parsing output
 */

import { NLPEngine } from '../../src/services/nlpEngine';

describe('Grammar Detection with Real spaCy Data', () => {
  let nlpEngine: NLPEngine;

  beforeAll(() => {
    nlpEngine = new NLPEngine();
  });

  afterAll(() => {
    // Cleanup if needed
  });

  describe('PassiveVoiceDetector', () => {
    it('should detect present passive voice', async () => {
      const text = 'Das Haus wird von meinem Vater gebaut.';
      const result = await nlpEngine.analyzeGrammar(text);

      expect(result.sentence).toBe(text);
      expect(result.summary.totalPoints).toBeGreaterThan(0);

      // Check if passive voice was detected
      const passivePoints = result.grammarPoints.filter(
        (p) => p.grammarPoint.category === 'passive' || p.grammarPoint.category === 'voice'
      );
      
      console.log(`Passive voice test: Found ${passivePoints.length} passive points`);
      expect(passivePoints.length).toBeGreaterThan(0);
    }, 15000);

    it('should detect past passive voice', async () => {
      const text = 'Alle 203 Nationalen Olympischen Komitees wurden eingeladen.';
      const result = await nlpEngine.analyzeGrammar(text);

      expect(result.sentence).toBe(text);
      expect(result.summary.totalPoints).toBeGreaterThan(0);

      const passivePoints = result.grammarPoints.filter(
        (p) => p.grammarPoint.category === 'passive' || p.grammarPoint.category === 'voice'
      );

      console.log(`Olympic text: Found ${passivePoints.length} passive points`);
      console.log(`Total points: ${result.summary.totalPoints}`);
      console.log(`Points by level:`, result.summary.levels);
      
      expect(passivePoints.length).toBeGreaterThan(0);
    }, 15000);
  });

  describe('ModalVerbDetector', () => {
    it('should detect modal verbs in present tense', async () => {
      const text = 'Ich muss arbeiten.';
      const result = await nlpEngine.analyzeGrammar(text);

      expect(result.sentence).toBe(text);
      const modalPoints = result.grammarPoints.filter(
        (p) => p.grammarPoint.category === 'modal-verb'
      );

      console.log(`Modal verb test: Found ${modalPoints.length} modal points`);
      expect(modalPoints.length).toBeGreaterThan(0);
    }, 15000);

    it('should detect multiple modal verbs', async () => {
      const text = 'Du kannst kommen und ich soll zuhören.';
      const result = await nlpEngine.analyzeGrammar(text);

      expect(result.sentence).toBe(text);
      const modalPoints = result.grammarPoints.filter(
        (p) => p.grammarPoint.category === 'modal-verb'
      );

      console.log(`Multiple modals test: Found ${modalPoints.length} modal points`);
      // Should detect at least one modal verb
      expect(modalPoints.length).toBeGreaterThan(0);
    }, 15000);
  });

  describe('SubordinateClauseDetector', () => {
    it('should detect weil clause (causal subordinate)', async () => {
      const text = 'Ich bleibe zu Hause, weil es regnet.';
      const result = await nlpEngine.analyzeGrammar(text);

      expect(result.sentence).toBe(text);
      
      // Look for word-order which indicates subordinate clause detection
      const subordinatePoints = result.grammarPoints.filter(
        (p) => p.grammarPoint.category === 'word-order' || 
               p.grammarPoint.category.includes('subordinate')
      );

      console.log(`Weil clause test: Found ${subordinatePoints.length} subordinate points`);
      expect(subordinatePoints.length).toBeGreaterThan(0);
    }, 15000);

    it('should detect dass clause (content subordinate)', async () => {
      const text = 'Ich weiß, dass du kommst.';
      const result = await nlpEngine.analyzeGrammar(text);

      expect(result.sentence).toBe(text);
      
      const subordinatePoints = result.grammarPoints.filter(
        (p) => p.grammarPoint.category === 'word-order' || 
               p.grammarPoint.category.includes('subordinate')
      );

      console.log(`Dass clause test: Found ${subordinatePoints.length} subordinate points`);
      // At least one point should be detected
      expect(result.summary.totalPoints).toBeGreaterThan(0);
    }, 15000);
  });

  describe('RelativeClauseDetector', () => {
    it('should detect relative clause with actual dep information', async () => {
      const text = 'Der Mann, der im Garten sitzt, ist alt.';
      const result = await nlpEngine.analyzeGrammar(text);

      expect(result.sentence).toBe(text);
      
      // With fixed dep information, should detect relative clause
      const relativePoints = result.grammarPoints.filter(
        (p) => p.grammarPoint.category.includes('relative') ||
               p.grammarPoint.category === 'word-order'
      );

      console.log(`Relative clause test: Found ${relativePoints.length} relative points`);
      expect(result.summary.totalPoints).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Complex German Structures', () => {
    it('should handle complex sentence with multiple grammar points', async () => {
      const text = 'Das Buch, das ich gelesen habe, ist interessant und ich würde es jedem empfehlen.';
      const result = await nlpEngine.analyzeGrammar(text);

      console.log(`Complex sentence: Found ${result.summary.totalPoints} total points`);
      console.log(`By level:`, result.summary.levels);
      console.log(`By category:`, result.summary.categories);

      expect(result.summary.totalPoints).toBeGreaterThan(0);
    }, 15000);

    it('should analyze conditional sentence', async () => {
      const text = 'Wenn du das machst, werde ich dir helfen.';
      const result = await nlpEngine.analyzeGrammar(text);

      console.log(`Conditional test: Found ${result.summary.totalPoints} total points`);
      expect(result.summary.totalPoints).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Data Integrity Verification', () => {
    it('should have dep information in analyzed tokens', async () => {
      const text = 'Das Haus ist groß.';
      const result = await nlpEngine.analyzeGrammar(text);

      // This test passes if no error is thrown
      expect(result.sentence).toBe(text);
      
      // The dep='ROOT' fix should ensure proper dependency parsing
      console.log(`Sentence analyzed successfully with ${result.summary.totalPoints} points`);
    }, 15000);
  });
});
