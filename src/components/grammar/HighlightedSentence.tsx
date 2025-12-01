import React from 'react';
import { SentenceAnalysis, GrammarPoint, VocabularyPoint, CEFRLevel } from '../../types/grammar';

interface HighlightedSentenceProps {
  sentence: SentenceAnalysis;
  onGrammarPointClick?: (sentenceIndex: number, pointIndex: number) => void;
  sentenceIndex: number;
}

// CEFR level color mapping for vocabulary
const vocabLevelColors: Record<string, string> = {
  'A1': 'decoration-red-500',
  'A2': 'decoration-orange-500',
  'B1': 'decoration-green-500',
  'B2': 'decoration-blue-500',
  'C1': 'decoration-purple-500',
  'C2': 'decoration-pink-500',
};

const colorMap: Record<GrammarPoint['type'], string> = {
  // Backend categories with distinct colors
  tense: 'bg-blue-200 hover:bg-blue-300',
  case: 'bg-green-200 hover:bg-green-300',
  mood: 'bg-purple-200 hover:bg-purple-300',
  voice: 'bg-red-200 hover:bg-red-300',
  'verb-form': 'bg-indigo-200 hover:bg-indigo-300',
  preposition: 'bg-yellow-200 hover:bg-yellow-300',
  conjunction: 'bg-orange-200 hover:bg-orange-300',
  agreement: 'bg-pink-200 hover:bg-pink-300',
  'word-order': 'bg-cyan-200 hover:bg-cyan-300',
  article: 'bg-lime-200 hover:bg-lime-300',
  pronoun: 'bg-emerald-200 hover:bg-emerald-300',
  adjective: 'bg-teal-200 hover:bg-teal-300',
  noun: 'bg-violet-200 hover:bg-violet-300',
  'separable-verb': 'bg-rose-200 hover:bg-rose-300',
  'modal-verb': 'bg-amber-200 hover:bg-amber-300',
  collocation: 'bg-fuchsia-200 hover:bg-fuchsia-300',
  'special-construction': 'bg-slate-200 hover:bg-slate-300',
  // Legacy types (backward compatibility)
  verb: 'bg-blue-200 hover:bg-blue-300',
  clause: 'bg-purple-200 hover:bg-purple-300',
  special: 'bg-pink-200 hover:bg-pink-300',
  special_construction: 'bg-slate-200 hover:bg-slate-300',
  subjunctive: 'bg-rose-200 hover:bg-rose-300',
  modal: 'bg-amber-200 hover:bg-amber-300',
  functional_verb: 'bg-lime-200 hover:bg-lime-300',
  advanced_conjunction: 'bg-fuchsia-200 hover:bg-fuchsia-300',
  nominalization: 'bg-teal-200 hover:bg-teal-300',
  passive: 'bg-red-200 hover:bg-red-300',
};

const HighlightedSentence: React.FC<HighlightedSentenceProps> = ({ sentence, onGrammarPointClick, sentenceIndex }) => {

  // Build highlighted spans from grammar points
  const points = [...sentence.grammarPoints].sort((a, b) => a.position.start - b.position.start);
  
  // Get vocabulary points (if any)
  const vocabPoints = sentence.vocabularyPoints || [];
  
  // Filter out overlapping points - keep only the first one
  const filteredPoints: typeof points = [];
  points.forEach(point => {
    const overlaps = filteredPoints.some(
      existing => 
        (point.position.start >= existing.position.start && point.position.start < existing.position.end) ||
        (point.position.end > existing.position.start && point.position.end <= existing.position.end) ||
        (point.position.start <= existing.position.start && point.position.end >= existing.position.end)
    );
    if (!overlaps) {
      filteredPoints.push(point);
    }
  });
  
  // Build highlight regions - for separable verbs, only highlight the two parts
  interface HighlightRegion {
    start: number;
    end: number;
    type: string;
    explanation: string;
  }
  
  const highlightRegions: HighlightRegion[] = [];
  
  filteredPoints.forEach(point => {
    // Check if this is a non-contiguous phrase (contains "...")
    if (point.text.includes('...')) {
      const parts = point.text.split('...').map(p => p.trim()).filter(p => p.length > 0);
      if (parts.length === 2) {
        const firstIndex = sentence.sentence.indexOf(parts[0]);
        const secondIndex = sentence.sentence.indexOf(parts[1]);
        
        if (firstIndex !== -1) {
          highlightRegions.push({
            start: firstIndex,
            end: firstIndex + parts[0].length,
            type: point.type,
            explanation: point.explanation
          });
        }
        
        if (secondIndex !== -1) {
          highlightRegions.push({
            start: secondIndex,
            end: secondIndex + parts[1].length,
            type: point.type,
            explanation: point.explanation
          });
        }
      }
    } else {
      // Regular contiguous phrase
      highlightRegions.push({
        start: point.position.start,
        end: point.position.end,
        type: point.type,
        explanation: point.explanation
      });
    }
  });
  
  // Sort regions by start position
  highlightRegions.sort((a, b) => a.start - b.start);
  
  // Helper function to check if a position overlaps with vocabulary
  const getVocabAtPosition = (start: number, end: number): VocabularyPoint | null => {
    return vocabPoints.find(v => 
      (start >= v.startIndex && start < v.endIndex) ||
      (end > v.startIndex && end <= v.endIndex) ||
      (start <= v.startIndex && end >= v.endIndex)
    ) || null;
  };
  
  const parts: React.ReactElement[] = [];
  let lastIndex = 0;

  highlightRegions.forEach((region, idx) => {
    const { start, end, type, explanation } = region;
    
    // Add text before this region (checking for vocabulary)
    if (start > lastIndex) {
      const textBefore = sentence.sentence.substring(lastIndex, start);
      const beforeParts = renderTextWithVocabulary(textBefore, lastIndex, vocabPoints);
      parts.push(...beforeParts.map((p, i) => React.cloneElement(p, { key: `before-${idx}-${i}` })));
    }

    // Add highlighted region (grammar point)
    const highlighted = sentence.sentence.substring(start, end);
    const vocabHere = getVocabAtPosition(start, end);
    
    parts.push(
      <span
        key={`point-${idx}`}
        className={`${colorMap[type as GrammarPoint['type']] || colorMap.special} px-1 rounded transition-colors cursor-pointer ${vocabHere ? 'underline decoration-dashed decoration-2 decoration-green-500' : ''}`}
        onClick={() => onGrammarPointClick?.(sentenceIndex, idx)}
        title={`Click to view explanation: ${explanation}`}
      >
        {highlighted}
      </span>
    );

    lastIndex = end;
  });

  // Add remaining text (checking for vocabulary)
  if (lastIndex < sentence.sentence.length) {
    const textAfter = sentence.sentence.substring(lastIndex);
    const afterParts = renderTextWithVocabulary(textAfter, lastIndex, vocabPoints);
    parts.push(...afterParts.map((p, i) => React.cloneElement(p, { key: `after-${i}` })));
  }

  return (
    <div className="text-base leading-relaxed relative">
      {parts}
    </div>
  );
};

// Helper function to render text with vocabulary underlines
function renderTextWithVocabulary(
  text: string,
  baseOffset: number,
  vocabPoints: VocabularyPoint[]
): React.ReactElement[] {
  const parts: React.ReactElement[] = [];
  
  // Find vocabulary points that overlap with this text segment
  const relevantVocab = vocabPoints.filter(v => 
    v.startIndex >= baseOffset && v.endIndex <= baseOffset + text.length
  ).sort((a, b) => a.startIndex - b.startIndex);
  
  let lastIdx = 0;
  
  relevantVocab.forEach((vocab, idx) => {
    const relativeStart = vocab.startIndex - baseOffset;
    const relativeEnd = vocab.endIndex - baseOffset;
    
    // Text before vocabulary
    if (relativeStart > lastIdx) {
      parts.push(
        <span key={`text-${idx}`}>
          {text.substring(lastIdx, relativeStart)}
        </span>
      );
    }
    
    // Determine decoration color based on vocabulary level
    const decorationColor = vocabLevelColors[vocab.level] || 'decoration-gray-500';
    
    // Vocabulary word with underline
    parts.push(
      <span
        key={`vocab-${idx}`}
        className={`underline decoration-dashed decoration-2 ${decorationColor}`}
      >
        {text.substring(relativeStart, relativeEnd)}
      </span>
    );
    
    lastIdx = relativeEnd;
  });
  
  // Remaining text
  if (lastIdx < text.length) {
    parts.push(
      <span key="text-end">
        {text.substring(lastIdx)}
      </span>
    );
  }
  
  return parts;
}

export default HighlightedSentence;
