import express from 'express';
import axios from 'axios';

const router = express.Router();

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const API_KEY = process.env.DEEPSEEK_API_KEY;

interface GrammarAnalysis {
  sentence: string;
  translation: string;
  grammarPoints: {
    type: string;
    text: string;
    explanation: string;
    position?: { start: number; end: number };
  }[];
}

router.post('/api/grammar/analyze', async (req, res) => {
  if (!API_KEY) {
    console.error('Missing DEEPSEEK_API_KEY');
    return res.status(500).json({ error: 'server_missing_api_key' });
  }

  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: 'missing_text' });

  console.log('Starting grammar analysis, text length:', text.length);
  
  // Split text into sentences: by line breaks or sentence-ending punctuation
  let sentenceList: string[] = [];
  
  // First split by line breaks
  const lines = text.split(/\n|\r\n/).filter((line: string) => line.trim().length > 0);
  
  // Then split each line by sentence-ending punctuation
  lines.forEach((line: string) => {
    const sentencesByPunctuation = line.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [line];
    sentencesByPunctuation.forEach((sentence: string) => {
      const trimmed = sentence.trim();
      if (trimmed.length > 0) {
        sentenceList.push(trimmed);
      }
    });
  });
  
  const sentences = sentenceList;
  
  try {
    const prompt = `You are a German grammar expert for B2 level learners. Analyze each German sentence and identify the MOST IMPORTANT grammar points that B2 learners need to understand.

Sentences to analyze:
${sentences.map((s: string, i: number) => `${i + 1}. ${s.trim()}`).join('\n')}

For each sentence, provide:
1. English translation
2. 3-5 key grammar points focusing on:
   - Verb position and conjugation (especially V2, verb-final in subordinate clauses, separable verbs)
   - Case usage (Nominativ, Akkusativ, Dativ, Genitiv) with the specific noun phrases
   - Subordinate clauses and conjunctions (weil, dass, wenn, etc.)
   - Special constructions (Konjunktiv, Passiv, reflexive verbs, comparative/superlative)
   - Important prepositions and their cases

IMPORTANT: For separable verbs and non-contiguous grammar points, use "..." to indicate the gap.
For example: "macht...eine Pause" or "an...vorbei".

Return JSON array:
[{
  "sentence": "exact copy of original sentence",
  "translation": "English translation",
  "grammarPoints": [
    {
      "type": "verb|case|clause|conjunction|special",
      "text": "the exact word or phrase from the sentence (use ... for separable verbs)",
      "explanation": "clear B2-level explanation in English"
    }
  ]
}]

Analyze ALL sentences. Return ONLY valid JSON.`;

    console.log('Calling DeepSeek API...');
    const r = await axios.post(
      DEEPSEEK_URL,
      { model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], temperature: 0.3, stream: false },
      { 
        headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' }, 
        timeout: 90000,
        validateStatus: () => true
      }
    );

    if (r.status !== 200) {
      console.error('DeepSeek API error:', r.status, r.data);
      throw new Error(`API returned ${r.status}`);
    }

    console.log('DeepSeek API responded');
    const body = r.data;
    let content = body?.choices?.[0]?.message?.content ?? '';
    console.log('Response content length:', content.length);
    console.log('Raw response:', content.substring(0, 500));

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

    // Validate and fix positions by finding actual text in sentences
    const validatedSentences = parsed.map((sentenceAnalysis, idx) => {
      const originalSentence = sentences[idx]?.trim();
      
      // Use the original sentence to prevent AI-induced duplications
      const sentence = originalSentence || sentenceAnalysis.sentence;
      
      // Fix grammar point positions based on actual text
      const fixedGrammarPoints = sentenceAnalysis.grammarPoints
        .map(point => {
          const textToFind = point.text.trim();
          let index = -1;
          let endIndex = -1;
          
          // Handle separable verbs and non-contiguous phrases with "..."
          if (textToFind.includes('...')) {
            const parts = textToFind.split('...').map(p => p.trim()).filter(p => p.length > 0);
            if (parts.length === 2) {
              const firstIndex = sentence.indexOf(parts[0]);
              const secondIndex = sentence.indexOf(parts[1]);
              if (firstIndex !== -1 && secondIndex !== -1 && secondIndex > firstIndex) {
                // Highlight from start of first part to end of second part
                index = firstIndex;
                endIndex = secondIndex + parts[1].length;
              } else if (firstIndex !== -1) {
                // Fall back to just the first part
                index = firstIndex;
                endIndex = firstIndex + parts[0].length;
              }
            }
          }
          
          // Try to find the exact text
          if (index === -1) {
            index = sentence.indexOf(textToFind);
            if (index !== -1) {
              endIndex = index + textToFind.length;
            }
          }
          
          // If not found, try case-insensitive search
          if (index === -1) {
            const lowerSentence = sentence.toLowerCase();
            const lowerText = textToFind.toLowerCase();
            index = lowerSentence.indexOf(lowerText);
            if (index !== -1) {
              endIndex = index + textToFind.length;
            }
          }
          
          // If still not found, try to find first word only
          if (index === -1) {
            const words = textToFind.split(/\s+/);
            if (words.length > 0) {
              index = sentence.indexOf(words[0]);
              if (index !== -1) {
                endIndex = index + words[0].length;
              }
            }
          }
          
          if (index === -1) {
            console.log(`Could not find "${textToFind}" in "${sentence}"`);
          }
          
          return {
            ...point,
            position: index !== -1 
              ? { start: index, end: endIndex || index + textToFind.length }
              : { start: -1, end: -1 }
          };
        })
        .filter(point => point.position.start >= 0); // Remove invalid positions
      
      return {
        ...sentenceAnalysis,
        sentence,
        grammarPoints: fixedGrammarPoints
      };
    });

    return res.json({ sentences: validatedSentences });
  } catch (err: any) {
    console.error('grammar analysis error:', err?.response?.data || err?.message || err);
    const detail = err?.code === 'ECONNABORTED' ? 'timeout' : String(err?.message || err);
    return res.status(500).json({ error: 'analysis_failed', detail });
  }
});

export default router;
