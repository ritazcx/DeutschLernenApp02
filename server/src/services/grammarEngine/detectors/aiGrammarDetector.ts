/**
 * AI Grammar Detector
 * Uses AI (DeepSeek) as fallback for grammar analysis when rule-based detectors miss patterns
 */

import axios from 'axios';
import { BaseGrammarDetector, DetectionResult, SentenceData } from './baseDetector';
import { GrammarCategory, CEFRLevel, B1_GRAMMAR } from '../cefr-taxonomy';

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const API_KEY = process.env.DEEPSEEK_API_KEY;

interface AIGrammarPoint {
  category: GrammarCategory;
  level: CEFRLevel;
  pattern: string;
  explanation: string;
  position: {
    start: number;
    end: number;
  };
  confidence: number;
}

export class AIGrammarDetector extends BaseGrammarDetector {
  name = 'AI Grammar Detector';
  category: GrammarCategory = 'verb-form'; // Default category, will be overridden by AI

  detect(sentenceData: SentenceData): DetectionResult[] {
    // For AI detection, we'll need to make this synchronous or handle differently
    // Since we can't make async calls in detect(), we'll return empty and handle in analyzeGrammar
    return [];
  }

  // Custom method for async AI detection
  async detectAsync(sentenceData: SentenceData): Promise<DetectionResult[]> {
    if (!API_KEY) {
      console.warn('DEEPSEEK_API_KEY not set, skipping AI grammar detection');
      return [];
    }

    try {
      const aiAnalysis = await this.analyzeWithAI(sentenceData.text);

      if (!aiAnalysis || aiAnalysis.length === 0) {
        return [];
      }

      return aiAnalysis.map((point) => this.convertToDetectionResult(point, sentenceData));
    } catch (error) {
      console.error('AI grammar detection failed:', error);
      return [];
    }
  }

  private async analyzeWithAI(text: string): Promise<AIGrammarPoint[]> {
    const prompt = `Analyze this German sentence for B1-level grammar patterns: "${text}"

Look for: separable verbs, modal verbs, case usage, adjective endings, word order, compound nouns.

Return JSON array with: category, level, pattern, explanation, position {start,end}, confidence.

Example: [{"category":"separable-verb","level":"B1","pattern":"aufmachen","explanation":"Separable verb with ge- prefix","position":{"start":10,"end":18},"confidence":0.9}]

Return only valid JSON array, empty [] if none found.`;

    const response = await axios.post(
      DEEPSEEK_URL,
      {
        model: 'deepseek-chat',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // Reduced timeout
      }
    );

    const content = response.data.choices?.[0]?.message?.content;
    if (!content) {
      return [];
    }

    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Failed to parse AI grammar analysis:', error);
      return [];
    }
  }

  private convertToDetectionResult(
    aiPoint: AIGrammarPoint,
    sentenceData: SentenceData
  ): DetectionResult {
    // Find the grammar point definition from our taxonomy
    const grammarPoint = this.findGrammarPoint(aiPoint.category, aiPoint.pattern);

    return {
      grammarPointId: grammarPoint?.id || `ai-${aiPoint.category}-${Date.now()}`,
      grammarPoint: grammarPoint || {
        id: `ai-${aiPoint.category}-${Date.now()}`,
        category: aiPoint.category,
        level: aiPoint.level,
        name: aiPoint.pattern,
        description: aiPoint.explanation,
        examples: [sentenceData.text],
      },
      position: aiPoint.position,
      confidence: Math.min(aiPoint.confidence, 0.8), // Cap AI confidence to leave room for rule-based
      details: {
        explanation: aiPoint.explanation,
        detector: this.name,
        aiGenerated: true,
      },
    };
  }

  private findGrammarPoint(category: GrammarCategory, pattern: string) {
    // Try to match against our predefined grammar points
    const categoryPoints = B1_GRAMMAR[category as keyof typeof B1_GRAMMAR];
    if (!categoryPoints) return null;

    // Look for similar patterns
    for (const point of Object.values(categoryPoints)) {
      if (point.name.toLowerCase().includes(pattern.toLowerCase()) ||
          pattern.toLowerCase().includes(point.name.toLowerCase())) {
        return point;
      }
    }

    return null;
  }

  getName(): string {
    return this.name;
  }
}