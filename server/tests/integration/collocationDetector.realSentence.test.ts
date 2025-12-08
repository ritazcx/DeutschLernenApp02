/**
 * Integration test: call running server with a real sentence (no mocks)
 * Verifies that the long sentence containing 'sich ... an ... erinnern' is detected.
 */

describe('CollocationDetector - Real server integration', () => {
  const API_URL = 'http://localhost:4000/api/grammar/analyze-detection';

  async function analyze(text: string) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    return res.json();
  }

  it('detects sich erinnern an in a long, real sentence', async () => {
    const text = 'Als sie durch das alte Viertel ging, konnte sie sich plötzlich an ihre Kindheit erinnern und begann zu lächeln.';
    const result = await analyze(text) as any;

    // result shape: { sentences: [ { byCategory: { collocation: [...] } } ] }
    const collocations = (result.sentences && result.sentences[0] && result.sentences[0].byCategory && result.sentences[0].byCategory.collocation) || [];

    // Find human-readable label matching our DSL output (sich erinnern an)
    const found = collocations.some((c: any) => c.details && (c.details.collocation === 'sich erinnern an' || c.details.collocation === 'sich erinnern an'));

    if (!found) {
      // Dump debug info for immediate inspection
      console.error('REAL-INTEG-DEBUG: full result=', JSON.stringify(result, null, 2));
    }

    expect(found).toBe(true);
  }, 20000);
});
