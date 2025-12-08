/**
 * Integration Tests for Collocation Detection API
 * Tests common verb-preposition collocations against running server on port 4000
 */

// 直接使用全局 fetch，无需 import node-fetch

describe('Collocation Detection Integration Tests', () => {
  const API_URL = 'http://localhost:4000/api/grammar/analyze-detection';

  async function analyzeCollocation(text: string) {
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

  const collocationCases = [
    { sentence: 'Ich warte auf den Bus.', expected: 'warten auf' },
    { sentence: 'Er denkt an die Zukunft.', expected: 'denken an' },
    { sentence: 'Wir glauben an dich.', expected: 'glauben an' },
    { sentence: 'Sie nimmt an dem Kurs teil.', expected: 'teilnehmen an' },
    { sentence: 'Wir halten viel von dir.', expected: 'halten von' },
    { sentence: 'Ich erinnere mich an das Gespräch.', expected: 'sich erinnern an' },
    { sentence: 'Sie interessiert sich für Musik.', expected: 'sich interessieren für' },
    { sentence: 'Er kümmert sich um die Kinder.', expected: 'sich kümmern um' },
    { sentence: 'Wir freuen uns auf die Ferien.', expected: 'sich freuen auf' },
    { sentence: 'Sie bereitet sich auf die Prüfung vor.', expected: 'sich vorbereiten auf' },
    { sentence: 'Wir sprechen über das Problem.', expected: 'sprechen über' },
    { sentence: 'Sie unterhalten sich über Politik.', expected: 'sich unterhalten über' },
    { sentence: 'Er beschwert sich über das Essen.', expected: 'sich beschweren über' },
    { sentence: 'Ich bewerbe mich um die Stelle.', expected: 'sich bewerben um' },
    { sentence: 'Achte auf die Regeln.', expected: 'achten auf' },
    { sentence: 'Er hilft bei den Hausaufgaben.', expected: 'helfen bei' },
    { sentence: 'Wir fangen mit dem Projekt an.', expected: 'anfangen mit' },
    { sentence: 'Sie hört mit dem Rauchen auf.', expected: 'aufhören mit' },
    { sentence: 'Ich frage nach dem Weg.', expected: 'fragen nach' },
    { sentence: 'Wir suchen nach einer Lösung.', expected: 'suchen nach' },
    { sentence: 'Das Buch gehört zu mir.', expected: 'gehören zu' },
    { sentence: 'Er zählt zu den Besten.', expected: 'zählen zu' },
    { sentence: 'Wir gratulieren dir zum Geburtstag.', expected: 'gratulieren zu' },
    { sentence: 'Das passt zu dir.', expected: 'passen zu' },
    { sentence: 'Das Team besteht aus Experten.', expected: 'bestehen aus' },
    { sentence: 'Er leidet an einer Krankheit.', expected: 'leiden an' },
    { sentence: 'Sie leidet unter Stress.', expected: 'leiden unter' },
    { sentence: 'Er ist an Grippe gestorben.', expected: 'sterben an' },
    { sentence: 'Ich träume von Urlaub.', expected: 'träumen von' },
    { sentence: 'Er erzählt von seiner Reise.', expected: 'erzählen von' },
    { sentence: 'Es hängt von dir ab.', expected: 'abhängen von' },
    { sentence: 'Ich bin überzeugt von der Idee.', expected: 'überzeugen von' },
    { sentence: 'Die Creme schützt vor Sonne.', expected: 'schützen vor' },
    { sentence: 'Sie warnt vor Gefahren.', expected: 'warnen vor' },
    { sentence: 'Wir laden dich zur Party ein.', expected: 'einladen zu' }
  ];

  collocationCases.forEach(({ sentence, expected }) => {
    it(`should detect collocation: ${expected} in "${sentence}"`, async () => {
      const result = await analyzeCollocation(sentence) as any;
      const collocations = result.sentences[0].byCategory.collocation || [];
      const separable = result.sentences[0].byCategory['separable-verb'] || [];

      // Accept detection either as a collocation OR as a separable-verb (some verbs are split by spaCy)
      const foundInCollocation = collocations.some((p: any) => p.details && p.details.collocation === expected);

      // For separable verbs the detector reports the fullVerb (e.g. 'teilnehmen'), so match the verb part
      const reflexives = new Set(['sich','mich','dich','uns','euch','mir','dir','ihm','ihr','ihnen']);
      const preps = new Set(['auf','an','für','um','von','über','bei','mit','nach','zu','aus','vor','unter','an','zu','bei']);
      const parts = expected.split(' ').map(p => p.trim()).filter(Boolean);
      let expectedVerb = parts.find(p => !reflexives.has(p) && !preps.has(p));
      if (!expectedVerb) expectedVerb = parts[0];
      const foundInSeparable = separable.some((s: any) => s.details && (s.details.fullVerb === expectedVerb || s.details.verb === expectedVerb));

      // If neither is found, dump debug info to help trace why detection failed
      if (!(foundInCollocation || foundInSeparable)) {
        // Log concise debug view
        console.error('COLLOCATION-DEBUG: sentence=', sentence);
        console.error('COLLOCATION-DEBUG: collocations=', JSON.stringify(collocations, null, 2));
        console.error('COLLOCATION-DEBUG: separable=', JSON.stringify(separable, null, 2));
      }

      expect(foundInCollocation || foundInSeparable).toBe(true);
    });
  });
});
