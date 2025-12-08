/**
 * B2-level integration tests: long/complex sentences with reflexive/verb-prep collocations
 * Posts sentences to the running server on port 4000 and asserts detection.
 */

describe('Collocation Detection B2 Long Sentence Integration Tests', () => {
  const API_URL = 'http://localhost:4000/api/grammar/analyze-detection';

  async function analyzeCollocation(text: string) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    return response.json();
  }

  const cases = [
    {
      sentence: 'Als sie auf dem Rückweg durch die regennassen Straßen ging, erinnerte sie sich plötzlich an die Stunden, die sie als Kind mit ihrem Großvater im Garten verbracht hatte.',
      expected: 'sich erinnern an'
    },
    {
      sentence: 'Nachdem er den langen Artikel über die wirtschaftliche Lage gelesen hatte, freute er sich sehr auf das Gespräch mit dem Mentor, obwohl die Vorbereitungszeit knapp war.',
      expected: 'sich freuen auf'
    },
    {
      sentence: 'Obwohl sie wegen der Arbeit wenig Zeit hatte und oft müde war, interessierte sie sich weiterhin für klassische Musik, die ihr seit der Jugend Trost gespendet hatte.',
      expected: 'sich interessieren für'
    },
    {
      sentence: 'Sie beschloss, trotz der Zweifel und der weiten Anreise an dem international besetzten Seminar teilzunehmen, in dem renommierte Wissenschaftler ihre neuesten Erkenntnisse vorstellen würden.',
      expected: 'teilnehmen an'
    },
    {
      sentence: 'Wenn man sich an die Instruktionen hält und die Absprachen genau befolgt, kann man sich auf einen reibungslosen Ablauf verlassen, auch wenn viele externe Faktoren ins Spiel kommen.',
      expected: 'sich verlassen auf'
    }
  ];

  cases.forEach(({ sentence, expected }) => {
    it(`detects "${expected}" in a long B2 sentence`, async () => {
      const result = await analyzeCollocation(sentence) as any;
      const collocations = result.sentences[0].byCategory.collocation || [];
      const separable = result.sentences[0].byCategory['separable-verb'] || [];

      const foundInCollocation = collocations.some((p: any) => p.details && p.details.collocation === expected);

      // allow separable-verb fallback for verbs that may be analyzed as separable
      const reflexives = new Set(['sich','mich','dich','uns','euch','mir','dir','ihm','ihr','ihnen']);
      const preps = new Set(['auf','an','für','um','von','über','bei','mit','nach','zu','aus','vor','unter']);
      const parts = expected.split(' ').map(p => p.trim()).filter(Boolean);
      let expectedVerb = parts.find(p => !reflexives.has(p) && !preps.has(p));
      if (!expectedVerb) expectedVerb = parts[0];
      const foundInSeparable = separable.some((s: any) => s.details && (s.details.fullVerb === expectedVerb || s.details.verb === expectedVerb));

      if (!(foundInCollocation || foundInSeparable)) {
        console.error('B2-COLLOCATION-DEBUG: sentence=', sentence);
        console.error('B2-COLLOCATION-DEBUG: collocations=', JSON.stringify(collocations, null, 2));
        console.error('B2-COLLOCATION-DEBUG: separable=', JSON.stringify(separable, null, 2));
      }

      expect(foundInCollocation || foundInSeparable).toBe(true);
    }, 20000);
  });
});
