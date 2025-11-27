export interface GrammarPoint {
  type: 'verb' | 'case' | 'clause' | 'conjunction' | 'special';
  text: string;
  explanation: string;
  position: { start: number; end: number };
}

export interface SentenceAnalysis {
  sentence: string;
  translation: string;
  grammarPoints: GrammarPoint[];
}

export interface ArticleAnalysis {
  sentences: SentenceAnalysis[];
}
