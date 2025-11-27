import express from 'express';
import axios from 'axios';

const router = express.Router();

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const API_KEY = process.env.DEEPSEEK_API_KEY;

interface GrammarAnalysis {
  sentence: string;
  grammarPoints: {
    type: string;
    text: string;
    explanation: string;
    position: { start: number; end: number };
  }[];
  structure: string;
  explanation: string;
}

router.post('/api/grammar/analyze', async (req, res) => {
  if (!API_KEY) return res.status(500).json({ error: 'server_missing_api_key' });

  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: 'missing_text' });

  try {
    const prompt = `You are a German grammar expert for B2 level learners.

Analyze the following German text sentence by sentence. For each sentence, identify:
1. Main verb(s) and their position (V2, verb-final, etc.)
2. Case usage (Nominative, Accusative, Dative, Genitive) with examples
3. Subordinate clauses and conjunctions
4. Special grammar (Konjunktiv, Passiv, reflexive verbs, separable verbs)
5. Word order patterns

Text to analyze:
"""
${text}
"""

Return a JSON array where each element represents one sentence with this structure:
{
  "sentence": "the original sentence",
  "grammarPoints": [
    {
      "type": "verb" | "case" | "clause" | "conjunction" | "special",
      "text": "the specific word/phrase",
      "explanation": "brief explanation (1-2 sentences)",
      "position": { "start": charIndex, "end": charIndex }
    }
  ],
  "structure": "simplified sentence structure (e.g., Subject + Verb + Object)",
  "explanation": "overall grammar explanation for the sentence (2-3 sentences)"
}

Make explanations clear and concise for B2 learners. Return ONLY valid JSON.`;

    const r = await axios.post(
      DEEPSEEK_URL,
      { model: 'deepseek-chat', messages: [{ role: 'system', content: prompt }], temperature: 0.3, stream: false },
      { headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' }, timeout: 30000 }
    );

    const body = r.data;
    let content = body?.choices?.[0]?.message?.content ?? '';

    // Parse JSON from response
    let parsed: GrammarAnalysis[] = [];
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      // Try to extract JSON array from markdown code blocks
      const match = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (match) {
        parsed = JSON.parse(match[1]);
      } else {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not parse grammar analysis response');
        }
      }
    }

    return res.json({ sentences: parsed });
  } catch (err: any) {
    console.error('grammar analysis error', err?.message || err);
    return res.status(500).json({ error: 'analysis_failed', detail: String(err?.message || err) });
  }
});

export default router;
