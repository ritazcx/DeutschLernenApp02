export interface GrammarPoint {
  type: 'verb' | 'case' | 'clause' | 'conjunction' | 'special';
  text: string;
  explanation: string;
  position: { start: number; end: number };
}

export interface SentenceAnalysis {
  sentence: string;
  grammarPoints: GrammarPoint[];
  structure: string;
  explanation: string;
}

export interface ArticleAnalysis {
  sentences: SentenceAnalysis[];
}
