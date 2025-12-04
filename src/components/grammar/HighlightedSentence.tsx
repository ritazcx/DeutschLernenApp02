import React from 'react';
import { SentenceAnalysis, GrammarPoint, VocabularyPoint, CEFRLevel } from '../../types/grammar';
import { GRAMMAR_COLOR_MAP, VOCAB_LEVEL_COLORS, DEFAULT_GRAMMAR_COLOR } from './constants';
import { HighlightRegion } from './types';
import { isValidPosition, getOverlappingRegions, getVocabAtPosition } from './utils';

interface HighlightedSentenceProps {
  sentence: SentenceAnalysis;
  onGrammarPointClick?: (sentenceIndex: number, pointIndex: number) => void;
  sentenceIndex: number;
  selectedCEFRLevels?: CEFRLevel[];
}

const HighlightedSentence: React.FC<HighlightedSentenceProps> = ({ sentence, onGrammarPointClick, sentenceIndex, selectedCEFRLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] }) => {

  // Build highlighted spans from grammar points using POSITIONS (not text)
  // Keep ALL points, but track which to display based on CEFR filter
  const allPoints = [...sentence.grammarPoints].sort((a, b) => a.position.start - b.position.start);
  
  // Get vocabulary points (if any)
  const vocabPoints = sentence.vocabularyPoints || [];
  
  // Build highlight regions - use positions directly, allow overlapping
  const highlightRegions: HighlightRegion[] = [];
  
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
      if (isValidPosition(pos.start, pos.end, sentence.sentence.length)) {
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
  
  const parts: React.ReactElement[] = [];
  let pos = 0;

  while (pos < sentence.sentence.length) {
    // Find all regions that start at the current position
    const regionsAtPos = highlightRegions.filter(r => r.start === pos);
    
    if (regionsAtPos.length > 0) {
      // Find the end position (minimum end among all regions at this position)
      const minEnd = Math.min(...regionsAtPos.map(r => r.end));
      const highlighted = sentence.sentence.substring(pos, minEnd);
      const vocabHere = getVocabAtPosition(pos, minEnd, vocabPoints);
      
      // Create tooltip with all regions that cover this span
      const allExplanations = regionsAtPos
        .map(r => `[${r.level}] ${r.type.toUpperCase()}: ${r.explanation}`)
        .join('\n');
      
      // Use the first region's color (primary highlight)
      const primaryRegion = regionsAtPos[0];
      
      parts.push(
        <span
          key={`point-${pos}-${minEnd}`}
          className={`${GRAMMAR_COLOR_MAP[primaryRegion.type as GrammarPoint['type']] || DEFAULT_GRAMMAR_COLOR} px-1 rounded transition-colors cursor-pointer relative group ${
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
    const decorationColor = VOCAB_LEVEL_COLORS[vocab.level] || 'decoration-gray-500';
    
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
