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

  const { text, grammarTypes } = req.body || {};
  if (!text) return res.status(400).json({ error: 'missing_text' });

  console.log('Starting grammar analysis, text length:', text.length);
  console.log('Requested grammar types:', grammarTypes || 'all');
  
  // Helper function to split text into sentences with German-aware logic
  const splitIntoSentences = (text: string): string[] => {
    // Common German abbreviations that shouldn't trigger sentence breaks
    const abbreviations = [
      'z.B.', 'z. B.', 'd.h.', 'd. h.', 'usw.', 'bzw.', 'etc.', 'evtl.', 'ggf.', 'inkl.', 'ca.',
      'Dr.', 'Prof.', 'Hr.', 'Fr.', 'Str.', 'Nr.', 'Bd.', 'vgl.', 'S.', 'Tel.', 'Fax'
    ];
    
    // Month names in German for date detection
    const months = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    
    let processedText = text;
    const protectedPatterns: { placeholder: string; original: string }[] = [];
    let placeholderIndex = 0;
    
    // Protect abbreviations
    abbreviations.forEach(abbr => {
      const regex = new RegExp(abbr.replace(/\./g, '\\.'), 'g');
      processedText = processedText.replace(regex, (match) => {
        const placeholder = `__ABBR_${placeholderIndex}__`;
        protectedPatterns.push({ placeholder, original: match });
        placeholderIndex++;
        return placeholder;
      });
    });
    
    // Protect date patterns like "13. September 2007" or "5. und 21. August 2016"
    months.forEach(month => {
      // Pattern: digit(s) + period + space + month
      const datePattern = new RegExp(`(\\d+)\\. (${month})`, 'g');
      processedText = processedText.replace(datePattern, (match) => {
        const placeholder = `__DATE_${placeholderIndex}__`;
        protectedPatterns.push({ placeholder, original: match });
        placeholderIndex++;
        return placeholder;
      });
      
      // Pattern: "5. und 21. August" - two dates with "und"
      const doubleDatePattern = new RegExp(`(\\d+)\\. und (\\d+)\\. (${month})`, 'g');
      processedText = processedText.replace(doubleDatePattern, (match) => {
        const placeholder = `__DDATE_${placeholderIndex}__`;
        protectedPatterns.push({ placeholder, original: match });
        placeholderIndex++;
        return placeholder;
      });
    });
    
    // Protect ordinal numbers at start of sentences (e.g., "1. Das ist...", "2. Man muss...")
    processedText = processedText.replace(/(\n|^)(\d+)\. /g, (match, linebreak, num) => {
      const placeholder = `${linebreak}__ORD_${placeholderIndex}__ `;
      protectedPatterns.push({ placeholder: `__ORD_${placeholderIndex}__`, original: `${num}.` });
      placeholderIndex++;
      return placeholder;
    });
    
    // Protect Roman numerals followed by period (e.g., "XXXI.", "IV.", "XII.")
    processedText = processedText.replace(/\b([IVXLCDM]+)\./g, (match, roman) => {
      const placeholder = `__ROMAN_${placeholderIndex}__`;
      protectedPatterns.push({ placeholder, original: match });
      placeholderIndex++;
      return placeholder;
    });
    
    // Split by line breaks first
    const lines = processedText.split(/\n|\r\n/).filter((line: string) => line.trim().length > 0);
    const sentences: string[] = [];
    
    lines.forEach((line: string) => {
      // Split on sentence-ending punctuation followed by space and capital letter
      // Use lookahead to keep the punctuation with the sentence
      const parts = line.split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ])/);
      
      parts.forEach(part => {
        const trimmed = part.trim();
        if (trimmed.length > 0) {
          sentences.push(trimmed);
        }
      });
    });
    
    // Restore protected patterns
    return sentences.map(sentence => {
      let restored = sentence;
      protectedPatterns.forEach(({ placeholder, original }) => {
        restored = restored.replace(placeholder, original);
      });
      return restored;
    });
  };
  
  const sentences = splitIntoSentences(text);
  
  try {
    // Build grammar focus based on requested types
    const typeMapping: Record<string, string> = {
      'collocation': 'Important word collocations and fixed phrases (Wortverbindungen/Kollokationen)',
      'special_construction': 'Special verb constructions (zu + infinitive, lassen + infinitive, sein/haben + zu + infinitive, scheinen/pflegen + zu)',
      'subjunctive': 'Subjunctive mood (Konjunktiv I for indirect speech, Konjunktiv II for hypothetical/polite)',
      'modal': 'Modal verbs in complex usage (subjunctive, perfect tense, passive-like constructions)',
      'functional_verb': 'Functional verbs (Funktionsverben: zur Verfügung stellen, in Betracht ziehen, etc.)',
      'advanced_conjunction': 'Advanced conjunctions (indem, sodass, je...desto, etc.)',
      'nominalization': 'Nominalization and extended adjective phrases',
      'passive': 'Passive voice (especially state passive with sein)',
      // Legacy types
      'conjunction': 'Basic conjunctions (weil, dass, wenn)',
      'clause': 'Subordinate clauses',
      'verb': 'Verb position and conjugation',
      'case': 'Case usage (Nominativ, Akkusativ, Dativ, Genitiv)',
      'special': 'Special grammatical constructions'
    };

    const requestedTypes = grammarTypes && grammarTypes.length > 0 ? grammarTypes : Object.keys(typeMapping);
    const focusItems = requestedTypes
      .filter((t: string) => typeMapping[t])
      .map((t: string, i: number) => `${i + 1}. ${typeMapping[t]}`)
      .join('\n');

    const allowedTypes = requestedTypes.join('|');

    // Determine CEFR level based on requested grammar types
    const b1Types = ['conjunction', 'clause', 'passive', 'verb'];
    const b2Types = ['subjunctive', 'functional_verb', 'special_construction', 'collocation', 'advanced_conjunction', 'modal'];
    const c1Types = ['nominalization', 'case', 'special'];
    
    const hasB1 = requestedTypes.some((t: string) => b1Types.includes(t));
    const hasB2 = requestedTypes.some((t: string) => b2Types.includes(t));
    const hasC1 = requestedTypes.some((t: string) => c1Types.includes(t));
    
    let levelDescription = 'B1-C1';
    if (hasC1 && !hasB2 && !hasB1) {
      levelDescription = 'C1 (advanced)';
    } else if (hasB2 && !hasC1 && !hasB1) {
      levelDescription = 'B2 (upper intermediate)';
    } else if (hasB1 && !hasB2 && !hasC1) {
      levelDescription = 'B1 (intermediate)';
    } else if (hasB2 && hasC1) {
      levelDescription = 'B2-C1 (upper intermediate to advanced)';
    } else if (hasB1 && hasB2) {
      levelDescription = 'B1-B2 (intermediate to upper intermediate)';
    }

    const prompt = `You are a German grammar expert analyzing text for ${levelDescription} level learners. Analyze each German sentence and identify the MOST IMPORTANT grammar points from the requested categories.

Sentences to analyze:
${sentences.map((s: string, i: number) => `${i + 1}. ${s.trim()}`).join('\n')}

FOCUS ONLY ON these grammar elements:
${focusItems}

SKIP basic grammar that learners at this level should already know:
- Simple verb positions (V2, verb-final) unless specifically requested or particularly complex
- Basic case marking unless part of a fixed phrase, idiom, or specifically requested
- Common prepositions (an, in, mit, etc.) unless in special constructions or specifically requested
- Simple tenses and basic conjugations unless specifically requested
- Basic subordinating conjunctions (weil, dass, wenn, ob) unless specifically requested

For each sentence:
1. Provide English translation
2. Identify 1-3 important grammar points ONLY from the requested types (or 0 if sentence is too simple)
3. Be selective - only mark elements that are relevant for the target level and requested categories

IMPORTANT: For separable verbs and non-contiguous elements, use "..." (e.g., "stellt...zur Verfügung").

Return JSON array:
[{
  "sentence": "exact copy of original sentence",
  "translation": "English translation",
  "grammarPoints": [
    {
      "type": "${allowedTypes}",
      "text": "exact word/phrase from sentence (use ... for gaps)",
      "explanation": "concise B2-level explanation"
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
