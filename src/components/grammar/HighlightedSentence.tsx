import React from 'react';
import { SentenceAnalysis, GrammarPoint, VocabularyPoint, CEFRLevel } from '../../types/grammar';

interface HighlightedSentenceProps {
  sentence: SentenceAnalysis;
  onGrammarPointClick?: (sentenceIndex: number, pointIndex: number) => void;
  sentenceIndex: number;
  selectedCEFRLevels?: CEFRLevel[];
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
  'functional-verb': 'bg-lime-200 hover:bg-lime-300',
  'participial-attribute': 'bg-sky-200 hover:bg-sky-300',
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

const HighlightedSentence: React.FC<HighlightedSentenceProps> = ({ sentence, onGrammarPointClick, sentenceIndex, selectedCEFRLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] }) => {

  // Build highlighted spans from grammar points using POSITIONS (not text)
  // Keep ALL points, but track which to display based on CEFR filter
  const allPoints = [...sentence.grammarPoints].sort((a, b) => a.position.start - b.position.start);
  
  // Get vocabulary points (if any)
  const vocabPoints = sentence.vocabularyPoints || [];
  
  // Build highlight regions - use positions directly, allow overlapping
  interface HighlightRegion {
    start: number;
    end: number;
    type: string;
    explanation: string;
    originalIndex: number; // Index in sentence.grammarPoints
    level: string;
    rangeIndex: number; // Which range in multi-range group
    groupId: string; // Group related ranges together
  }
  
  const highlightRegions: HighlightRegion[] = [];
  
  // Validation function: ensure position actually points to valid text
  const isValidPosition = (start: number, end: number): boolean => {
    if (start < 0 || end > sentence.sentence.length || start >= end) return false;
    // Ensure the position points to a non-whitespace token boundary or word
    const highlighted = sentence.sentence.substring(start, end).trim();
    return highlighted.length > 0; // Must have actual content
  };
  
  // Add all points as regions, using their position data and original index
  sentence.grammarPoints.forEach((point, originalIndex) => {
    // Handle multi-range positions (new) or single position (legacy)
    const positionsArray = point.positions 
      ? point.positions 
      : (point.position ? [point.position] : []);
    
    // Create unique group ID for this grammar point
    const groupId = `point-${originalIndex}`;
    
    // Add each position range
    positionsArray.forEach((pos, rangeIndex) => {
      // Validate positions are within sentence bounds and actually point to text
      if (isValidPosition(pos.start, pos.end)) {
        // Only add to regions if this point's CEFR level is selected
        if (selectedCEFRLevels.includes(point.level)) {
          highlightRegions.push({
            start: pos.start,
            end: pos.end,
            type: point.type,
            explanation: point.explanation,
            originalIndex, // Store the original index from sentence.grammarPoints
            level: point.level,
            rangeIndex,
            groupId, // Same group ID for all ranges of this point
          });
        }
      }
    });
  });
  
  // Sort regions by start position, then by length (longer first for better visibility)
  highlightRegions.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return (b.end - b.start) - (a.end - a.start);
  });
  
  // Helper function to get all regions that overlap with a position
  const getOverlappingRegions = (start: number, end: number): HighlightRegion[] => {
    return highlightRegions.filter(region =>
      !(region.end <= start || region.start >= end) // Overlaps if not completely separate
    );
  };
  
  // Helper function to check if a position overlaps with vocabulary
  const getVocabAtPosition = (start: number, end: number): VocabularyPoint | null => {
    return vocabPoints.find(v => 
      (start >= v.startIndex && start < v.endIndex) ||
      (end > v.startIndex && end <= v.endIndex) ||
      (start <= v.startIndex && end >= v.endIndex)
    ) || null;
  };
  
  const parts: React.ReactElement[] = [];
  let pos = 0;

  while (pos < sentence.sentence.length) {
    // Find all regions that start at the current position
    const regionsAtPos = highlightRegions.filter(r => r.start === pos);
    
    if (regionsAtPos.length > 0) {
      // Find the end position (minimum end among all regions at this position)
      const minEnd = Math.min(...regionsAtPos.map(r => r.end));
      const highlighted = sentence.sentence.substring(pos, minEnd);
      const vocabHere = getVocabAtPosition(pos, minEnd);
      
      // Create tooltip with all regions that cover this span
      const allExplanations = regionsAtPos
        .map(r => `[${r.level}] ${r.type.toUpperCase()}: ${r.explanation}`)
        .join('\n');
      
      // Use the first region's color (primary highlight)
      const primaryRegion = regionsAtPos[0];
      
      parts.push(
        <span
          key={`point-${pos}-${minEnd}`}
          className={`${colorMap[primaryRegion.type as GrammarPoint['type']] || colorMap.special} px-1 rounded transition-colors cursor-pointer relative group ${
            vocabHere ? 'underline decoration-dashed decoration-2 decoration-green-500' : ''
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onGrammarPointClick?.(sentenceIndex, primaryRegion.originalIndex);
          }}
          title={allExplanations}
        >
          {highlighted}
          {regionsAtPos.length > 1 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-gray-800 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              {regionsAtPos.length}
            </span>
          )}
        </span>
      );
      
      pos = minEnd;
    } else {
      // Find the next position where a region starts
      const nextStart = Math.min(...highlightRegions.filter(r => r.start > pos).map(r => r.start));
      
      if (!isFinite(nextStart)) {
        // No more regions, add remaining text
        const remaining = sentence.sentence.substring(pos);
        const remainingParts = renderTextWithVocabulary(remaining, pos, vocabPoints);
        parts.push(...remainingParts.map((p, i) => React.cloneElement(p, { key: `remaining-${pos}-${i}` })));
        break;
      }
      
      // Add text before next region
      const textBefore = sentence.sentence.substring(pos, nextStart);
      const beforeParts = renderTextWithVocabulary(textBefore, pos, vocabPoints);
      parts.push(...beforeParts.map((p, i) => React.cloneElement(p, { key: `text-${pos}-${i}` })));
      
      pos = nextStart;
    }
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
