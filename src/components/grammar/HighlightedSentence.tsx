import React, { useState } from 'react';
import { SentenceAnalysis, GrammarPoint, VocabularyPoint } from '../../types/grammar';

interface HighlightedSentenceProps {
  sentence: SentenceAnalysis;
}

interface VocabularyTooltipProps {
  vocab: VocabularyPoint;
  position: { x: number; y: number };
}

const VocabularyTooltip: React.FC<VocabularyTooltipProps> = ({ vocab, position }) => (
  <div
    className="fixed z-50 bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none max-w-sm"
    style={{
      left: `${position.x}px`,
      top: `${position.y}px`,
      transform: 'translate(-50%, -100%)',
      marginTop: '-8px'
    }}
  >
    <div className="flex items-baseline gap-2 mb-1">
      <span className="font-semibold text-base">
        {vocab.article && <span className="text-slate-400 mr-1">{vocab.article}</span>}
        {vocab.word}
      </span>
      <span className="text-xs text-green-400">{vocab.level} {vocab.pos}</span>
    </div>
    
    {vocab.plural && (
      <div className="text-slate-400 text-xs mb-1">Plural: {vocab.plural}</div>
    )}
    
    {vocab.conjugations && (
      <div className="text-slate-400 text-xs mb-1">
        {vocab.conjugations.present && <div>Present: {vocab.conjugations.present}</div>}
        {vocab.conjugations.past && <div>Past: {vocab.conjugations.past}</div>}
        {vocab.conjugations.perfect && <div>Perfect: {vocab.conjugations.perfect}</div>}
      </div>
    )}
    
    {vocab.meaning_en && (
      <div className="text-slate-300 mb-1">{vocab.meaning_en}</div>
    )}
    
    {vocab.example_sentences && vocab.example_sentences.length > 0 && (
      <div className="text-slate-400 text-xs italic border-t border-slate-700 pt-1 mt-1">
        "{vocab.example_sentences[0]}"
      </div>
    )}
  </div>
);

const colorMap: Record<GrammarPoint['type'], string> = {
  // Legacy types
  verb: 'bg-blue-200 hover:bg-blue-300',
  case: 'bg-green-200 hover:bg-green-300',
  clause: 'bg-purple-200 hover:bg-purple-300',
  conjunction: 'bg-orange-200 hover:bg-orange-300',
  special: 'bg-pink-200 hover:bg-pink-300',
  // New B2/C1 types
  collocation: 'bg-amber-200 hover:bg-amber-300',
  special_construction: 'bg-indigo-200 hover:bg-indigo-300',
  subjunctive: 'bg-rose-200 hover:bg-rose-300',
  modal: 'bg-cyan-200 hover:bg-cyan-300',
  functional_verb: 'bg-lime-200 hover:bg-lime-300',
  advanced_conjunction: 'bg-fuchsia-200 hover:bg-fuchsia-300',
  nominalization: 'bg-teal-200 hover:bg-teal-300',
  passive: 'bg-emerald-200 hover:bg-emerald-300',
};

const HighlightedSentence: React.FC<HighlightedSentenceProps> = ({ sentence }) => {
  const [hoveredVocab, setHoveredVocab] = useState<{ vocab: VocabularyPoint; position: { x: number; y: number } } | null>(null);

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
      const beforeParts = renderTextWithVocabulary(textBefore, lastIndex, vocabPoints, setHoveredVocab);
      parts.push(...beforeParts.map((p, i) => React.cloneElement(p, { key: `before-${idx}-${i}` })));
    }

    // Add highlighted region (grammar point)
    const highlighted = sentence.sentence.substring(start, end);
    const vocabHere = getVocabAtPosition(start, end);
    
    parts.push(
      <span
        key={`point-${idx}`}
        className={`${colorMap[type as GrammarPoint['type']] || colorMap.special} px-1 rounded cursor-help transition-colors relative group ${vocabHere ? 'border-b-2 border-green-600' : ''}`}
        title={explanation}
        onMouseEnter={(e) => {
          if (vocabHere) {
            const rect = e.currentTarget.getBoundingClientRect();
            setHoveredVocab({
              vocab: vocabHere,
              position: { x: rect.left + rect.width / 2, y: rect.top }
            });
          }
        }}
        onMouseLeave={() => setHoveredVocab(null)}
      >
        {highlighted}
        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10 pointer-events-none">
          {explanation}
        </span>
      </span>
    );

    lastIndex = end;
  });

  // Add remaining text (checking for vocabulary)
  if (lastIndex < sentence.sentence.length) {
    const textAfter = sentence.sentence.substring(lastIndex);
    const afterParts = renderTextWithVocabulary(textAfter, lastIndex, vocabPoints, setHoveredVocab);
    parts.push(...afterParts.map((p, i) => React.cloneElement(p, { key: `after-${i}` })));
  }

  return (
    <div className="text-base leading-relaxed relative">
      {parts}
      {hoveredVocab && <VocabularyTooltip vocab={hoveredVocab.vocab} position={hoveredVocab.position} />}
    </div>
  );
};

// Helper function to render text with vocabulary underlines
function renderTextWithVocabulary(
  text: string,
  baseOffset: number,
  vocabPoints: VocabularyPoint[],
  setHoveredVocab: (value: any) => void
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
    
    // Vocabulary word with underline
    parts.push(
      <span
        key={`vocab-${idx}`}
        className="underline decoration-2 decoration-green-500 cursor-help hover:bg-green-50 px-0.5 rounded transition-colors"
        onMouseEnter={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setHoveredVocab({
            vocab,
            position: { x: rect.left + rect.width / 2, y: rect.top }
          });
        }}
        onMouseLeave={() => setHoveredVocab(null)}
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
