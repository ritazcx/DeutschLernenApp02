/**
 * Integration Tests for Grammar Detection API
 * Tests complex German sentences against running server on port 4000
 */

describe('Grammar Detection Integration Tests', () => {
  const API_URL = 'http://localhost:4000/api/grammar/analyze-detection';

  async function analyzeGrammar(text: string) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    return response.json();
  }

  describe('A1 Level - Basic Tense & Case', () => {
    it('should detect present tense', async () => {
      const result = await analyzeGrammar('Ich laufe schnell.');
      expect(result.sentences[0].grammarPoints.length).toBeGreaterThan(0);
      const tensePoints = result.sentences[0].byCategory.tense || [];
      expect(tensePoints.length).toBeGreaterThan(0);
    });

    it('should detect nominative case', async () => {
      const result = await analyzeGrammar('Der Mann ist hier.');
      const casePoints = result.sentences[0].byCategory.case || [];
      expect(casePoints.length).toBeGreaterThan(0);
    });

    it('should detect dative case', async () => {
      const result = await analyzeGrammar('Ich gebe dem Jungen ein Buch.');
      const casePoints = result.sentences[0].byCategory.case || [];
      expect(casePoints.some((p: any) => p.grammarPoint.name.includes('Dative'))).toBe(true);
    });
  });

  describe('A2 Level - Past Tense & More Cases', () => {
    it('should distinguish past from present tense', async () => {
      const present = await analyzeGrammar('Ich laufe schnell.');
      const past = await analyzeGrammar('Ich lief schnell.');

      const presentTense = present.sentences[0].byCategory.tense || [];
      const pastTense = past.sentences[0].byCategory.tense || [];

      expect(presentTense[0].grammarPoint.id).toContain('present');
      expect(pastTense[0].grammarPoint.id).toContain('past');
    });

    it('should detect genitive case', async () => {
      const result = await analyzeGrammar('Das Buch des Lehrers ist alt.');
      const casePoints = result.sentences[0].byCategory.case || [];
      expect(casePoints.some((p: any) => p.grammarPoint.name.includes('Genitive'))).toBe(true);
    });

    it('should detect accusative case', async () => {
      const result = await analyzeGrammar('Ich sehe einen Mann.');
      const casePoints = result.sentences[0].byCategory.case || [];
      expect(casePoints.some((p: any) => p.grammarPoint.name.includes('Accusative'))).toBe(true);
    });
  });

  describe('B1 Level - Passive Voice & Complex Structures', () => {
    it('should detect present passive voice', async () => {
      const result = await analyzeGrammar('Das Buch wird gelesen.');
      const passivePoints = result.sentences[0].byCategory.passive || [];
      expect(passivePoints.length).toBeGreaterThan(0);
      expect(passivePoints[0].grammarPoint.level).toBe('B1');
    });

    it('should detect past passive voice', async () => {
      const result = await analyzeGrammar('Das Buch wurde gelesen.');
      const passivePoints = result.sentences[0].byCategory.passive || [];
      expect(passivePoints.length).toBeGreaterThan(0);
    });

    it('should detect subordinate clause', async () => {
      const result = await analyzeGrammar('Ich bin müde, weil ich lange gearbeitet habe.');
      expect(result.sentences[0].grammarPoints.length).toBeGreaterThan(0);
    });
  });

  describe('Multiple Sentences', () => {
    it('should handle multiple sentences', async () => {
      const result = await analyzeGrammar('Ich laufe. Das Buch wird gelesen. Der Mann ist alt.');
      expect(result.sentences.length).toBe(3);
      expect(result.summary.totalPoints).toBeGreaterThan(0);
    });

    it('should organize by CEFR level', async () => {
      const result = await analyzeGrammar('Ich laufe. Das wird gelesen.');
      const { A1, A2, B1 } = result.sentences[0].byLevel;
      expect((A1?.length || 0) + (A2?.length || 0) + (B1?.length || 0)).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle German umlauts', async () => {
      const result = await analyzeGrammar('Der Überfluss ist großartig.');
      expect(result.sentences[0]).toBeDefined();
    });

    it('should handle punctuation variations', async () => {
      const period = await analyzeGrammar('Ich laufe.');
      const exclaim = await analyzeGrammar('Ich laufe!');
      const question = await analyzeGrammar('Ich laufe?');

      expect(period.sentences[0].grammarPoints.length).toBeGreaterThan(0);
      expect(exclaim.sentences[0].grammarPoints.length).toBeGreaterThan(0);
      expect(question.sentences[0].grammarPoints.length).toBeGreaterThan(0);
    });

    it('should have morphology data in results', async () => {
      const result = await analyzeGrammar('Der Mann sieht das Buch.');
      const tensePoints = result.sentences[0].byCategory.tense || [];
      expect(tensePoints[0]?.details).toBeDefined();
    });
  });

  describe('Confidence Scores', () => {
    it('should have high confidence for clear patterns', async () => {
      const result = await analyzeGrammar('Ich laufe schnell.');
      const tensePoints = result.sentences[0].byCategory.tense || [];
      expect(tensePoints[0].confidence).toBeGreaterThan(0.85);
    });
  });
});
