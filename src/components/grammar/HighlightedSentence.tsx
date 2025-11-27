import React from 'react';
import { SentenceAnalysis, GrammarPoint } from '../../types/grammar';

interface HighlightedSentenceProps {
  sentence: SentenceAnalysis;
}

const colorMap: Record<GrammarPoint['type'], string> = {
  verb: 'bg-blue-200 hover:bg-blue-300',
  case: 'bg-green-200 hover:bg-green-300',
  clause: 'bg-purple-200 hover:bg-purple-300',
  conjunction: 'bg-orange-200 hover:bg-orange-300',
  special: 'bg-pink-200 hover:bg-pink-300',
};

const HighlightedSentence: React.FC<HighlightedSentenceProps> = ({ sentence }) => {
  // Build highlighted spans from grammar points
  const points = [...sentence.grammarPoints].sort((a, b) => a.position.start - b.position.start);
  
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
  
  const parts: React.ReactElement[] = [];
  let lastIndex = 0;

  highlightRegions.forEach((region, idx) => {
    const { start, end, type, explanation } = region;
    
    // Add text before this region
    if (start > lastIndex) {
      parts.push(
        <span key={`text-${idx}`}>
          {sentence.sentence.substring(lastIndex, start)}
        </span>
      );
    }

    // Add highlighted region
    const highlighted = sentence.sentence.substring(start, end);
    parts.push(
      <span
        key={`point-${idx}`}
        className={`${colorMap[type as GrammarPoint['type']] || colorMap.special} px-1 rounded cursor-help transition-colors relative group`}
        title={explanation}
      >
        {highlighted}
        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10 pointer-events-none">
          {explanation}
        </span>
      </span>
    );

    lastIndex = end;
  });

  // Add remaining text
  if (lastIndex < sentence.sentence.length) {
    parts.push(
      <span key="text-end">
        {sentence.sentence.substring(lastIndex)}
      </span>
    );
  }

  return <div className="text-base leading-relaxed">{parts}</div>;
};

export default HighlightedSentence;
