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
  const parts: React.ReactElement[] = [];
  let lastIndex = 0;

  points.forEach((point, idx) => {
    const { start, end } = point.position;
    
    // Add text before this point
    if (start > lastIndex) {
      parts.push(
        <span key={`text-${idx}`}>
          {sentence.sentence.substring(lastIndex, start)}
        </span>
      );
    }

    // Add highlighted point
    const highlighted = sentence.sentence.substring(start, end);
    parts.push(
      <span
        key={`point-${idx}`}
        className={`${colorMap[point.type]} px-1 rounded cursor-help transition-colors relative group`}
        title={point.explanation}
      >
        {highlighted}
        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10 pointer-events-none">
          {point.explanation}
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
